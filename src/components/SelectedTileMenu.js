import React from "react"
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Image from "react-bootstrap/Image";

export const SelectedTileMenu = (props) => {

  const tileId = props.kvPairs[1].valuename;
  const pmList = props.kvPairs[3].valuename;

  const selectedTileBounds = props.tileBoundsData.tileIdToBounds[tileId];
  const fullScaleTileWidth = selectedTileBounds.maxX - selectedTileBounds.minX;
  const fullScaleTileHeight = selectedTileBounds.maxY - selectedTileBounds.minY;
  const tileImageWidth = 240;
  const tileScaleForMenu = tileImageWidth / fullScaleTileWidth;
  const tileImageHeight = fullScaleTileHeight * tileScaleForMenu;

  // need to explicitly set image width and height so that dropdown placement works at edge of view
  const tileImageStyle = {
    padding: "5px 20px 0 20px",
    width: tileImageWidth,
    height: tileImageHeight
  };

  const tileSpecUrl = props.dataStackUrl + "/tile/" + tileId;
  const tileImageUrl = props.renderStackUrl + "/tile/" + tileId + "/jpeg-image";
  const menuTileImageUrl = tileImageUrl + "?scale=" + tileScaleForMenu;

  const menuPositionStyle = {
    position: "absolute",
    left: props.x,
    top: props.y
  };

  const subMenuPositionStyle = {
    paddingLeft: "20px"
  };

  const renderWsIndex = props.renderStackUrl.indexOf("render-ws");
  const renderViewUrl = props.renderStackUrl.substring(0, renderWsIndex) + "render-ws/view";
  const viewContextParameters = "renderStackOwner=" + props.userInput.selectedStackOwner +
                                "&renderStackProject=" + props.userInput.selectedProject +
                                "&renderStack=" + props.userInput.selectedStack +
                                "&matchOwner=" + props.userInput.selectedMatchOwner +
                                "&matchCollection=" + props.userInput.selectedMatchCollection;

  // try to fit 3 tiles across in neighbors view
  const neighborsViewRenderScale = window.innerWidth / (3 * (fullScaleTileWidth + 10));

  const neighborsUrl = renderViewUrl + "/tile-with-neighbors.html?tileId=" + tileId +
                       "&renderScale=" + neighborsViewRenderScale + "&" + viewContextParameters;


  // try to fit 2 tiles across in pair view
  const pairViewRenderScale = window.innerWidth / (2 * (fullScaleTileWidth + 10));

  const getTilePairUrl = function (pId, qId) {
    return renderViewUrl + "/tile-pair.html?pId=" + pId + "&qId=" + qId +
           "&renderScale=" + pairViewRenderScale + "&" + viewContextParameters;
  };

  const currentVersion = props.stackMetadata.currentVersion;
  const resTileCenterX = ((selectedTileBounds.minX + selectedTileBounds.maxX) / 2) * currentVersion.stackResolutionX;
  const resTileCenterY = ((selectedTileBounds.minY + selectedTileBounds.maxY) / 2) * currentVersion.stackResolutionY;
  const resTileZ = selectedTileBounds.z * currentVersion.stackResolutionZ;

  const getCatmaidUrl = function (mipmapLevel) {
    return "http://" + props.userInput.catmaidHost + "/?" +
           "pid=" + props.userInput.selectedStackOwner + "__" + props.userInput.selectedProject +
           "&sid0=" + props.userInput.selectedStack +
           "&zp=" + resTileZ + "&yp=" + resTileCenterY + "&xp=" + resTileCenterX +
           "&tool=navigator" +
           "&s0=" + mipmapLevel;
  };

  const getRelativePosition = function(fromBounds, toBounds) {

    const deltaX = toBounds.minX - fromBounds.minX;
    const deltaY = toBounds.minY - fromBounds.minY;
    const angleRadians = Math.atan2(deltaY, deltaX);
    const angleDegrees = Math.floor(angleRadians * 180 / Math.PI);

    const pctDeltaX = Math.abs(deltaX / (fromBounds.maxX - fromBounds.minX));
    const pctDeltaY = Math.abs(deltaY / (fromBounds.maxY - fromBounds.minY));
    const maxOffsetPercentage = Math.max(pctDeltaX, pctDeltaY) * 100;

    return {
      angleDegrees: angleDegrees,
      maxOffsetPercentage: maxOffsetPercentage
    }

  };

  const getPairItem = function(pId, qId, otherTileBounds, matchCount) {
    const relativePosition = getRelativePosition(selectedTileBounds, otherTileBounds);
    const arrowContainerStyle = {
      transform: "rotate(" + relativePosition.angleDegrees + "deg)"
    };
    let arrowStyle;
    let tilePairClasses = "tilePairArrow";
    if (relativePosition.maxOffsetPercentage < 10.0) {
      arrowStyle = {
        height: "9px",
        margin: "3px"
      };
    } else {
      tilePairClasses += " tilePairOffset";
    }
    const pairLabel = otherTileBounds.tileId + " (" + matchCount + " matches, " + "z " + otherTileBounds.z + ")";
    return <Dropdown.Item
      href={getTilePairUrl(pId, qId)}
      target="_blank">
      <div className="tilePairArrowContainer" style={arrowContainerStyle}>
        <span className={tilePairClasses} style={arrowStyle}/>
      </div>
      {pairLabel}
    </Dropdown.Item>;
  };

  const getLayerPairsMenu = function(context, layerPairItems) {
    let layerPairsMenu = null;
    if (layerPairItems.length > 0) {
      const titleSuffix = layerPairItems.length > 1 ? "s" : "";
      const buttonTitle = layerPairItems.length + " " + context + " Layer Pair" + titleSuffix;
      const buttonId = context + "-layer-matches-button";
      layerPairsMenu =
        <DropdownButton style={subMenuPositionStyle} id={buttonId} title={buttonTitle} drop="right" key="right" variant="light">
          {layerPairItems}
        </DropdownButton>;
    }
    return layerPairsMenu;
  };

  let preLayerMatchPairsMenu = null;
  let sameLayerMatchPairsMenu = null;
  let postLayerMatchPairsMenu = null;

  if (props.hasMatchCounts) {

    const preLayerPairItems = [];
    const sameLayerPairItems = [];
    const postLayerPairItems = [];

    pmList.forEach(pmInfo => {

      let otherTileBounds;
      if (pmInfo.pId === tileId) {
        otherTileBounds = props.tileBoundsData.tileIdToBounds[pmInfo.qId];
      } else { // qId
        otherTileBounds = props.tileBoundsData.tileIdToBounds[pmInfo.pId];
      }

      const pairItem = getPairItem(pmInfo.pId, pmInfo.qId, otherTileBounds, pmInfo.connection_strength);

      if (otherTileBounds.z < selectedTileBounds.z) {
        preLayerPairItems.push(pairItem);
      } else if (otherTileBounds.z > selectedTileBounds.z) {
        postLayerPairItems.push(pairItem);
      } else {
        sameLayerPairItems.push(pairItem);
      }

    });

    preLayerMatchPairsMenu = getLayerPairsMenu("Prior", preLayerPairItems);
    sameLayerMatchPairsMenu = getLayerPairsMenu("Same", sameLayerPairItems);
    postLayerMatchPairsMenu = getLayerPairsMenu("Post", postLayerPairItems);
  }

  const menuTitle = "Tile " + tileId;
  const zInfo = "z: " + selectedTileBounds.z;
  const menuHeader = props.hasMatchCounts ? zInfo : zInfo + " (missing match counts)";

  return <DropdownButton style={menuPositionStyle} id="selected-tile-menu-button" title={menuTitle}>

    <Dropdown.Header>{menuHeader}</Dropdown.Header>

    <DropdownButton class="tileSubMenu" style={subMenuPositionStyle} id="view-submenu-button" title={"View"} drop="right" key="right" variant="light">
      {preLayerMatchPairsMenu}
      {sameLayerMatchPairsMenu}
      {postLayerMatchPairsMenu}
      <Dropdown.Item href={tileSpecUrl} target="_blank">Tile Spec</Dropdown.Item>
      <Dropdown.Item href={tileImageUrl} target="_blank">Full Scale Tile</Dropdown.Item>
      <Dropdown.Item href={neighborsUrl} target="_blank">Neighbor Matches</Dropdown.Item>
      <Dropdown.Item href={getCatmaidUrl(1.5)} target="_blank">Tile in CATMAID</Dropdown.Item>
    </DropdownButton>

    <Image src={menuTileImageUrl} style={tileImageStyle} />

  </DropdownButton>;

};
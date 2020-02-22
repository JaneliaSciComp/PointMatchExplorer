import React from "react"
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Image from "react-bootstrap/Image";
import {TilePairMenuItem} from "./TilePairMenuItem";
import {TilePairGroupSubMenu} from "./TilePairGroupSubMenu";

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

  const renderWsIndex = props.renderStackUrl.indexOf("render-ws");
  const renderViewUrl = props.renderStackUrl.substring(0, renderWsIndex) + "render-ws/view";
  const viewContextParameters = "renderStackOwner=" + props.userInput.selectedStackOwner +
                                "&renderStackProject=" + props.userInput.selectedProject +
                                "&renderStack=" + props.userInput.selectedStack +
                                "&matchOwner=" + props.userInput.selectedMatchOwner +
                                "&matchCollection=" + props.userInput.selectedMatchCollection;

  const getRenderScale = function(numberOfTiles) {
    return window.innerWidth / ((numberOfTiles * fullScaleTileWidth) + 500);
  };

  // try to fit 5 tiles across in neighbors view
  const neighborsViewRenderScale = getRenderScale(6);

  const neighborsUrl = renderViewUrl + "/tile-with-neighbors.html?tileId=" + tileId +
                       "&renderScale=" + neighborsViewRenderScale + "&" + viewContextParameters;

  // try to fit 2 tiles across in pair view
  const pairViewRenderScale = getRenderScale(2);

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

  const priorPairMenuItems = [];
  const samePairMenuItems = [];
  const postPairMenuItems = [];

  if (props.hasMatchCounts) {

    pmList.forEach(pmInfo => {

      let otherTileBounds;
      if (pmInfo.pId === tileId) {
        otherTileBounds = props.tileBoundsData.tileIdToBounds[pmInfo.qId];
      } else { // qId
        otherTileBounds = props.tileBoundsData.tileIdToBounds[pmInfo.pId];
      }

      const pairItem = <TilePairMenuItem
        renderViewUrl={renderViewUrl}
        pId={pmInfo.pId}
        qId={pmInfo.qId}
        pairViewRenderScale={pairViewRenderScale}
        viewContextParameters={viewContextParameters}
        selectedTileBounds={selectedTileBounds}
        otherTileBounds={otherTileBounds}
        matchCount={pmInfo.connection_strength}/>;

      if (otherTileBounds.z < selectedTileBounds.z) {
        priorPairMenuItems.push(pairItem);
      } else if (otherTileBounds.z > selectedTileBounds.z) {
        postPairMenuItems.push(pairItem);
      } else {
        samePairMenuItems.push(pairItem);
      }

    });

  }

  const getPairGroupMenu = function(menuType, menuItems) {
    return <TilePairGroupSubMenu pairGroupMenuType={menuType} tilePairCount={menuItems.length}>
      {menuItems}
    </TilePairGroupSubMenu>
  };

  const priorLayerMatchPairsMenu = getPairGroupMenu("Prior", priorPairMenuItems);
  const sameLayerMatchPairsMenu = getPairGroupMenu("Same", samePairMenuItems);
  const postLayerMatchPairsMenu = getPairGroupMenu("Post", postPairMenuItems);
  
  const menuTitle = "Tile " + tileId;
  const zInfo = "z: " + selectedTileBounds.z;
  const menuHeader = props.hasMatchCounts ? zInfo : zInfo + " (missing match counts)";

  return <DropdownButton style={menuPositionStyle} id="selected-tile-menu-button" title={menuTitle}>

    <Dropdown.Header>{menuHeader}</Dropdown.Header>

    <DropdownButton id="view-submenu-button" title={"View"} drop="right" key="right" variant="light">
      {priorLayerMatchPairsMenu}
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
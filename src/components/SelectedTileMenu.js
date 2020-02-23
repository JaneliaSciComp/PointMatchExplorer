import React from "react"
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Image from "react-bootstrap/Image";
import {TileViewSubMenu} from "./TileViewSubMenu";

export const SelectedTileMenu = (props) => {

  const tileId = props.kvPairs[1].valuename;
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

  const tileImageUrl = props.renderStackUrl + "/tile/" + tileId + "/jpeg-image";
  const menuTileImageUrl = tileImageUrl + "?scale=" + tileScaleForMenu;

  const menuPositionStyle = {
    position: "absolute",
    left: props.x,
    top: props.y
  };

  const menuTitle = "Tile " + tileId;
  const zInfo = "z: " + selectedTileBounds.z;
  const menuHeader = props.hasMatchCounts ? zInfo : zInfo + " (missing match counts)";

  return <DropdownButton style={menuPositionStyle} id="selected-tile-menu-button" title={menuTitle}>

    <Dropdown.Header>{menuHeader}</Dropdown.Header>

    <TileViewSubMenu
      tileId={tileId}
      userInput={props.userInput}
      dataStackUrl={props.dataStackUrl}
      renderStackUrl={props.renderStackUrl}
      stackMetadata={props.stackMetadata}
      tileBoundsData={props.tileBoundsData}
      hasMatchCounts={props.hasMatchCounts}
      matchInfoList={props.kvPairs[3].valuename} />

    <Image src={menuTileImageUrl} style={tileImageStyle} />

  </DropdownButton>;

};
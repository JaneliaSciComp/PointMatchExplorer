import React, {Component} from "react";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import Image from "react-bootstrap/Image";
import {TileViewSubMenu} from "./TileViewSubMenu";

/**
 * Pop-up menu when tile is clicked/selected in view.
 */
export class SelectedTileMenu extends Component {

  /**
   * @param {Object}  props                 component properties
   * @param {string}  props.tileId          identifier for selected tile
   * @param {number}  props.clickX          x coordinate of mouse click (on tile)
   * @param {number}  props.clickY          y coordinate of mouse click (on tile)
   * @param {Object}  props.userInput       user input state
   * @param {string}  props.dataStackUrl    base data server URL for stack
   * @param {string}  props.renderStackUrl  base render server URL for stack
   * @param {Object}  props.stackMetadata   metadata for selected stack
   * @param {Object}  props.tileBoundsData  tile bounds data for selected sub volume
   * @param {boolean} props.hasMatchCounts  indicates whether match collection includes match count data
   * @param {Object}  props.matchInfoList   match data for tiles in selected sub volume
   */
  constructor(props) {
    super(props);
  }

  render() {

    const {
      tileId, clickX, clickY,
      userInput, dataStackUrl, renderStackUrl,
      stackMetadata, tileBoundsData, hasMatchCounts, matchInfoList
    } = this.props;

    const selectedTileBounds = tileBoundsData.tileIdToBounds[tileId];
    const fullScaleTileWidth = selectedTileBounds.maxX - selectedTileBounds.minX;
    const fullScaleTileHeight = selectedTileBounds.maxY - selectedTileBounds.minY;
    const tileImageWidth = 200;
    const tileScaleForMenu = tileImageWidth / fullScaleTileWidth;
    const tileImageHeight = fullScaleTileHeight * tileScaleForMenu;

    // need to explicitly set image width and height so that dropdown placement works at edge of view
    const tileImageStyle = {
      width: tileImageWidth,
      height: tileImageHeight
    };

    const tileImageUrl = renderStackUrl + "/tile/" + tileId + "/jpeg-image";
    const menuTileImageUrl = tileImageUrl + "?scale=" + tileScaleForMenu;

    const menuPositionStyle = {
      position: "absolute",
      left: clickX,
      top: clickY
    };

    const menuTitle = "Tile " + tileId + " (z " + selectedTileBounds.z + ")";
    const menuHeader = hasMatchCounts ? null : <Dropdown.Header>NOTE: missing match counts</Dropdown.Header>;

    return <DropdownButton style={menuPositionStyle} id="selected-tile-menu-button" title={menuTitle}>

      {menuHeader}

      <TileViewSubMenu
        tileId={tileId}
        userInput={userInput}
        dataStackUrl={dataStackUrl}
        renderStackUrl={renderStackUrl}
        stackMetadata={stackMetadata}
        tileBoundsData={tileBoundsData}
        hasMatchCounts={hasMatchCounts}
        matchInfoList={matchInfoList}/>

      <Image src={menuTileImageUrl} style={tileImageStyle}/>

    </DropdownButton>;
  }

}
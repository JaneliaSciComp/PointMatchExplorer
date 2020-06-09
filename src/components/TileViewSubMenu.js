import React, {Component} from "react";
import DropdownButton from "react-bootstrap/DropdownButton";
import Dropdown from "react-bootstrap/Dropdown";
import {TilePairMenuItem} from "./TilePairMenuItem";
import {TilePairGroupSubMenu} from "./TilePairGroupSubMenu";

/**
 * View sub menu (button) for the selected tile.
 */
export class TileViewSubMenu extends Component {

  /**
   * @param {Object}  props                 component properties
   * @param {string}  props.tileId          identifier for selected tile
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
    this.state = this.getDerivedState(props);
  }

  componentWillReceiveProps(nextProps) {
    // only derive state when a new tile has been selected
    if (nextProps.tileId !== this.state.derivedTileId) {
      this.setState(this.getDerivedState(nextProps));
    }
  }

  render() {
    
    return <DropdownButton id="view-submenu-button" title={"View"} drop="right" key="right" variant="light">
      <TilePairGroupSubMenu pairGroupMenuType="Prior" tilePairCount={this.state.priorPairMenuItems.length}>
        {this.state.priorPairMenuItems}
      </TilePairGroupSubMenu>
      <TilePairGroupSubMenu pairGroupMenuType="Same" tilePairCount={this.state.samePairMenuItems.length}>
        {this.state.samePairMenuItems}
      </TilePairGroupSubMenu>
      <TilePairGroupSubMenu pairGroupMenuType="Post" tilePairCount={this.state.postPairMenuItems.length}>
        {this.state.postPairMenuItems}
      </TilePairGroupSubMenu>
      <Dropdown.Item href={this.state.tileSpecUrl} target="_blank">
        Tile Spec
      </Dropdown.Item>
      <Dropdown.Item href={this.state.tileImageUrl} target="_blank">
        Full Scale Tile
      </Dropdown.Item>
      <Dropdown.Item href={this.state.neighborsUrl} target="_blank">
        Neighbor Matches
      </Dropdown.Item>
      <Dropdown.Item href={this.state.baseCatmaidUrl + "2"} target="_blank">
        Tile in CATMAID (level 2)
      </Dropdown.Item>
      <Dropdown.Item href={this.state.baseCatmaidUrl + "5"} target="_blank">
        Tile in CATMAID (level 5)
      </Dropdown.Item>
      <Dropdown.Item href={this.state.clusterViewUrl} target="_blank">
        Layer Connected Clusters
      </Dropdown.Item>
    </DropdownButton>;

  }

  getDerivedState(fromProps) {

    const {
      tileId, userInput, dataStackUrl, renderStackUrl,
      stackMetadata, tileBoundsData, hasMatchCounts, matchInfoList
    } = fromProps;

    const tileBounds = tileBoundsData.tileIdToBounds[tileId];
    const fullScaleTileWidth = tileBounds.maxX - tileBounds.minX;

    const renderWsIndex = renderStackUrl.indexOf("render-ws");
    const renderViewUrl = renderStackUrl.substring(0, renderWsIndex) + "render-ws/view";
    const viewContextParameters = "renderStackOwner=" + userInput.selectedStackOwner +
                                  "&renderStackProject=" + userInput.selectedProject +
                                  "&renderStack=" + userInput.selectedStack +
                                  "&matchOwner=" + userInput.selectedMatchOwner +
                                  "&matchCollection=" + userInput.selectedMatchCollection;

    const getRenderScale = function(numberOfTiles) {
      return window.innerWidth / ((numberOfTiles * fullScaleTileWidth) + 500);
    };
    const neighborsViewRenderScale = getRenderScale(6);
    const pairViewRenderScale = getRenderScale(2);

    const currentVersion = stackMetadata.currentVersion;
    const resTileCenterX = ((tileBounds.minX + tileBounds.maxX) / 2) * currentVersion.stackResolutionX;
    const resTileCenterY = ((tileBounds.minY + tileBounds.maxY) / 2) * currentVersion.stackResolutionY;
    const resTileZ = tileBounds.z * currentVersion.stackResolutionZ;

    const getRelativePositionData = function(fromBounds, toBounds) {
      const deltaX = toBounds.minX - fromBounds.minX;
      const deltaY = toBounds.minY - fromBounds.minY;
      const angleRadians = Math.atan2(deltaY, deltaX);
      const angleDegrees = Math.floor(angleRadians * 180 / Math.PI);

      const pctDeltaX = Math.abs(deltaX / (fromBounds.maxX - fromBounds.minX));
      const pctDeltaY = Math.abs(deltaY / (fromBounds.maxY - fromBounds.minY));
      const maxOffsetPercentage = Math.max(pctDeltaX, pctDeltaY) * 100;
      return {
        degreesBetweenCorners: angleDegrees,
        maxCornerOffsetPercentage: maxOffsetPercentage
      };
    };

    const pairMenuItems = [[],[],[]]; // components for prior, post, same layer pairs

    if (hasMatchCounts) {

      const pairMenuData = [[],[],[]]; // (sortable) data for prior, post, same layer pairs

      matchInfoList.forEach(pmInfo => {

        let otherTileBounds;
        if (pmInfo.pId === tileId) {
          otherTileBounds = tileBoundsData.tileIdToBounds[pmInfo.qId];
        } else { // qId
          otherTileBounds = tileBoundsData.tileIdToBounds[pmInfo.pId];
        }

        const relativePosition = getRelativePositionData(tileBounds, otherTileBounds);

        const tilePairData = {
          pId: pmInfo.pId,
          qId: pmInfo.qId,
          renderViewUrl: renderViewUrl,
          viewContextParameters: viewContextParameters,
          pairViewRenderScale: pairViewRenderScale,
          otherTileBounds: otherTileBounds,
          matchCount: pmInfo.connection_strength,
          degreesBetweenCorners: relativePosition.degreesBetweenCorners,
          hasLargeOverlap: (relativePosition.maxCornerOffsetPercentage < 10.0)
        };

        if (otherTileBounds.z < tileBounds.z) {
          pairMenuData[0].push(tilePairData);
        } else if (otherTileBounds.z > tileBounds.z) {
          pairMenuData[1].push(tilePairData);
        } else {
          pairMenuData[2].push(tilePairData);
        }

      });

      const getQuadrant = function(pair) {
        let quadrant = 0;
        if (! pair.hasLargeOverlap) {
          quadrant = Math.round(pair.degreesBetweenCorners / 90);
          if (quadrant === -2) {
            quadrant = 2;
          }
        }
        return quadrant;
      };

      const comparePairs = function(pairA, pairB) {
        const quadrantA = getQuadrant(pairA);
        const quadrantB = getQuadrant(pairB);
        let result = quadrantA - quadrantB;
        if (result === 0) {
          if (pairA.hasLargeOverlap) {
            if (! pairB.hasLargeOverlap) {
              result = 1;
            }
          } else if (pairB.hasLargeOverlap) {
            result = -1;
          }
          if (result === 0) {
            result = pairA.otherTileBounds.tileId.localeCompare(pairB.otherTileBounds.tileId);
          }
        }
        return result;
      };

      for (let i = 0; i < pairMenuData.length; i++) {
        pairMenuData[i].sort(comparePairs);
        pairMenuData[i].forEach(tilePairData => {
          pairMenuItems[i].push(<TilePairMenuItem tilePairData={tilePairData}/>);
        })
      }

    }

    return {
      derivedTileId: tileId,
      tileSpecUrl: dataStackUrl + "/tile/" + tileId,
      tileImageUrl: renderStackUrl + "/tile/" + tileId + "/jpeg-image",
      neighborsUrl: renderViewUrl + "/tile-with-neighbors.html?tileId=" + tileId +
                    "&renderScale=" + neighborsViewRenderScale + "&" + viewContextParameters,
      baseCatmaidUrl: "http://" + userInput.catmaidHost + "/?" +
                      "pid=" + userInput.selectedStackOwner + "__" + userInput.selectedProject +
                      "&sid0=" + userInput.selectedStack +
                      "&zp=" + resTileZ + "&yp=" + resTileCenterY + "&xp=" + resTileCenterX +
                      "&tool=navigator" +
                      "&s0=",
      clusterViewUrl: renderViewUrl + "/tile-layer.html?" + viewContextParameters +
                      "&z=" + tileBounds.z +
                      "&boxScale=0.3&useStackBounds=true",
      priorPairMenuItems: pairMenuItems[0],
      postPairMenuItems: pairMenuItems[1],
      samePairMenuItems: pairMenuItems[2]
    };

  }
  
}


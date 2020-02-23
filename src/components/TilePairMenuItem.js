import React, {Component} from "react";
import Dropdown from "react-bootstrap/Dropdown";

/**
 * Clickable menu item (button) for one tile pair.
 */
export class TilePairMenuItem extends Component {

  /**
   * @param {Object}  props                                         component properties
   * @param {string}  props.tilePairData.pId                        pTile identifier
   * @param {string}  props.tilePairData.qId                        qTile identifier
   * @param {string}  props.tilePairData.renderViewUrl              base URL for all render views
   * @param {string}  props.tilePairData.viewContextParameters      common view parameter query string
   *                                                                (e.g. renderStack=...&matchCollection=...)
   * @param {number}  props.tilePairData.pairViewRenderScale        render scale for pair view
   * @param {Object}  props.tilePairData.otherTileBounds            bounds for the other tile (not selected) in the pair
   * @param {number}  props.tilePairData.matchCount                 number of match points between the tiles
   * @param {number}  props.tilePairData.degreesBetweenCorners      angle between min corners of the selected tile
   *                                                                and the other tile
   * @param {boolean} props.tilePairData.hasLargeOverlap            indicates whether tiles have a large overlap area
   *
   */
  constructor(props) {
    super(props);
  }

  render() {

    const {
      pId, qId,
      renderViewUrl, viewContextParameters, pairViewRenderScale,
      otherTileBounds, matchCount,
      degreesBetweenCorners, hasLargeOverlap
    } = this.props.tilePairData;

    const pairLabel = otherTileBounds.tileId + " (" + matchCount + " matches, " + "z " + otherTileBounds.z + ")";
    const tilePairUrl = renderViewUrl + "/tile-pair.html?pId=" + pId + "&qId=" + qId +
                        "&renderScale=" + pairViewRenderScale + "&" + viewContextParameters;
    const arrowContainerStyle = { transform: "rotate(" + degreesBetweenCorners + "deg)" };

    let arrowStyle = null;
    let tilePairClasses = "tilePairArrow";
    if (hasLargeOverlap) {
      arrowStyle = {
        height: "9px",
        margin: "3px"
      };
    } else {
      tilePairClasses += " tilePairOffset";
    }

    return <Dropdown.Item
      href={tilePairUrl}
      target="_blank">
      <div className="tilePairArrowContainer" style={arrowContainerStyle}>
        <span className={tilePairClasses} style={arrowStyle}/>
      </div>
      {pairLabel}
    </Dropdown.Item>;

  }

}


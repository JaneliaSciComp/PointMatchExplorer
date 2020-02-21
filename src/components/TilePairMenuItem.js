import React, {Component} from "react";
import Dropdown from "react-bootstrap/Dropdown";

/**
 * Clickable menu item (button) for one tile pair.
 */
export class TilePairMenuItem extends Component {

  constructor(props) {

    super(props);

    this.tilePairUrl =
      this.props.renderViewUrl + "/tile-pair.html?pId=" + this.props.pId + "&qId=" + this.props.qId +
      "&renderScale=" + this.props.pairViewRenderScale + "&" + this.props.viewContextParameters;

    this.setRelativePositionAttributes(this.props.selectedTileBounds, this.props.otherTileBounds);

    this.pairLabel = this.props.otherTileBounds.tileId +
                     " (" + this.props.matchCount + " matches, " + "z " + this.props.otherTileBounds.z + ")";
  }

  render() {

    return <Dropdown.Item
      href={this.tilePairUrl}
      target="_blank">
      <div className="tilePairArrowContainer" style={this.arrowContainerStyle}>
        <span className={this.tilePairClasses} style={this.arrowStyle}/>
      </div>
      {this.pairLabel}
    </Dropdown.Item>;

  }

  setRelativePositionAttributes(fromBounds, toBounds) {

    const deltaX = toBounds.minX - fromBounds.minX;
    const deltaY = toBounds.minY - fromBounds.minY;
    const angleRadians = Math.atan2(deltaY, deltaX);
    const angleDegrees = Math.floor(angleRadians * 180 / Math.PI);

    const pctDeltaX = Math.abs(deltaX / (fromBounds.maxX - fromBounds.minX));
    const pctDeltaY = Math.abs(deltaY / (fromBounds.maxY - fromBounds.minY));
    const maxOffsetPercentage = Math.max(pctDeltaX, pctDeltaY) * 100;

    this.arrowContainerStyle = {
      transform: "rotate(" + angleDegrees + "deg)"
    };

    this.arrowStyle = null;
    this.tilePairClasses = "tilePairArrow";
    if (maxOffsetPercentage < 10.0) {
      this.arrowStyle = {
        height: "9px",
        margin: "3px"
      };
    } else {
      this.tilePairClasses += " tilePairOffset";
    }

  }

}


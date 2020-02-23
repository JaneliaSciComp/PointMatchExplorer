import React, {Component} from "react";
import DropdownButton from "react-bootstrap/DropdownButton";

/**
 * Sub menu (button) for group of tile pair menu items.
 */
export class TilePairGroupSubMenu extends Component {

  /**
   * @param {Object}  props                    component properties
   * @param {string}  props.pairGroupMenuType  type name for tile pair group (e.g. "Prior", "Same", or "Post")
   * @param {number}  props.tilePairCount      number of tile pairs in the group
   */
  constructor(props) {
    super(props);
  }

  render() {

    if (this.props.tilePairCount > 0) {

      const titleSuffix = this.props.tilePairCount > 1 ? "s" : "";
      const title = this.props.pairGroupMenuType + " Layer Pair" + titleSuffix + " (" + this.props.tilePairCount + ")";
      const buttonId = this.props.pairGroupMenuType + "-layer-matches-button";

      return <DropdownButton
        id={buttonId}
        title={title}
        drop="right"
        key="right"
        variant="light">
        {this.props.children}
      </DropdownButton>;

    } else {
      return null;
    }

  }

}


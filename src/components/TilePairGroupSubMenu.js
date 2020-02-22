import React, {Component} from "react";
import DropdownButton from "react-bootstrap/DropdownButton";

/**
 * Sub menu (button) for group of tile pair menu items.
 */
export class TilePairGroupSubMenu extends Component {

  constructor(props) {

    super(props);

    const { pairGroupMenuType, tilePairCount } = props;

    const titleSuffix = tilePairCount > 1 ? "s" : "";

    this.buttonTitle = pairGroupMenuType + " Layer Pair" + titleSuffix + " (" + tilePairCount + ")";
    this.buttonId = pairGroupMenuType + "-layer-matches-button";

  }

  render() {

    if (this.props.tilePairCount > 0) {

      // TODO: would be nice if child pair items could be sorted by angle
      //const children = React.Children.toArray(this.props.children);

      return <DropdownButton
        id={this.buttonId}
        title={this.buttonTitle}
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


import React from "react"

export const TileInfo = (props) => {

  const title = props.context + " Tile";
  const z = props.kvPairs[0].valuename;
  const tileId = props.kvPairs[1].valuename;
  const connectionCount = props.kvPairs[2].valuename;

  return <div className={"formGrid"}>
    <label className={"dataGroupTitle topTen"}>{title}</label>  <span className={"emptyArea"}/>
    <label className={"indented"}>ID:</label>                   <span className={"value"}>{tileId}</span>
    <label className={"indented"}>Z:</label>                    <span className={"value"}>{z}</span>
    <label className={"indented"}>Connections:</label>          <span className={"value"}>{connectionCount}</span>
  </div>

};

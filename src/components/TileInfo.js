import React from "react"

export const TileInfo = (props) => {

  const title = props.context + " Tile";
  const z = props.kvPairs[0].valuename;
  const tileId = props.kvPairs[1].valuename;
  const connectionCount = props.kvPairs[2].valuename;

  return <div className={"formGrid"}>
    <label className={"dataGroupTitle topTen small"}>{title}</label>  <span className={"emptyArea"}/>
    <label className={"indented small"}>ID:</label>                   <span className={"value small"}>{tileId}</span>
    <label className={"indented small"}>Z:</label>                    <span className={"value small"}>{z}</span>
    <label className={"indented small"}>Connects:</label>             <span className={"value small"}>{connectionCount}</span>
  </div>

};

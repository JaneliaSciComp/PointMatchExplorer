import React from "react"

export const PMEInput = (props) => {

  const stackDisabled = (! props.selectedProject) || (! props.stacks);
  const zDisabled = (! props.selectedStack) || (! props.stacks);
  const matchDisabled = (! props.selectedMatchOwner) || (! props.match_collections);
  const projectDisabled = (! props.selectedStackOwner) || (! props.projects);

  let selectedStackZRange = "";
  let selectedStackDetails = "";
  let selectedStackDetailsUrl = "#";
  let minZ = 1;
  let maxZ = Infinity;
  if (props.selectedStackMetadata.Fetched) {
    const stackStats = props.selectedStackMetadata.data.stats;
    if (stackStats) {
      minZ = stackStats.stackBounds.minZ;
      maxZ = stackStats.stackBounds.maxZ;
      selectedStackZRange = "(z range: " + minZ.toLocaleString() + " to " + maxZ.toLocaleString() + ")";
      selectedStackDetails = "stack details";
      selectedStackDetailsUrl = props.stackDetailsViewUrl;
    }
  }

  let selectedStackSubVolumeTileCount = "";
  if (props.selectedStackSubVolume.Fetched) {
    selectedStackSubVolumeTileCount = "(" + props.selectedStackSubVolume.data.tileCount.toLocaleString() + " tiles)";
  }
  
  return (

    <div id="PMEInput" className="formGrid">

      <label className={"dataGroupTitle"}>Render</label>
      <span className={"col2to6"}>&nbsp;</span>
      <button className={"col6"} onClick={handleHelpClick}>?</button>

      <label className={"indented"}>Owner:</label>
      <Dropdown dropdownName="Select Stack Owner" onChange={props.onStackOwnerSelect}
        values={props.stack_owners} value={props.selectedStackOwner}/>

      <label className={"indented"}>Project:</label>
      <Dropdown dropdownName="Select Project" onChange={props.onProjectSelect}
        values={ projectDisabled ? [] : props.projects} value={props.selectedProject} disabled={projectDisabled}/>

      <label className={"indented"}>Stack:</label>
      <Dropdown dropdownName="Select Stack" onChange={props.onStackSelect}
        values={ stackDisabled ? [] : props.stacks} value={props.selectedStack} disabled={stackDisabled}/>

      <label>&nbsp;</label>
      <div className={"col2to6"}>
        <a href={selectedStackDetailsUrl} target={"_blank"}>{selectedStackDetails}</a>
        <span className={"indented stackInfo"}>{selectedStackZRange}</span>
      </div>

      <label className={"indented topTen"}>Z Range:</label>
      <div className={"col2to6 topTen"}>
        <input type="number" min={minZ} max={maxZ} step={0.1} onChange={e => props.onChangeStartZ(e.target.value)} value={props.selectedStartZ}  disabled={zDisabled}/>
        <span>&nbsp;to&nbsp;</span>
        <input type="number" min={minZ} max={maxZ} step={0.1} onChange={e => props.onChangeEndZ(e.target.value)} value={props.selectedEndZ}  disabled={zDisabled}/>
        <span className={"indented stackInfo"}>{selectedStackSubVolumeTileCount}</span>
      </div>


      <label className={"dataGroupTitle topTen"}>Match</label>
      <span className={"col2to6"}>&nbsp;</span>
      <label className={"indented"}>Owner:</label>
      <Dropdown dropdownName="Select Match Owner" onChange={props.onMatchOwnerSelect}
        values={props.match_owners} value={props.selectedMatchOwner}/>

      <label className={"indented"}>Collection:</label>
      <Dropdown dropdownName="Select Match Collection" onChange={props.onMatchCollectionSelect}
        values={ matchDisabled ? [] : props.match_collections} value={props.selectedMatchCollection} disabled={matchDisabled}/>

      <label className={"topTen"}>&nbsp;</label>
      <button className={"col2to6 topTen"} onClick={e => props.onRenderClick(e.target.value)}>Refresh View</button>

    </div>
  )
};

export const handleHelpClick = function() {
  let helpMessage = `
- Hold down left mouse button and move to rotate
- Hold down right mouse button and move to pan
- Scroll to zoom
- Click on tile to highlight it and its point matches

- Shift click on a tile to highlight all tiles 
  and point matches of that tile's section

- Command + click on a tile to view its section 
  in CATMAID, zoomed in on that tile

- Ctrl+click on a tile to view match data for 
  the tile and its neighboring tiles

- After selecting (clicking) one tile, 
  hold p key and click second tile 
  to view match data for the tile pair
`;
  alert(helpMessage);
  return false
};

const Dropdown = (props) => {
  return (
    <select className={props.className} disabled={props.disabled} id={props.dropdownId} required onChange={e => props.onChange(e.target.value)} value={props.value}>
      <option value="" disabled>{props.dropdownName}</option>
      {
        props.values.map(value =>
          <option key={value}
            value={value}>{value}</option>)
      }
    </select>

  )
};

import React from "react"

export const PMEInput = (props) => {
  let stackDisabled = true;
  let matchDisabled = true;
  let projectDisabled = true;
  if (props.selectedProject && props.stacks){
    stackDisabled = false
  }
  if (props.selectedStackOwner && props.projects){
    projectDisabled = false
  }
  if (props.selectedMatchOwner && props.match_collections){
    matchDisabled =false
  }

  return (

    <div id="PMEInput" className="formGrid">

      <span className={"dataGroupTitle"}>Render</span><span className={"emptyArea"}>&nbsp;</span>
      <button className={"help"} onClick={handleHelpClick}>?</button>

      <label className={"indented"}>Owner:</label>
      <Dropdown dropdownName="Select Stack Owner" onChange={props.onStackOwnerSelect}
        values={props.stack_owners} value={props.selectedStackOwner}/>

      <label className={"indented"}>Project:</label>
      <Dropdown dropdownName="Select Project" onChange={props.onProjectSelect}
        values={ projectDisabled ? [] : props.projects} value={props.selectedProject} disabled={projectDisabled}/>

      <label className={"indented"}>Stack:</label>
      <Dropdown dropdownName="Select Stack" onChange={props.onStackSelect}
        values={ stackDisabled ? [] : props.stacks} value={props.selectedStack} disabled={stackDisabled}/>

      <label className={"dataGroupTitle topTen"}>Match</label><span className={"emptyArea"}>&nbsp;</span>
      <label className={"indented"}>Owner:</label>
      <Dropdown dropdownName="Select Match Owner" onChange={props.onMatchOwnerSelect}
        values={props.match_owners} value={props.selectedMatchOwner}/>

      <label className={"indented"}>Collection:</label>
      <Dropdown dropdownName="Select Match Collection" onChange={props.onMatchCollectionSelect}
        values={ matchDisabled ? [] : props.match_collections} value={props.selectedMatchCollection} disabled={matchDisabled}/>

      <label className={"topTen"}>Start Z:</label>
      <input className={"topTen"} type="number" onChange={e => props.onChangeStartZ(e.target.value)} value={props.selectedStartZ}/>

      <label>End Z:</label>
      <input type="number" onChange={e => props.onChangeEndZ(e.target.value)} value={props.selectedEndZ}/>

      <br/>

      <button className={"topTen"} onClick={e => props.onRenderClick(e.target.value)}>Render Layers</button>


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

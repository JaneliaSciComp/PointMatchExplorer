import React from "react"

export const SpecsInput = (props) => {
  let stackDisabled = true
  let matchDisabled = true
  let projectDisabled = true
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

    <div className = "specsInput">
    
      <Dropdown className = "specsInput" dropdownName="Select Stack Owner" onChange={props.onStackOwnerSelect}
        values={props.stack_owners} value={props.selectedStackOwner}/>
      <Dropdown className = "specsInput" dropdownName="Select Project" onChange={props.onProjectSelect}
        values={ projectDisabled ? [] : props.projects} value={props.selectedProject} disabled={projectDisabled}/>
      <Dropdown className = "specsInput" dropdownName="Select Stack" onChange={props.onStackSelect}
        values={ stackDisabled ? [] : props.stacks} value={props.selectedStack} disabled={stackDisabled}/>
      <br/>
      
      <Dropdown className = "specsInput" dropdownName="Select Match Owner" onChange={props.onMatchOwnerSelect} 
        values={props.match_owners} value={props.selectedMatchOwner}/>
      <Dropdown className = "specsInput" dropdownName="Select Match Collection" onChange={props.onMatchCollectionSelect}
        values={ matchDisabled ? [] : props.match_collections} value={props.selectedMatchCollection} disabled={matchDisabled}/>
    </div>
  )
}

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
`
  alert(helpMessage)
  return false
}

export const LayerInput = (props) => {
  return (
    <div className = "layerInput">
      Start Z: <input type="number" onChange={e => props.onChangeStartZ(e.target.value)} value={props.selectedStartZ}></input>
      <br/>
      End Z: <input type="number" onChange={e => props.onChangeEndZ(e.target.value)} value={props.selectedEndZ}></input>
      <br/>
      <button className = "layerButton" onClick={e => props.onRenderClick(e.target.value)}>Render Layers</button>
      <button className = "layerButton" onClick={handleHelpClick}>Help</button>
    </div>
  )
}

const Dropdown = (props) => {
  return (
    <select disabled={props.disabled} id={props.dropdownId} required onChange={e => props.onChange(e.target.value)} value={props.value}>
      <option value="" disabled>{props.dropdownName}</option>
      {
        props.values.map(value =>
          <option key={value}
            value={value}>{value}</option>)
      }
    </select>
  )
}

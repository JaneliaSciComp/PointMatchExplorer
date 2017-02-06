import React from 'react';

export const SpecsInput = (props) => {
  return (
    <div className = "specsInput">
      <Dropdown className = "specsInput" dropdownName="Select Project" onChange={props.onProjectSelect} values={props.projects} value={props.selectedProject}/>
      <br/>
      <Dropdown className = "specsInput" dropdownName="Select Stack" onChange={props.onStackSelect} values={props.stacks} value={props.selectedStack}/>
      <br/>
      <Dropdown className = "specsInput" dropdownName="Select Match Collection" onChange={props.onMatchCollectionSelect} values={props.match_collections} value={props.selectedMatchCollection}/>
    </div>
  );
}

export const LayerInput = (props) => {
  return (
    <div className = "layerInput">
      Start Z: <input type="number" onChange={e => props.onChangeStartZ(e.target.value)}></input>
      <br/>
      End Z: <input type="number" onChange={e => props.onChangeEndZ(e.target.value)}></input>
      <br/>
      <button onClick={e => props.onRenderClick()}>Render Layers</button>
    </div>
  );
}

const Dropdown = (props) => {
  return (
      <select id={props.dropdownId} required onChange={e => props.onChange(e.target.value)} value={props.value}>
        <option value="" disabled>{props.dropdownName}</option>
        {
          props.values.map(value =>
            <option key={value}
              value={value}>{value}</option>)
        }
      </select>
  );
}

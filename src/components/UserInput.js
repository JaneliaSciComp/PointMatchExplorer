import React from 'react';

export const SpecsInput = (props) => {
  let projects = _.uniq(_.map(props.stackIds, function(item){
    return item.project;
  }));
  projects.sort();
  let stacks = _.uniq(_.map(props.stackIds, function(item){
    return item.stack;
  }));
  stacks.sort();
  let match_collections = _.map(props.matchCollections, function(collection){
    return collection.collectionId.name;
  });
  match_collections.sort();
  return (
    <div className = "specsInput">
      <Dropdown className = "specsInput" dropdownName="Select Project" onChange={props.onProjectSelect} values={projects}/>
      <br/>
      <Dropdown className = "specsInput" dropdownName="Select Stack" onChange={props.onStackSelect} values={stacks}/>
      <br/>
      <Dropdown className = "specsInput" dropdownName="Select Match Collection" onChange={props.onMatchCollectionSelect} values={match_collections}/>
    </div>
  );
}

export const LayerInput = (props) => {
  return (
    <div className = "layerInput">
      Start Z: <input type="number" name="nfirst" id="nfirst" onChange={e => props.onChangeStartZ(e.target.value)}></input>
      <br/>
      End Z: <input type="number" name="nlast" id="nlast" onChange={e => props.onChangeEndZ(e.target.value)}></input>
      <br/>
      <button>Render Layers</button>
    </div>
  );
}

const Dropdown = (props) => {
  return (
      <select id={props.dropdownId} defaultValue="" required onChange={e => props.onChange(e.target.value)}>
        <option value="" disabled>{props.dropdownName}</option>
        {
          props.values.map(value =>
            <option key={value}
              value={value}>{value}</option>)
        }
      </select>
  );
}

import React from "react"

export const MetadataInfo = (props) => {
  return <MetadataKVPairs kvpairs={props.kvpairs}/>
}

const MetadataKVPairs = (props) => {
  let kvpairs = []
  for (var i = 0; i < props.kvpairs.length; i++){
    kvpairs.push(<KVPair key={i} keyname={props.kvpairs[i].keyname} valuename={props.kvpairs[i].valuename}/>)
  }
  return <div>{kvpairs}</div>
}

const KVPair = (props) => {
  return <div> {props.keyname + ": " + props.valuename} </div>
}

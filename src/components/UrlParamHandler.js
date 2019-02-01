import React, {Component} from "react"
import {connect} from "react-redux"
import {updateUserInput} from "../actions"
import URLSearchParams from "url-search-params"
/**
 * Keeps url query params in sync with Redux store
 */
class UrlParamHandler extends Component {

  constructor(props){
    super(props)
  }
  
  componentWillMount(){
    if(window.location.search){
      const paramTracker = new URLSearchParams(window.location.search)
      let inputData = {}
      for(let [key, val] of paramTracker.entries()){
        if(this.props.StoreData.hasOwnProperty(key)){
          inputData[key] = val
        }
      }

      //update store
      if(inputData){
        this.props.updateUserInput(inputData)
      }
    }

  }
  componentWillReceiveProps(nextProps){
    //update the url params
    const paramTracker = new URLSearchParams(window.location.search)

    _.each(nextProps.StoreData, function(val,key){
      paramTracker.set(key,val)
    })
    this.updateUrl(paramTracker)

  }
  updateUrl(searchParams){
    const newUrl = window.location.href.split("?")[0] + "?" + searchParams.toString()
    history.replaceState(null, "", newUrl)
  }

  render(){
    return <div/>
  }
}

/**
 * Utility class for translating between url params and
 * Store data, as these names may change independently
 */
class urlParamStoreMapper{

  constructor(paramsToStoreMap){
    this.urlParamsToStoreVals = paramsToStoreMap
    this.storeValsToUrlParams = _.invert(this.urlParamsToStoreVals)
  }

  mapStoreDataToUrlParams(storeData){
    let paramData = {}
    for(let storeKey in storeData){
      if(this.storeValsToUrlParams.hasOwnProperty(storeKey)){
        paramData[this.storeValsToUrlParams[storeKey]] = storeData[storeKey]
      }
    }
    return paramData
  }

  mapUrlParamsToStoreData(paramData){
    let storeData = {}
    for(let paramKey in paramData){
      if(this.urlParamsToStoreVals.hasOwnProperty(paramKey)){
        storeData[this.urlParamsToStoreVals[paramKey]] = paramData[paramKey]
      }
    }
    return storeData
  }
}

//create mappings between url params and store variables
let userInputUrlMap = new urlParamStoreMapper({
  renderStackOwner: "selectedStackOwner",
  renderStackProject: "selectedProject",
  renderStack: "selectedStack",
  matchOwner: "selectedMatchOwner",
  matchCollection: "selectedMatchCollection",
  renderDataHost: "renderDataHost",
  dynamicRenderHost: "dynamicRenderHost",
  catmaidHost: "catmaidHost",
  mergeCollection: "mergeCollection",
  startZ: "startZ",
  endZ: "endZ"
})

const mapStateToProps = function(state) {
  const {UserInput} = state
  return {
    StoreData: userInputUrlMap.mapStoreDataToUrlParams(UserInput)
  }
}

const mapDispatchToProps = function(dispatch) {
  return {
    updateUserInput: function(data){
      let userInputData = userInputUrlMap.mapUrlParamsToStoreData(data)
      dispatch(updateUserInput(userInputData))
    },
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UrlParamHandler)

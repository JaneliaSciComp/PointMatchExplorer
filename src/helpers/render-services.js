/**
  js API wrapper prototype 
  encapsulates api called to flyTEM Web Service APIs:
  http://tem-services.int.janelia.org:8080/swagger-ui/
  uses the native js fetch API  
**/

class RenderServices {

  constructor(properties){
    this.baseURL = properties.baseURL
  }

  stack(owner, project, stack){
    return new Stack(this, owner, project, stack)
  }
}

/** Class encapsulating the stack-related parts of the API: http://tem-services.int.janelia.org:8080/swagger-ui/#!/Stack_Data_APIs*/
class Stack {
  /**
  * @param {RenderServiceConfig} config - configuration object for the api
  * @param {string} owner
  * @param {string} project
  * @param {string} stack
  */
  constructor(config, owner, project, stack){
    this.config = config
    this.owner = owner
    this.project = project
    this.stack = stack
  }

  getBaseURL(){
    return `${this.config.baseURL}/owner/${this.owner}/project/${this.project}/stack/${this.stack}`
  }

}

class Stacks {

  constructor(config){
    this.config = config
  }
  getOwners(){

  }
  getAllStackInfo(owner){

  }


}

function mapDataTypeToURL(state, dataType, params){
  const BASE_URL = "http://renderer.int.janelia.org:8080/render-ws/v1"
  const {selectedProject, selectedStack, selectedMatchCollection, selectedStackOwner,
    selectedMatchOwner} = state.UserInput
  const MATCH_BASE_URL = `${BASE_URL}/owner/${selectedMatchOwner}`
  const STACK_BASE_URL = `${BASE_URL}/owner/${selectedStackOwner}`

  switch(dataType) {
    case "StackOwners": 
      return `${BASE_URL}/owners`
    case "MatchOwners":
      return `${BASE_URL}/matchCollectionOwners`
    case "StackIds":
      return `${STACK_BASE_URL}/stackIds`
    case "MatchCollections":
      return `${MATCH_BASE_URL}/matchCollections`
    case "StackResolution":
      return `${BASE_URL}/owner/flyTEM/project/FAFB00/stack/v12_align`
    case "StackMetadata":
      return `${STACK_BASE_URL}/project/${selectedProject}/stack/${selectedStack}`
    case "SectionData":
      return `${STACK_BASE_URL}/project/${selectedProject}/stack/${selectedStack}/sectionData`
    case "TileBounds":
      return `${STACK_BASE_URL}/project/${selectedProject}/stack/${selectedStack}/z/${params.z}/tileBounds`
    case "SectionBounds":
      return `${STACK_BASE_URL}/project/${selectedProject}/stack/${selectedStack}/z/${params.z}/bounds`
    case "MatchesWithinGroup":
      return `${STACK_BASE_URL}/matchCollection/${selectedMatchCollection}/group/${params.groupId}/matchesWithinGroup`
    case "MatchesOutsideGroup":
      return `${STACK_BASE_URL}/matchCollection/${selectedMatchCollection}/group/${params.groupId}/matchesOutsideGroup`
    default:
      return null
  }
}

function shouldFetchData(state, dataType) {
  const data = state.APIData[dataType]
  if (!data.Fetched && !data.isFetching) {
    return true
  }
  if (data.isFetching) {
    return false
  }
  return data.didInvalidate
}

export function fetchDataIfNeeded(dataType){
  return (dispatch, getState) => {
    if (shouldFetchData(getState(), dataType)){
      return dispatch(fetchData(dataType))
    }
  }
}

function fetchData(dataType){
  return (dispatch, getState) => {
    dispatch(requestData(dataType))
    const state = getState()
    const {startZ, endZ} = state.UserInput
    if (dataType == "SectionBounds" || dataType == "TileBounds"){
      let urls = []
      //get a list of string URLs
      for (let z = parseInt(startZ); z <= parseInt(endZ); z++){
        urls.push(mapDataTypeToURL(getState(), dataType, {z:z}))
      }
      const promises = urls.map(url => fetch(url).then(response => response.json()))
      return Promise.all(promises)
      .then(responses  => {
        //maps Z layer to the bounds
        let allBounds = {}
        for (var i = 0; i < responses.length; i++){
          //hacky way of getting the Z for the bound
          allBounds[parseInt(startZ)+i] = responses[i]
        }
        return allBounds
      })
      .then(allBounds => dispatch(receiveData(dataType, allBounds)))
    }else if(dataType == "MatchesWithinGroup" || dataType == "MatchesOutsideGroup"){
      let urls = []
      let urlIndexToZ = {}
      let indexCount = 0
      //get a list of string URLs
      for (let z = parseInt(startZ); z <= parseInt(endZ); z++){
        const sections = getSectionsForZ(z, state.APIData.SectionData.data)
        _.forEach(sections, function(section){
          urls.push(mapDataTypeToURL(getState(), dataType, {groupId: section}))
          urlIndexToZ[indexCount] = z
          indexCount++
        })
      }
      var promises = urls.map(url => fetch(url).then(response => response.json()))
      return Promise.all(promises)
      .then(responses  => {
        let matches = {}
        //the return value maintains the order of the original iterable
        //urlIndexToZ is used to determine what Z corresponds to each response
        for (var i = 0; i < responses.length; i++){
          const z = urlIndexToZ[i]
          if (!matches[z]){
            matches[z] = []
          }
          matches[z] = matches[z].concat(responses[i])
        }
        return matches
      })
      .then(matches => dispatch(receiveData(dataType, matches)))
    }else{
      return fetch(mapDataTypeToURL(getState(), dataType))
        .then(response => response.json())
        .then(json => dispatch(receiveData(dataType, json)))
    }
  }
}

import {getSectionsForZ} from '../helpers/utils.js'

export const INVALIDATE_DATA = 'INVALIDATE_DATA'
export const REQUEST_DATA = 'REQUEST_DATA'
export const RECEIVE_DATA = 'RECEIVE_DATA'
export const UPDATE_START_Z = 'UPDATE_START_Z'
export const UPDATE_END_Z = 'UPDATE_END_Z'
export const UPDATE_PROJECT = 'UPDATE_PROJECT'
export const UPDATE_STACK = 'UPDATE_STACK'
export const UPDATE_MATCH_COLLECTION = 'UPDATE_MATCH_COLLECTION'
export const UPDATE_TILE_DATA = 'UPDATE_TILE_DATA'
export const UPDATE_PME_VARIABLES = 'UPDATE_PME_VARIABLES'

export function updateStartZ(zValue){
  return {
      type: UPDATE_START_Z,
      zValue
    }
}

export function updateEndZ(zValue){
  return {
      type: UPDATE_END_Z,
      zValue
    }
}

export function updateProject(project){
  return {
      type: UPDATE_PROJECT,
      project
    }
}

export function updateStack(stack){
  return {
      type: UPDATE_STACK,
      stack
    }
}

export function updateMatchCollection(matchCollection){
  return {
      type: UPDATE_MATCH_COLLECTION,
      matchCollection
    }
}

function requestData(dataType){
  return {
    type: REQUEST_DATA,
    dataType
  }
}

function receiveData(dataType, data){
  return {
    type: RECEIVE_DATA,
    dataType,
    data
  }
}

export function invalidateData(dataType){
  return {
    type: INVALIDATE_DATA,
    dataType
  }
}

export function updateTileData(tileData){
  return {
    type: UPDATE_TILE_DATA,
    tileData
  }
}

export function updatePMEVariables(PMEVariables){
  return {
    type: UPDATE_PME_VARIABLES,
    PMEVariables
  }
}

function fetchData(dataType){
  return dispatch => {
    dispatch(requestData(dataType))
    return fetch(mapDataTypeToURL(dataType))
      .then(response => response.json())
      .then(json => dispatch(receiveData(dataType, json)))
  }
}

function mapDataTypeToURL(state, dataType, params){
  const BASE_URL = 'http://renderer.int.janelia.org:8080/render-ws/v1/owner/flyTEM'
  const {selectedProject, selectedStack, selectedMatchCollection} = state.UserInput
  switch(dataType) {
    case "StackIds":
      return `${BASE_URL}/stackIds`
    case "MatchCollections":
      return `${BASE_URL}/matchCollections`
    case "StackResolution":
      return `${BASE_URL}/project/FAFB00/stack/v12_align`
    case "StackMetadata":
      return `${BASE_URL}/project/${selectedProject}/stack/${selectedStack}`
    case "SectionData":
      return `${BASE_URL}/project/${selectedProject}/stack/${selectedStack}/sectionData`
    case "TileBounds":
      return `${BASE_URL}/project/${selectedProject}/stack/${selectedStack}/z/${params.z}/tileBounds`
    case "SectionBounds":
      return `${BASE_URL}/project/${selectedProject}/stack/${selectedStack}/z/${params.z}/bounds`
    case "MatchesWithinGroup":
      return `${BASE_URL}/matchCollection/${selectedMatchCollection}/group/${params.groupId}/matchesWithinGroup`
    case "MatchesOutsideGroup":
      return `${BASE_URL}/matchCollection/${selectedMatchCollection}/group/${params.groupId}/matchesOutsideGroup`
    default:
      return null
  }
}

function shouldFetchData(state, dataType) {
  const data = state.APIData[dataType]
  if (!data) {
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

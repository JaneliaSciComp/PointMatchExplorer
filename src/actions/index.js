import isEmpty from 'lodash/isEmpty'

export const INVALIDATE_DATA = 'INVALIDATE_DATA'
export const REQUEST_DATA = 'REQUEST_DATA'
export const RECEIVE_DATA = 'RECEIVE_DATA'
export const UPDATE_START_Z = 'UPDATE_START_Z'
export const UPDATE_END_Z = 'UPDATE_END_Z'
export const UPDATE_PROJECT = 'UPDATE_PROJECT'
export const UPDATE_STACK = 'UPDATE_STACK'
export const UPDATE_MATCH_COLLECTION = 'UPDATE_MATCH_COLLECTION'

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

export function requestData(dataType){
  return {
    type: REQUEST_DATA,
    dataType
  }
}

export function receiveData(dataType, data){
  return {
    type: RECEIVE_DATA,
    dataType,
    data
  }
}

export function invalidateData(dataType) {
  return {
    type: INVALIDATE_DATA,
    dataType
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

function mapDataTypeToURL(dataType){
  const BASE_URL = 'http://tem-services.int.janelia.org:8080/render-ws/v1'
  switch(dataType) {
    case "StackIds":
    case "MatchCollections":
    case "StackResolution":
      return "http://127.0.0.1:5000/getStackResolution"
    case "StackMetadata":
      return "http://127.0.0.1:5000/getStackMetadata"
    case "SectionData":
    case "TileBounds":
    case "SectionBounds":
    case "MatchesWithinGroup":
    case "MatchesOutsideGroup":
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

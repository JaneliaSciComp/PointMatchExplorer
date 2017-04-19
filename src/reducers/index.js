import { combineReducers } from "redux"
import {
  INVALIDATE_DATA,
  REQUEST_DATA,
  RECEIVE_DATA,
  UPDATE_START_Z,
  UPDATE_END_Z,
  UPDATE_PROJECT,
  UPDATE_STACK,
  UPDATE_MATCH_COLLECTION,
  UPDATE_STACK_OWNER,
  UPDATE_MATCH_OWNER,
  UPDATE_TILE_DATA,
  UPDATE_PME_VARIABLES,
  RESET_STACK_DATA,
  RESET_MATCH_DATA,
  UPDATE_USER_INPUT
} from "../actions"

const dataInitialState = {
  isFetching: false,
  didInvalidate: false,
  Fetched: false,
  data: {}
}

//TODO: hook up to query params
export const userInputInitialState = {
  selectedProject: "",
  selectedStack: "",
  selectedMatchCollection: "",
  selectedStackOwner: "",
  selectedMatchOwner: "",
  renderDataHost: "tem-services.int.janelia.org:8080",
  dynamicRenderHost: "renderer.int.janelia.org:8080",
  catmaidHost: "renderer-catmaid:8000",
  mergeCollection: "",
  startZ: "",
  endZ: ""
}

const PMEVariablesInitialState = {
  minWeight: null,
  maxWeight: null,
  mouseoverMetadata: null,
  selectedMetadata: null,
  isShiftDown: false,
  isCtrlDown: false,
  isMetaDown: false,
  isPDown: false,
  rendered: false
}

const APIDataInitialState = {
  "StackOwners": dataInitialState,
  "MatchOwners": dataInitialState,
  "MatchCollections": dataInitialState,
  "StackResolution": dataInitialState,
  "StackMetadata": dataInitialState,
  "SectionData": dataInitialState,
  "StackIds": dataInitialState,
  "TileBounds": dataInitialState,
  "SectionBounds": dataInitialState,
  "MatchesWithinGroup": dataInitialState,
  "MatchesOutsideGroup": dataInitialState,
}

function UserInput(state = userInputInitialState, action){
  switch (action.type) {
    case UPDATE_START_Z:
      return Object.assign({}, state, {
        startZ: action.zValue
      })
    case UPDATE_END_Z:
      return Object.assign({}, state, {
        endZ: action.zValue
      })
    case UPDATE_PROJECT:
      return Object.assign({}, state, {
        selectedProject: action.project,
        selectedStack: ""
      })
    case UPDATE_STACK_OWNER:
      return Object.assign({}, state, {
        selectedStackOwner: action.stackOwner,
        selectedProject:"",
        selectedStack: ""
      })
    case UPDATE_STACK:
      return Object.assign({}, state, {
        selectedStack: action.stack
      })
    case UPDATE_MATCH_OWNER:
      return Object.assign({}, state, {
        selectedMatchOwner: action.matchOwner,
        selectedMatchCollection: ""
      })
    case UPDATE_MATCH_COLLECTION:
      return Object.assign({}, state, {
        selectedMatchCollection: action.matchCollection
      })
    case UPDATE_USER_INPUT:
      return Object.assign({}, state, action.userInputData)
    default:
      return state
  }
}

function getData(state = dataInitialState, action){
  switch (action.type) {
    case INVALIDATE_DATA:
      return Object.assign({}, state, {
        didInvalidate: true,
        Fetched: false,
      })
    case REQUEST_DATA:
      return Object.assign({}, state, {
        isFetching: true,
        didInvalidate: false,
        Fetched: false
      })
    case RECEIVE_DATA:
      return Object.assign({}, state, {
        isFetching: false,
        didInvalidate: false,
        Fetched: true,
        data: action.data
      })
    default:
      return state
  }
}

function APIData(state = APIDataInitialState, action){
  switch (action.type) {
    case INVALIDATE_DATA:
    case RECEIVE_DATA:
    case REQUEST_DATA:
      return Object.assign({}, state, {
        [action.dataType] : getData(state[action.dataType], action)
      })
    case RESET_STACK_DATA:
      return Object.assign({}, state, {
        "StackIds": dataInitialState,
        "StackMetadata": dataInitialState,
        "SectionData": dataInitialState,
      })
    case RESET_MATCH_DATA:
      return Object.assign({}, state, {
        "MatchCollections": dataInitialState,
      })
    default:
      return state
  }
}

function tileData(state = {}, action){
  switch (action.type) {
    case UPDATE_TILE_DATA:
      return action.tileData
    default:
      return state
  }
}

function PMEVariables(state = PMEVariablesInitialState, action){
  switch (action.type) {
    case UPDATE_PME_VARIABLES:
      return Object.assign({}, state, action.PMEVariables)
    default:
      return state
  }
}

const pmeApp = combineReducers({
  UserInput,
  APIData,
  tileData,
  PMEVariables
})

export default pmeApp

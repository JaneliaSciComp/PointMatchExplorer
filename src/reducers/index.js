import { combineReducers } from 'redux'
import {INVALIDATE_DATA, REQUEST_DATA, RECEIVE_DATA, UPDATE_START_Z, UPDATE_END_Z, UPDATE_PROJECT_AND_POPULATE_STACK, UPDATE_STACK, UPDATE_MATCH_COLLECTION} from '../actions'

const dataInitialState = {
	isFetching: false,
	didInvalidate: false,
	json: {}
}

const userInputInitialState = {
	selectedProject: null,
	selectedStack: null,
	selectedMatchCollection: null,
	startZ: null,
	endZ: null
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
		case UPDATE_PROJECT_AND_POPULATE_STACK:
			return Object.assign({}, state, {
					selectedProject: action.project
			})
		case UPDATE_STACK:
			return Object.assign({}, state, {
					selectedStack: action.stack
			})
		case UPDATE_MATCH_COLLECTION:
			return Object.assign({}, state, {
					selectedMatchCollection: action.matchCollection
			})
    default:
      return state
  }
}

function getData(state = dataInitialState, action){
	switch (action.type) {
		case INVALIDATE_DATA:
			return Object.assign({}, state, {
					didInvalidate: true
				})
		case REQUEST_DATA:
			 return Object.assign({}, state, {
				isFetching: true,
				didInvalidate: false
			})
		case RECEIVE_DATA:
			return Object.assign({}, state, {
				isFetching: false,
				didInvalidate: false,
				data: action.data
			})
		default:
			return state
	}
}

function APIData(state = {}, action) {
  switch (action.type) {
    case INVALIDATE_DATA:
		case RECEIVE_DATA:
    case REQUEST_DATA:
       return Object.assign({}, state, {
				 [action.dataType] : getData(state[action.dataType], action)
      })
    default:
      return state
  }
}

const pmeApp = combineReducers({
	UserInput,
	APIData
})

export default pmeApp

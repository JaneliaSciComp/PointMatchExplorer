import React, {Component} from "react"
import {connect} from "react-redux"
import {updateUserInput} from "../actions"
import {userInputInitialState} from "../reducers"
import URLSearchParams from "url-search-params"
/*
  Keeps url query params in sync with Redux store
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
        if(userInputInitialState.hasOwnProperty(key)){
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

    _.each(nextProps.UserInput, function(val,key){
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

const mapStateToProps = function(state) {
  const {UserInput} = state
  return {
    UserInput
  }
}

const mapDispatchToProps = function(dispatch) {
  return {
    updateUserInput: function(userInputData){
      dispatch(updateUserInput(userInputData))
    },
  }
}
export default connect(mapStateToProps, mapDispatchToProps)(UrlParamHandler)

import React, {Component} from "react";
import {connect} from "react-redux"
import {fetchDataIfNeeded, invalidateData, updateMatchCollection, updateStartZ, updateEndZ, updateProject, 
  updateStack, updateStackOwner, updateMatchOwner, resetStackData, resetMatchData} from "../actions"
import {getUserInputSelectLists} from "../helpers/utils.js"
import {SpecsInput, LayerInput} from "./InputComponents.js"

class UserInputs extends Component {
  constructor(props){
    super(props)
    this.handleChangeStartZ = this.handleChangeStartZ.bind(this)
    this.handleChangeEndZ = this.handleChangeEndZ.bind(this)
    this.handleProjectSelect = this.handleProjectSelect.bind(this)
    this.handleStackSelect = this.handleStackSelect.bind(this)
    this.handleMatchCollectionSelect = this.handleMatchCollectionSelect.bind(this)
    this.handleStackOwnerSelect = this.handleStackOwnerSelect.bind(this)
    this.handleMatchOwnerSelect = this.handleMatchOwnerSelect.bind(this)
  }

  handleChangeStartZ(zValue){
    this.props.updateStartZ(zValue)
  }

  handleChangeEndZ(zValue){
    this.props.updateEndZ(zValue)
  }

  handleProjectSelect(project){
    this.props.updateProject(project)
  }

  handleStackSelect(stack){
    this.props.updateStack(stack)
  }

  handleMatchCollectionSelect(matchCollection){
    this.props.updateMatchCollection(matchCollection)
  }

  handleStackOwnerSelect(stackOwner){
    this.props.resetStackData()
    this.props.updateStackOwner(stackOwner)
  }

  handleMatchOwnerSelect(matchOwner){
    this.props.resetMatchData()
    this.props.updateMatchOwner(matchOwner)
  }
  
  componentWillMount(){
    this.props.getData("StackOwners")
    this.props.getData("StackResolution")
    this.props.getData("MatchOwners")
  }
  componentWillReceiveProps(nextProps){
    const {StackOwners, MatchOwners, SectionData} = nextProps.APIData
    const {selectedStackOwner, selectedMatchOwner} = nextProps.UserInput

    if(StackOwners.Fetched && selectedStackOwner){
      nextProps.getData("StackIds")
    }
    if (MatchOwners.Fetched && selectedMatchOwner){
      nextProps.getData("MatchCollections")
    }

    if (SectionData.Fetched){
      nextProps.getData("MatchesWithinGroup")
      nextProps.getData("MatchesOutsideGroup")
    }
  }

  render(){
    const {APIData, UserInput} = this.props
    const dropdownValues = getUserInputSelectLists(APIData, UserInput)
    
    return (
      <div>
        {dropdownValues &&
        <div>
            <SpecsInput
              projects={dropdownValues.projects}
              stacks={dropdownValues.stacks}
              match_collections={dropdownValues.match_collections}
              stack_owners={dropdownValues.stack_owners}
              match_owners={dropdownValues.match_owners}
              onProjectSelect={this.handleProjectSelect}
              onStackSelect={this.handleStackSelect}
              onMatchCollectionSelect={this.handleMatchCollectionSelect}
              onStackOwnerSelect={this.handleStackOwnerSelect}
              onMatchOwnerSelect={this.handleMatchOwnerSelect}
              selectedProject={UserInput.selectedProject}
              selectedStack={UserInput.selectedStack}
              selectedMatchCollection={UserInput.selectedMatchCollection}
              selectedProject={UserInput.selectedProject}
              selectedStack={UserInput.selectedStack}
              selectedMatchCollection={UserInput.selectedMatchCollection}
              selectedStackOwner={UserInput.selectedStackOwner}
              selectedMatchOwner={UserInput.selectedMatchOwner}/>
            <LayerInput
              onRenderClick={this.props.onRenderClick}
              onChangeStartZ={this.handleChangeStartZ}
              onChangeEndZ={this.handleChangeEndZ} />
        </div>
      }
      </div>
    )
  }

}

const mapStateToProps = function(state) {
  const {APIData, UserInput} = state
  return {
    APIData,
    UserInput
  }
}

const mapDispatchToProps = function(dispatch) {
  return {
    getData: function(dataType) {
      dispatch(fetchDataIfNeeded(dataType))
    },
    invalidateData: function(dataType){
      dispatch(invalidateData(dataType))
    },
    updateStartZ: function(zValue){
      dispatch(updateStartZ(zValue))
    },
    updateEndZ: function(zValue){
      dispatch(updateEndZ(zValue))
    },
    updateProject: function(project){
      dispatch(updateProject(project))
    },
    updateStack: function(stack){
      dispatch(updateStack(stack))
    },
    updateMatchCollection: function(matchCollection){
      dispatch(updateMatchCollection(matchCollection))
    },
    updateStackOwner: function(stackOwner){
      dispatch(updateStackOwner(stackOwner))
    },
    updateMatchOwner: function(matchOwner){
      dispatch(updateMatchOwner(matchOwner))
    },
    resetStackData: function(){
      dispatch(resetStackData())
    },
    resetMatchData: function(){
      dispatch(resetMatchData())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UserInputs)

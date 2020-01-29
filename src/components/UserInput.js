import React, {Component} from "react"
import {connect} from "react-redux"
import {fetchDataIfNeeded, invalidateData, updateMatchCollection, updateStartZ, updateEndZ, updateProject, 
  updateStack, updateStackOwner, updateMatchOwner, resetStackData, resetSubVolumeData, resetMatchData,
  mapDataTypeToURL} from "../actions"
import {getUserInputSelectLists} from "../helpers/utils.js"
import {PMEInput} from "./InputComponents.js"

class UserInputs extends Component {
  constructor(props){
    super(props);
    this.handleChangeStartZ = this.handleChangeStartZ.bind(this);
    this.handleChangeEndZ = this.handleChangeEndZ.bind(this);
    this.handleProjectSelect = this.handleProjectSelect.bind(this);
    this.handleStackSelect = this.handleStackSelect.bind(this);
    this.handleMatchCollectionSelect = this.handleMatchCollectionSelect.bind(this);
    this.handleStackOwnerSelect = this.handleStackOwnerSelect.bind(this);
    this.handleMatchOwnerSelect = this.handleMatchOwnerSelect.bind(this)
  }

  handleChangeStartZ(zValue){
    this.props.resetSubVolumeData();
    this.props.updateStartZ(zValue)
  }

  handleChangeEndZ(zValue){
    this.props.resetSubVolumeData();
    this.props.updateEndZ(zValue)
  }

  handleProjectSelect(project){
    this.props.invalidateData("StackMetadata");
    this.props.resetSubVolumeData();
    this.props.updateProject(project)
  }

  handleStackSelect(stack){
    this.props.invalidateData("StackMetadata");
    this.props.resetSubVolumeData();
    this.props.updateStack(stack)
  }

  handleMatchCollectionSelect(matchCollection){
    this.props.resetMatchData();
    this.props.updateMatchCollection(matchCollection)
  }

  handleStackOwnerSelect(stackOwner){
    this.props.resetStackData();
    this.props.updateStackOwner(stackOwner)
  }

  handleMatchOwnerSelect(matchOwner){
    this.props.resetMatchData();
    this.props.updateMatchOwner(matchOwner)
  }

  componentWillMount(){
    this.props.getData("StackOwners");
    this.props.getData("MatchOwners")
  }

  isNameValid(name, validNames) {
    let isValid = false;
    validNames.some(function(validName) {
      if (name === validName) {
        isValid = true;
        return true;
      }
    });
    return isValid;
  }

  isStackNameValid(name, validStackIds) {
    let isValid = false;
    validStackIds.some(function(stackId) {
      if (name === stackId.stack) {
        isValid = true;
        return true;
      }
    });
    return isValid;
  }

  isCollectionNameValid(name, collectionDataList) {
    let isValid = false;
    collectionDataList.some(function(collectionData) {
      if (name === collectionData.collectionId.name) {
        isValid = true;
        return true;
      }
    });
    return isValid;
  }

  componentWillReceiveProps(nextProps) {

    const {StackOwners, StackIds, MatchOwners, MatchCollections, StackSubVolume} = nextProps.APIData;
    const {selectedStackOwner, selectedStack, selectedMatchOwner, selectedMatchCollection} = nextProps.UserInput;

    if (StackOwners.Fetched && selectedStackOwner) {

      if (this.isNameValid(selectedStackOwner, StackOwners.data)) {
        nextProps.getData("StackIds");
      } else {
        this.handleStackOwnerSelect(""); // remove invalid selection
      }

    }

    if (StackIds.Fetched && selectedStack) {

      if (this.isStackNameValid(selectedStack, StackIds.data)) {
        nextProps.getData("StackMetadata");
      } else {
        this.handleStackSelect(""); // remove invalid selection
      }

    }

    if (MatchOwners.Fetched && selectedMatchOwner) {

      if (this.isNameValid(selectedMatchOwner, MatchOwners.data)) {
        nextProps.getData("MatchCollections");
      } else {
        this.handleMatchOwnerSelect(""); // remove invalid selection
      }

    }

    if (MatchCollections.Fetched && selectedMatchCollection) {

      if (! this.isCollectionNameValid(selectedMatchCollection, MatchCollections.data)) {
        this.handleMatchCollectionSelect(""); // remove invalid selection
      }

    }

    if (StackSubVolume.Fetched) {
      nextProps.getData("MatchCounts");
    }

  }

  render() {
    const {APIData, UserInput} = this.props;
    const dropdownValues = getUserInputSelectLists(APIData, UserInput);
    const stackDetailsViewUrl = mapDataTypeToURL(this.props, "StackDetailsView", {});

    if (dropdownValues) {
      return (
        <PMEInput
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
          selectedStackMetadata={APIData.StackMetadata}
          selectedStackSubVolume={APIData.StackSubVolume}
          selectedMatchCounts={APIData.MatchCounts}
          stackDetailsViewUrl={stackDetailsViewUrl}
          selectedMatchCollection={UserInput.selectedMatchCollection}
          selectedStackOwner={UserInput.selectedStackOwner}
          selectedMatchOwner={UserInput.selectedMatchOwner}
          onRenderClick={this.props.onRenderClick}
          onChangeStartZ={this.handleChangeStartZ}
          selectedStartZ={UserInput.startZ}
          onChangeEndZ={this.handleChangeEndZ}
          selectedEndZ={UserInput.endZ}/>
      )
    } else {
      return "";
    }
  }

}

const mapStateToProps = function(state) {
  const {APIData, UserInput} = state;
  return {
    APIData,
    UserInput
  }
};

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
    resetSubVolumeData: function(){
      dispatch(resetSubVolumeData())
    },
    resetMatchData: function(){
      dispatch(resetMatchData())
    }
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(UserInputs)

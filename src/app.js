import React, { Component } from "react"
import {connect} from "react-redux"
import {SpecsInput, LayerInput} from "./components/userInput"
import {PMStrengthGradient} from "./components/PMStrengthGradient"
import {MetadataInfo} from "./components/MetadataInfo"
import {fetchDataIfNeeded, invalidateData, updateStartZ, updateEndZ, updateProject, updateStack,
  updateMatchCollection, updateStackOwner, updateMatchOwner, updateTileData, updatePMEVariables,
  resetStackData, resetMatchData} from "./actions"
import {getTileData, getUserInputSelectLists} from "./helpers/utils.js"
import {camera, generateVisualization, onMouseMove, onMouseUp, onMouseDown, disposeThreeScene} from "./helpers/utils-three.js"
import "whatwg-fetch"
import isEmpty from "lodash/isEmpty"

class App extends Component {
  constructor(props) {
    super(props)
    this.handleChangeStartZ = this.handleChangeStartZ.bind(this)
    this.handleChangeEndZ = this.handleChangeEndZ.bind(this)
    this.handleProjectSelect = this.handleProjectSelect.bind(this)
    this.handleStackSelect = this.handleStackSelect.bind(this)
    this.handleMatchCollectionSelect = this.handleMatchCollectionSelect.bind(this)
    this.handleStackOwnerSelect = this.handleStackOwnerSelect.bind(this)
    this.handleMatchOwnerSelect = this.handleMatchOwnerSelect.bind(this)
    this.handleRenderClick = this.handleRenderClick.bind(this)
    this.processMouseMove = this.processMouseMove.bind(this)
    this.processMouseDown = this.processMouseDown.bind(this)
    this.processMouseUp = this.processMouseUp.bind(this)
    this.detectKeyDown = this.detectKeyDown.bind(this)
    this.detectKeyUp = this.detectKeyUp.bind(this)
    this.afterMouseUp = this.afterMouseUp.bind(this)
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

  handleRenderClick(){
    const {selectedProject, selectedStack, selectedMatchCollection, startZ, endZ} = this.props.UserInput
    let readyToRender = (selectedProject!=null && selectedStack!=null && selectedMatchCollection!=null && startZ!=null && endZ!=null )
    var canvas = this.refs.PMEcanvas
    if (canvas){
      this.props.updatePMEVariables({rendered: false})
      this.props.updateTileData([])
      this.props.invalidateData("SectionBounds")
      this.props.invalidateData("TileBounds")
      this.props.invalidateData("SectionData")
      this.props.invalidateData("MatchesWithinGroup")
      this.props.invalidateData("MatchesOutsideGroup")
      canvas.removeEventListener("mousemove", this.processMouseMove, false)
      canvas.removeEventListener("mousedown", this.processMouseDown, false)
      canvas.removeEventListener("mouseup", this.processMouseUp, false)
      document.removeEventListener("keydown", this.detectKeyDown, false)
      document.removeEventListener("keyup", this.detectKeyUp, false)
      disposeThreeScene()
    }
    if (readyToRender){
      this.props.getData("SectionBounds")
      this.props.getData("TileBounds")
      this.props.getData("SectionData")
    }
  }

  processMouseMove(event){
    var md = onMouseMove(event)
    this.props.updatePMEVariables({mouseoverMetadata: md})
  }

  processMouseDown(event){
    onMouseDown(event)
  }

  processMouseUp(event){
    const {isShiftDown, isCtrlDown, isMetaDown} = this.props.PMEVariables
    var md = onMouseUp(event, isShiftDown, isCtrlDown, isMetaDown, this.afterMouseUp, this.props.UserInput, this.props.APIData.StackResolution.data.currentVersion)
    this.props.updatePMEVariables({selectedMetadata: md})
  }

  detectKeyDown(event){
    switch(event.key) {
      case "Shift": this.props.updatePMEVariables({isShiftDown: true}); break
      case "Control": this.props.updatePMEVariables({isCtrlDown: true}); break
      case "Meta": this.props.updatePMEVariables({isMetaDown: true}); break
    }
  }

  detectKeyUp(event){
    switch(event.key) {
      case "Shift": this.props.updatePMEVariables({isShiftDown: false}); break
      case "Control": this.props.updatePMEVariables({isCtrlDown: false}); break
      case "Meta": this.props.updatePMEVariables({isMetaDown: false}); break
    }
  }

  afterMouseUp(){
    this.props.updatePMEVariables({isShiftDown: false})
    this.props.updatePMEVariables({isCtrlDown: false})
    this.props.updatePMEVariables({isMetaDown: false})
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
    if (this.readyToFetchTiles(nextProps)){
      nextProps.updateTileData(getTileData(nextProps.APIData, nextProps.UserInput))
    }
  }

  readyToFetchTiles(nextProps){
    const {SectionBounds,TileBounds, SectionData, MatchesWithinGroup, MatchesOutsideGroup} = nextProps.APIData
    return SectionBounds.Fetched && TileBounds.Fetched && SectionData.Fetched && 
      MatchesWithinGroup.Fetched && MatchesOutsideGroup.Fetched && isEmpty(nextProps.tileData)
  }

  render() {
    const {APIData, UserInput} = this.props
    const dropdownValues = getUserInputSelectLists(APIData, UserInput)
    const PMEComponents = this.generatePMEComponents()
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
                onRenderClick={this.handleRenderClick}
                onChangeStartZ={this.handleChangeStartZ}
                onChangeEndZ={this.handleChangeEndZ} />
          </div>
        }
        {!isEmpty(this.props.tileData) ? PMEComponents : <div></div>}
      </div>
    )
  }

  generatePMEComponents() {
    var canvas_node = <canvas ref="PMEcanvas"/>
    var pm_connection_strength_gradient
    var metadata_display
    var selected_metadata_display
    var mouseover_metadata_display
    var pm_connection_strength_gradient_colors = ["#c33f2e", "#fc9d59", "#fee08b", "#e0f381", "#76c76f", "#3288bd"]
    //how many steps to generate the gradient in
    var pm_connection_strength_gradient_steps = 20

    const {minWeight, maxWeight, mouseoverMetadata, selectedMetadata} = this.props.PMEVariables

    if (minWeight && maxWeight){
      pm_connection_strength_gradient = <PMStrengthGradient gradientTitle="Point Match Strength" colorList={pm_connection_strength_gradient_colors} numSteps={pm_connection_strength_gradient_steps} dmin={minWeight} dmax= {maxWeight} />
    }
    if (selectedMetadata){
      selected_metadata_display = (<div><MetadataInfo kvpairs={selectedMetadata}/><br/></div>)
    }
    if (mouseoverMetadata){
      mouseover_metadata_display = <MetadataInfo kvpairs={mouseoverMetadata}/>
    }
    metadata_display =
    (
      <div className="metaDataContainer">
        {selected_metadata_display}
        {mouseover_metadata_display}
      </div>
    )
    return <div id="container">{pm_connection_strength_gradient}{metadata_display}{canvas_node}</div>
  }

  componentDidUpdate(){
    const {tileData, PMEVariables} = this.props
    const {rendered} = PMEVariables
    if (!isEmpty(tileData) && !rendered){
      var canvas = this.refs.PMEcanvas
      canvas.addEventListener("resize", function(){
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth, window.innerHeight)
      }, false)
      canvas.addEventListener("mousemove", this.processMouseMove, false)
      canvas.addEventListener("mousedown", this.processMouseDown, false)
      canvas.addEventListener("mouseup", this.processMouseUp, false)
      document.addEventListener("keydown", this.detectKeyDown, false)
      document.addEventListener("keyup", this.detectKeyUp, false)
      var updatedPMEVariables = generateVisualization(this.refs.PMEcanvas, tileData)
      updatedPMEVariables.rendered = true
      this.props.updatePMEVariables(updatedPMEVariables)
    }
  }

}

const mapStateToProps = function(state) {
  const {APIData, UserInput, tileData, PMEVariables} = state
  return {
    APIData,
    UserInput,
    tileData,
    PMEVariables
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
    updateTileData: function(tileData){
      dispatch(updateTileData(tileData))
    },
    updatePMEVariables: function(PMEVariables){
      dispatch(updatePMEVariables(PMEVariables))
    },
    resetStackData: function(){
      dispatch(resetStackData())
    },
    resetMatchData: function(){
      dispatch(resetMatchData())
    }
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)

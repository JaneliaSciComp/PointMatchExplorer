import React, {Component} from "react"
import {connect} from "react-redux"
import UserInputs from "./components/userInput"
import {PMStrengthGradient} from "./components/PMStrengthGradient"
import {MetadataInfo} from "./components/MetadataInfo"
import {fetchDataIfNeeded, invalidateData, updateTileData, updatePMEVariables} from "./actions"
import {getTileData} from "./helpers/utils.js"
import {camera, pm_connection_strength_gradient_colors, generateVisualization, onMouseMove, onMouseUp, onMouseDown, disposeThreeScene} from "./helpers/utils-three.js"
import "whatwg-fetch"
import isEmpty from "lodash/isEmpty"
import UrlParamHandler from "./components/UrlParamHandler"


class App extends Component {
  constructor(props) {
    super(props);
    this.processMouseMove = this.processMouseMove.bind(this);
    this.processMouseDown = this.processMouseDown.bind(this);
    this.processMouseUp = this.processMouseUp.bind(this);
    this.detectKeyDown = this.detectKeyDown.bind(this);
    this.detectKeyUp = this.detectKeyUp.bind(this);
    this.afterMouseUp = this.afterMouseUp.bind(this)
  }

  handleRenderClick(){
    const {selectedProject, selectedStack, selectedMatchCollection, startZ, endZ} = this.props.UserInput;
    let readyToRender = (selectedProject && selectedStack && selectedMatchCollection && startZ!=="" && endZ!=="" );
    const canvas = this.refs.PMEcanvas;
    if (canvas) {
      this.props.updatePMEVariables({rendered: false});
      this.props.updateTileData([]);
      this.props.invalidateData("StackSubVolume");
      this.props.invalidateData("TileBounds");
      this.props.invalidateData("StackMetadata");
      this.props.invalidateData("MatchCounts");
      canvas.removeEventListener("mousemove", this.processMouseMove, false);
      canvas.removeEventListener("mousedown", this.processMouseDown, false);
      canvas.removeEventListener("mouseup", this.processMouseUp, false);
      document.removeEventListener("keydown", this.detectKeyDown, false);
      document.removeEventListener("keyup", this.detectKeyUp, false);
      disposeThreeScene();
    }
    if (readyToRender){
      this.props.getData("StackSubVolume");
      this.props.getData("TileBounds");
      this.props.getData("StackMetadata");
    }
  }

  processMouseMove(event){
    const md = onMouseMove(event);
    this.props.updatePMEVariables({mouseoverMetadata: md});
  }

  processMouseDown(event){
    onMouseDown(event)
  }

  /**
   * @typedef {Object} StackMetadata
   * @property {String} stackId.owner
   * @property {String} stackId.project
   * @property {String} stackId.stack
   * @property {String} state
   * @property {String} currentVersion.createTimestamp
   * @property {String} currentVersion.versionNotes
   * @property {Number} currentVersion.stackResolutionX
   * @property {Number} currentVersion.stackResolutionY
   * @property {Number} currentVersion.stackResolutionZ
   * @property {Number} stats.stackBounds.minX
   * @property {Number} stats.stackBounds.minY
   * @property {Number} stats.stackBounds.minZ
   * @property {Number} stats.stackBounds.maxX
   * @property {Number} stats.stackBounds.maxY
   * @property {Number} stats.stackBounds.maxZ
   * @property {Number} stats.sectionCount
   * @property {Number} stats.tileCount
   */
  processMouseUp(event){
    const {isShiftDown, isCtrlDown, isMetaDown, isPDown} = this.props.PMEVariables;
    const md = onMouseUp(event, isShiftDown, isCtrlDown, isMetaDown, isPDown, this.afterMouseUp, this.props.UserInput, this.props.APIData.StackMetadata.data.currentVersion);
    this.props.updatePMEVariables({selectedMetadata: md})
  }

  detectKeyDown(event){
    switch(event.key) {
      case "Shift": this.props.updatePMEVariables({isShiftDown: true}); break;
      case "Control": this.props.updatePMEVariables({isCtrlDown: true}); break;
      case "Meta": this.props.updatePMEVariables({isMetaDown: true}); break;
      case "p": this.props.updatePMEVariables({isPDown: true}); break;
    }
  }

  detectKeyUp(event){
    switch(event.key) {
      case "Shift": this.props.updatePMEVariables({isShiftDown: false}); break;
      case "Control": this.props.updatePMEVariables({isCtrlDown: false}); break;
      case "Meta": this.props.updatePMEVariables({isMetaDown: false}); break;
      case "p": this.props.updatePMEVariables({isPDown: false}); break;
    }
  }

  afterMouseUp(){
    this.props.updatePMEVariables({isShiftDown: false});
    this.props.updatePMEVariables({isCtrlDown: false});
    this.props.updatePMEVariables({isMetaDown: false});
    this.props.updatePMEVariables({isPDown: false});
  }


  componentWillReceiveProps(nextProps){

    if (this.readyToFetchTiles(nextProps)){
      nextProps.updateTileData(getTileData(nextProps.APIData))
    }
  }

  readyToFetchTiles(nextProps){
    const {StackSubVolume, TileBounds, MatchCounts} = nextProps.APIData;
    return StackSubVolume.Fetched && TileBounds.Fetched && MatchCounts.Fetched && isEmpty(nextProps.tileData);
  }

  render() {
    const PMEComponents = this.generatePMEComponents();
    return (
      <div>
        <UserInputs onRenderClick={this.handleRenderClick.bind(this)}/>
        {!isEmpty(this.props.tileData) ? PMEComponents : <div/>}
        <UrlParamHandler />
      </div>
    )
  }

  generatePMEComponents() {
    const canvas_node = <canvas ref="PMEcanvas"/>;
    let pm_connection_strength_gradient;
    let metadata_display;
    let selected_metadata_display;
    let mouseover_metadata_display;
    //how many steps to generate the gradient in
    const pm_connection_strength_gradient_steps = 20;

    const {minWeight, maxWeight, mouseoverMetadata, selectedMetadata} = this.props.PMEVariables;

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
    );
    return <div id="container">{pm_connection_strength_gradient}{metadata_display}{canvas_node}</div>
  }

  componentDidUpdate(){
    const {tileData, PMEVariables} = this.props;
    const {rendered} = PMEVariables;

    // TODO: show number of tiles to highlight nothing found cases

    if (!isEmpty(tileData) && !rendered){
      const canvas = this.refs.PMEcanvas;

      // TODO: size canvas smaller so that inputs are not obscured

      canvas.addEventListener("resize", function(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight)
      }, false);
      canvas.addEventListener("mousemove", this.processMouseMove, false);
      canvas.addEventListener("mousedown", this.processMouseDown, false);
      canvas.addEventListener("mouseup", this.processMouseUp, false);
      document.addEventListener("keydown", this.detectKeyDown, false);
      document.addEventListener("keyup", this.detectKeyUp, false);
      const updatedPMEVariables = generateVisualization(this.refs.PMEcanvas, tileData);
      updatedPMEVariables.rendered = true;
      this.props.updatePMEVariables(updatedPMEVariables)
    }
  }

}

const mapStateToProps = function(state) {
  const {APIData, UserInput, tileData, PMEVariables} = state;
  return {
    APIData,
    UserInput,
    tileData,
    PMEVariables
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
    updateTileData: function(tileData){
      dispatch(updateTileData(tileData))
    },
    updatePMEVariables: function(PMEVariables){
      dispatch(updatePMEVariables(PMEVariables))
    }
  }
};

export default connect(mapStateToProps, mapDispatchToProps)(App)

import React, { Component } from 'react'
import {connect} from 'react-redux'
import {SpecsInput, LayerInput} from './components/userInput'
import {PMStrengthGradient} from './components/PMStrengthGradient'
import {MetadataInfo} from './components/MetadataInfo'
import {fetchDataIfNeeded, updateStartZ, updateEndZ, updateProjectAndPopulateStack, updateStack, updateMatchCollection} from './actions'
import 'whatwg-fetch'
import 'lodash'
import 'three'
import isEmpty from 'lodash/isEmpty'

class App extends Component {
	constructor(props) {
		super(props)
		this.handleChangeStartZ = this.handleChangeStartZ.bind(this)
		this.handleChangeEndZ = this.handleChangeEndZ.bind(this)
		this.handleProjectSelect = this.handleProjectSelect.bind(this)
		this.handleStackSelect = this.handleStackSelect.bind(this)
		this.handleMatchCollectionSelect = this.handleMatchCollectionSelect.bind(this)
	}

	componentWillMount(){
		//do calls to get project, stack and match collection info
		this.props.getData('StackResolution')
		this.props.getData('StackMetadata')
	}

	componentDidMount() {
	}

	handleChangeStartZ(zValue){
		this.props.updateStartZ(zValue)
	}

	handleChangeEndZ(zValue){
		this.props.updateEndZ(zValue)
	}

	handleProjectSelect(project){
		this.props.updateProjectAndPopulateStack(project)
	}

	handleStackSelect(stack){
		this.props.updateStack(stack)
	}

	handleMatchCollectionSelect(matchCollection){
		this.props.updateMatchCollection(matchCollection)
	}

	render() {
		const { tileData, isFetching } = this.props
		console.log(tileData)
		const placeholderData = {
			stackIds: [{
				project: "project1",
				stack: "stack1"
			}],
			matchCollections: [{
				collectionId: {
					name: "collection1"
				}
			}]
		}
		return (
			<div>
				<SpecsInput
					stackIds={placeholderData.stackIds}
					matchCollections={placeholderData.matchCollections}
					onProjectSelect={this.handleProjectSelect}
					onStackSelect={this.handleStackSelect}
					onMatchCollectionSelect={this.handleMatchCollectionSelect}/>
				<LayerInput onChangeStartZ={this.handleChangeStartZ} onChangeEndZ={this.handleChangeEndZ} />
			</div>
		)
	}
}

const mapStateToProps = function(state) {
  console.log(state)
	const {APIData} = state
	const {isFetching, didInvalidate, tileData} = (!isEmpty(APIData)) ? APIData : {
					isFetching: false,
					didInvalidate: false,
					lastUpdated: 0,
					tileData: {}
	}
	return {
		url: "http://127.0.0.1:5000/getStackResolution",
		tileData
	}
}

const mapDispatchToProps = function(dispatch) {
	return {
		getData: function(dataType) {
			dispatch(fetchDataIfNeeded(dataType))
		},
		updateStartZ: function(zValue){
			dispatch(updateStartZ(zValue))
		},
		updateEndZ: function(zValue){
			dispatch(updateEndZ(zValue))
		},
		updateProjectAndPopulateStack: function(project){
			dispatch(updateProjectAndPopulateStack(project))
		},
		updateStack: function(stack){
			dispatch(updateStack(stack))
		},
		updateMatchCollection: function(matchCollection){
			dispatch(updateMatchCollection(matchCollection))
		},
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(App)

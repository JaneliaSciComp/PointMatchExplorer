export const INVALIDATE_DATA = "INVALIDATE_DATA";
export const REQUEST_DATA = "REQUEST_DATA";
export const RECEIVE_DATA = "RECEIVE_DATA";
export const UPDATE_START_Z = "UPDATE_START_Z";
export const UPDATE_END_Z = "UPDATE_END_Z";
export const UPDATE_PROJECT = "UPDATE_PROJECT";
export const UPDATE_STACK = "UPDATE_STACK";
export const UPDATE_MATCH_COLLECTION = "UPDATE_MATCH_COLLECTION";
export const UPDATE_STACK_OWNER = "UPDATE_STACK_OWNER";
export const UPDATE_MATCH_OWNER = "UPDATE_MATCH_OWNER";
export const UPDATE_TILE_DATA = "UPDATE_TILE_DATA";
export const UPDATE_PME_VARIABLES = "UPDATE_PME_VARIABLES";
export const RESET_STACK_DATA = "RESET_STACK_DATA";
export const RESET_MATCH_DATA = "RESET_MATCH_DATA";
export const UPDATE_USER_INPUT = "UPDATE_USER_INPUT";

export function updateUserInput(userInputData){
  return {
    type: UPDATE_USER_INPUT,
    userInputData
  }
}

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

export function updateStackOwner(stackOwner){
  return {
    type: UPDATE_STACK_OWNER,
    stackOwner
  }
}

export function updateMatchOwner(matchOwner){
  return {
    type: UPDATE_MATCH_OWNER,
    matchOwner
  }
}

export function resetStackData(){
  return {
    type: RESET_STACK_DATA
  }
}

export function resetMatchData(){
  return {
    type: RESET_MATCH_DATA
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

/**
 * @typedef {Object} SectionData
 * @property {String} sectionId
 * @property {Number} z
 * @property {Number} tileCount
 * @property {Number} minX
 * @property {Number} minY
 * @property {Number} maxX
 * @property {Number} maxY
 */
function fetchData(dataType){
  return (dispatch, getState) => {

    dispatch(requestData(dataType));

    const state = getState();

    if (dataType === "TileBounds") {

      fetch(mapDataTypeToURL(getState(), "StackZValues"))
        .then(response => response.json())
        .then(zValues => {
          const urls = [];
          zValues.forEach(z => {
            urls.push(mapDataTypeToURL(getState(), dataType, {z:z}))
          });
          const promises = urls.map(url => fetch(url).then(response => response.json()));
          return Promise.all(promises)
            .then(responses  => {
              const zToTileBoundsLists = {};
              for (let i = 0; i < responses.length; i++) {
                if (responses[i].length > 0) {
                  const layerZ = responses[i][0].z;
                  zToTileBoundsLists[layerZ] = responses[i]
                }
              }
              return zToTileBoundsLists;
            })
            .then(zToTileBoundsLists => dispatch(receiveData(dataType, zToTileBoundsLists)));
        });

    } else if (dataType === "StackSubVolume") {

      fetch(mapDataTypeToURL(getState(), dataType))
        .then(response => response.json())
        .then(sectionDataList => {

          const subVolume = {
            minX: Infinity,
            minY: Infinity,
            minZ: Infinity,
            maxX: -Infinity,
            maxY: -Infinity,
            maxZ: -Infinity,
            tileCount: 0,
            sectionIdToZ: {},
            zValues: {},
            orderedZValues: [],
          };

          sectionDataList.forEach(
            sectionData => {
              subVolume.minX = Math.min(subVolume.minX, sectionData.minX);
              subVolume.minY = Math.min(subVolume.minY, sectionData.minY);
              subVolume.minZ = Math.min(subVolume.minZ, sectionData.z);
              subVolume.maxX = Math.max(subVolume.maxX, sectionData.maxX);
              subVolume.maxY = Math.max(subVolume.maxY, sectionData.maxY);
              subVolume.maxZ = Math.max(subVolume.maxZ, sectionData.z);
              subVolume.tileCount += sectionData.tileCount;
              subVolume.sectionIdToZ[sectionData.sectionId] = sectionData.z;
              subVolume.zValues[sectionData.z] = 1;
            }
          );

          subVolume.orderedZValues = Object.keys(subVolume.zValues).sort();

          return subVolume;

        })
        .then(subVolume => dispatch(receiveData(dataType, subVolume)));

    } else if (dataType === "MatchCounts") {

      const urls = [];
      const subVolume = state.APIData.StackSubVolume.data;
      const subVolumeSectionIds = Object.keys(subVolume.sectionIdToZ);
      subVolumeSectionIds.forEach(sectionId => {
        urls.push(mapDataTypeToURL(getState(), dataType, {groupId: sectionId}))
      });

      const promises = urls.map(url => fetch(url).then(response => response.json()));

      return Promise.all(promises)
        .then(listOfCanvasMatchesLists  => {

          let matches = {};

          listOfCanvasMatchesLists.forEach(canvasMatchesListForPGroup => {
            canvasMatchesListForPGroup.forEach(canvasMatches => {
              const pz = parseFloat(canvasMatches.pGroupId);
              const qz = parseFloat(canvasMatches.qGroupId);
              if ((pz in subVolume.zValues) && (qz in subVolume.zValues)) {
                const minZ = Math.min(pz, qz);
                if (!(minZ in matches)) {
                  matches[minZ] = [];
                }
                matches[minZ].push(canvasMatches);
              }
            })

          });

          return matches;

        })
        .then(matches => dispatch(receiveData(dataType, matches)));

    } else {

      return fetch(mapDataTypeToURL(getState(), dataType))
        .then(response => response.json())
        .then(json => dispatch(receiveData(dataType, json)));

    }
  }
}

function mapDataTypeToURL(state, dataType, params){
  const {selectedProject, selectedStack, selectedMatchCollection, selectedStackOwner,
    selectedMatchOwner, renderDataHost, mergeCollection, startZ, endZ } = state.UserInput;
  const BASE_URL = `http://${renderDataHost}/render-ws/v1`;
  const MATCH_BASE_URL = `${BASE_URL}/owner/${selectedMatchOwner}`;
  const STACK_BASE_URL = `${BASE_URL}/owner/${selectedStackOwner}`;

  let matchQueryParameters = "";
  if (mergeCollection.length > 0) {
    matchQueryParameters = "?mergeCollection=" + mergeCollection
  }

  switch(dataType) {
    case "StackOwners": 
      return `${BASE_URL}/owners`;
    case "MatchOwners":
      return `${BASE_URL}/matchCollectionOwners`;
    case "StackIds":
      return `${STACK_BASE_URL}/stackIds`;
    case "MatchCollections":
      return `${MATCH_BASE_URL}/matchCollections`;
    case "StackMetadata":
      return `${STACK_BASE_URL}/project/${selectedProject}/stack/${selectedStack}`;
    case "StackSubVolume":
      return `${STACK_BASE_URL}/project/${selectedProject}/stack/${selectedStack}/sectionData?minZ=${startZ}&maxZ=${endZ}`;
    case "StackZValues":
      return `${STACK_BASE_URL}/project/${selectedProject}/stack/${selectedStack}/zValues?minZ=${startZ}&maxZ=${endZ}`;
    case "TileBounds":
      return `${STACK_BASE_URL}/project/${selectedProject}/stack/${selectedStack}/z/${params.z}/tileBounds`;
    case "MatchCounts":
      return `${MATCH_BASE_URL}/matchCollection/${selectedMatchCollection}/pGroup/${params.groupId}/matchCounts${matchQueryParameters}`;
    default:
      return null
  }
}

function shouldFetchData(state, dataType) {
  const data = state.APIData[dataType];
  if (!data.Fetched && !data.isFetching) {
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

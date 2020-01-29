const tileExists = function(tileId, tileData){
  let exists = false;
  //loop through all tiles in each layer to find tile
  tileData.some(function(layer) {
    if (tileId in layer.tileCoordinates) {
      exists = true;
    }
    return exists;
  });
  return exists;
};

/**
 * remove point matches of tiles that are not drawn
 *
 * @typedef {Object} CanvasMatches
 * @property {String} pGroupId
 * @property {String} pId
 * @property {String} qGroupId
 * @property {String} qId
 * @property {Number} matchCount
 */
const filterPointMatches = function(tileData){
  _.forEach(tileData, function(layer){
    _.remove(layer.pointMatches.matchCounts, function(match) {
      return (! tileExists(match.pId, tileData)) && (! tileExists(match.qId, tileData));
    })
  })
};

/**
 * Translates the tile coordinates using the calculated translation
 *
 * @typedef {Object} TileBounds
 * @property {String} tileId
 * @property {Number} minX
 * @property {Number} minY
 * @property {Number} maxX
 * @property {Number} maxY
 */
const getTranslatedTileCoordinates = function(z, tileBounds, translation){
  let tileCoordinates = {};
  _.forEach(tileBounds, function(tile){
    tile.minXtranslated = tile.minX - translation[0];
    tile.minYtranslated = tile.minY - translation[1];
    tile.maxXtranslated = tile.maxX - translation[0];
    tile.maxYtranslated = tile.maxY - translation[1];
    tile.tileZ = z;
    tileCoordinates[tile.tileId] = tile
  });
  return tileCoordinates
};

export const getTileData = function(APIData){

  const {MatchCounts, TileBounds, StackSubVolume} = APIData;
  const zToMatchList = MatchCounts.data.zToMatchList;
  const layerTileBoundsLists = TileBounds.data.zToTileBoundsList;
  const subVolume = StackSubVolume.data;

  let tileData = [];
  subVolume.orderedZValues.forEach(z => {
    let layerData = {};
    layerData.z = z;

    // calculates the center of the bounds of all of the sections combined
    const offsetX = subVolume.minX + (0.5 * (subVolume.maxX - subVolume.minX));
    const offsetY = subVolume.minY + (0.5 * (subVolume.maxY - subVolume.minY));
    const translation = [offsetX, offsetY];

    layerData.tileCoordinates = getTranslatedTileCoordinates(z, layerTileBoundsLists[z], translation);
    let pointMatches = {};
    if (zToMatchList && (z in zToMatchList)) {
      pointMatches.matchCounts = zToMatchList[z];
    } else {
      pointMatches.matchCounts = [];
    }
    layerData.pointMatches = pointMatches;
    tileData.push(layerData)
  });

  filterPointMatches(tileData);

  return tileData
};

/**
 * @typedef {Object} MatchCollection
 * @property {String} collectionId.owner
 * @property {String} collectionId.name
 * @property {Number} pairCount
 */
export const getUserInputSelectLists = function (APIData, UserInput){
  const {StackIds, MatchCollections, StackOwners, MatchOwners} = APIData;
  const {selectedProject} = UserInput;
  let projects = [];
  let stacks = [];
  let match_collections = [];
  let stack_owners = StackOwners.Fetched ? StackOwners.data : [];
  let match_owners = MatchOwners.Fetched ? MatchOwners.data : [];

  if(StackIds.Fetched){
    projects = _.uniq(_.map(StackIds.data, function(item){
      return item.project
    }));
    projects.sort();

    //only return stacks if the project has been selected
    if (selectedProject){
      //get the stackIds for the selected project
      stacks = _.filter(StackIds.data, function(item) {
        return item.project === selectedProject
      });
      //from the stackIds, only retrieve the stack name
      stacks = _.uniq(_.map(stacks, function(item){
        return item.stack
      }));
      stacks.sort()
    }
  }
  //get match collection names
  if (MatchCollections.Fetched){

    //get unique match collections
    match_collections = _.map(MatchCollections.data, function(collection){
      return collection.collectionId.name
    });
    match_collections.sort()
  }
  return {
    projects,
    stacks,
    match_collections,
    stack_owners,
    match_owners
  }

};

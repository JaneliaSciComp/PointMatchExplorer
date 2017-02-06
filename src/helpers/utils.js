//checks if tile exists, and if so, return the tile coordinate information
const getTileCoordinates = function(tileId, tileData){
  var tileCoordinates;
  //loop through all tiles in each layer to find tile
  _.forEach(tileData, function(layer){
    //since tileCoordinates is a dictionary, just check if tileId exists in the keys
    if (tileId in layer.tileCoordinates){
      tileCoordinates = layer.tileCoordinates[tileId];
    }
    if (tileCoordinates){
      return false;
    }
  });
  return tileCoordinates;
};

//returns list of sections corresponding to a z
export const getSectionsForZ = function(z, SectionData){
  let sections = [];
  _.forEach(SectionData, function(val){
    if (val.z == z){
      sections.push(val.sectionId)
    }
  })
  return sections
}

//remove point matches of tiles that are not drawn
const filterPointMatches = function(tileData){
  _.forEach(tileData, function(layer){
    _.remove(layer.pointMatches.matchesWithinGroup, function(match){
      return getTileCoordinates(match.pId, tileData) === undefined || getTileCoordinates(match.qId, tileData) === undefined;
    });
    _.remove(layer.pointMatches.matchesOutsideGroup, function(match){
      return getTileCoordinates(match.pId, tileData) === undefined || getTileCoordinates(match.qId, tileData) === undefined;
    });
  });
};

// returns (x,y) that indicates how much the X and Y should be translated to center all of the sections around (0,0)
const calculateTranslation = function(startZ, endZ, sectionBounds){
  let minX = Number.MAX_VALUE
  let minY = Number.MAX_VALUE
  let maxX = 0
  let maxY = 0
  for (var z = startZ; z <= endZ; z++){
    minX = Math.min(minX, sectionBounds[z]['minX'])
    minY = Math.min(minY, sectionBounds[z]['minY'])
    maxX = Math.max(maxX, sectionBounds[z]['maxX'])
    maxY = Math.max(maxY, sectionBounds[z]['maxY'])
  }
  // calculates the center of the bounds of all of the sections combined
  return [0.5*(minX+maxX), 0.5*(minY+maxY)]
}

//translates the tile coordinates using the calculated translation
const getTranslatedTileCoordinates = function(z, tileBounds, translation){
  let tileCoordinates = {}
  _.forEach(tileBounds, function(tile){
      tile.minXtranslated = tile.minX - translation[0]
      tile.minYtranslated = tile.minY - translation[1]
      tile.maxXtranslated = tile.maxX - translation[0]
      tile.maxYtranslated = tile.maxY - translation[1]
      tile.tileZ = z;
      tileCoordinates[tile.tileId] = tile;
  })
  return tileCoordinates
}

export const getTileData = function(APIData, UserInput){
  const {MatchesWithinGroup, MatchesOutsideGroup, SectionBounds, TileBounds} = APIData
  let tileData = []
  const {startZ, endZ} = UserInput
  for (var z = startZ; z <= endZ; z++){
    let layerData = {}
    layerData.z = parseFloat(z)
    layerData.tileCoordinates = getTranslatedTileCoordinates(z, TileBounds.data[z], calculateTranslation(startZ, endZ, SectionBounds.data))
    let pointMatches = {}
    pointMatches.matchesWithinGroup = MatchesWithinGroup.data[z]
    pointMatches.matchesOutsideGroup = MatchesOutsideGroup.data[z]
    layerData.pointMatches = pointMatches;
    tileData.push(layerData)
  }
  filterPointMatches(tileData)
  return tileData
}

export const getProjectStackMatchCollectionList = function (APIData, UserInput){
  const {StackIds, MatchCollections} = APIData
  const {selectedProject} = UserInput
  //get unique projects from stackIds
  if (StackIds && MatchCollections){
    let projects = _.uniq(_.map(StackIds.data, function(item){
      return item.project;
    }));
    projects.sort();
    let stacks = []
    //only return stacks if the project has been selected
    if (selectedProject){
      //get the stackIds for the selected project
      stacks = _.filter(StackIds.data, function(item) {
          return item.project == selectedProject;
      });
      //from the stackIds, only retrieve the stack name
      stacks = _.uniq(_.map(stacks, function(item){
          return item.stack;
      }));
      stacks.sort();
    }
    //get unique match collections
    let match_collections = _.map(MatchCollections.data, function(collection){
      return collection.collectionId.name;
    });
    match_collections.sort();
    return {
      projects,
      stacks,
      match_collections
    }
  }
}

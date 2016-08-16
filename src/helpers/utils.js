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

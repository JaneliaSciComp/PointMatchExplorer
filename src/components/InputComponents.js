import React from "react"

export const PMEInput = (props) => {

  const projectDisabled = (! props.selectedStackOwner) || (! props.projects);
  const stackDisabled = projectDisabled || (! props.selectedProject) || (! props.stacks);
  const zDisabled = stackDisabled || (! props.selectedStack) || (! props.stacks);
  const viewDisabled = zDisabled || (! props.selectedStartZ) || (! props.selectedEndZ);
  const matchCollectionDisabled = (! props.selectedMatchOwner) || (! props.match_collections);

  let selectedStackZRange = "";
  let selectedProjectDashboard = "";
  let selectedProjectDashboardUrl = "#";
  let selectedStackDetails = "";
  let selectedStackDetailsUrl = "#";
  let minZ = 1;
  let maxZ = Infinity;
  let totalTileCount = 0;
  if (props.selectedStackMetadata.Fetched) {
    const stackStats = props.selectedStackMetadata.data.stats;
    if (stackStats) {
      minZ = stackStats.stackBounds.minZ;
      maxZ = stackStats.stackBounds.maxZ;
      totalTileCount = stackStats.tileCount;
      selectedStackZRange = "(z: " + minZ.toLocaleString() + " to " + maxZ.toLocaleString() + ")";
      selectedProjectDashboard = "view project dashboard";
      selectedProjectDashboardUrl = props.stackDetailsViewUrl.replace("stack-details.html", "stacks.html");
      selectedStackDetails = "view stack details";
      selectedStackDetailsUrl = props.stackDetailsViewUrl;
    }
  }

  let selectedStackSubVolumeTileCount = "";
  if (props.selectedStackSubVolume.Fetched) {
    selectedStackSubVolumeTileCount = "(" + props.selectedStackSubVolume.data.tileCount.toLocaleString() + " out of " +
                                      totalTileCount.toLocaleString() + " tiles)";
  }

  let selectedMatchCountInfo = "";
  if (props.selectedMatchCounts.Fetched) {
    const matchCountsData = props.selectedMatchCounts.data;
    if (matchCountsData.totalPairCount > 0) {

      let missingCountInfo = "";
      if (matchCountsData.numberOfPairsWithMissingMatchCounts > 0) {
        let missingCount = matchCountsData.numberOfPairsWithMissingMatchCounts;
        if (matchCountsData.numberOfPairsWithMissingMatchCounts === matchCountsData.subVolumePairCount) {
          missingCount = "all"
        }
        missingCountInfo = ", " + missingCount + " with missing counts";
      }

      selectedMatchCountInfo = "(" + matchCountsData.subVolumePairCount.toLocaleString() + " out of " +
                               matchCountsData.totalPairCount.toLocaleString() + " pairs" + missingCountInfo + ")";
    }
  }

  return (

    <div id="PMEInput" className="formGrid">

      <label className={"dataGroupTitle"}>Render</label>
      <span className={"col2to6"}>&nbsp;</span>
      <button className={"col6"} onClick={handleHelpClick}>?</button>

      <label className={"indented"}>Owner:</label>
      <Dropdown
        dropdownName="Select Stack Owner"
        onChange={props.onStackOwnerSelect}
        values={props.stack_owners}
        value={props.selectedStackOwner}/>

      <label className={"indented"}>Project:</label>
      <Dropdown
        dropdownName="Select Project"
        onChange={props.onProjectSelect}
        values={ projectDisabled ? [] : props.projects}
        value={props.selectedProject}
        disabled={projectDisabled}/>

      <label>&nbsp;</label>
      <div className={"col2to6"}>
        <a href={selectedProjectDashboardUrl} target={"_blank"}>{selectedProjectDashboard}</a>
      </div>

      <label className={"indented"}>Stack:</label>
      <Dropdown
        dropdownName="Select Stack"
        onChange={props.onStackSelect}
        values={ stackDisabled ? [] : props.stacks}
        value={props.selectedStack}
        disabled={stackDisabled}/>

      <label>&nbsp;</label>
      <div className={"col2to6"}>
        <a href={selectedStackDetailsUrl} target={"_blank"}>{selectedStackDetails}</a>
        <span className={"indented stackInfo"}>{selectedStackZRange}</span>
      </div>

      <label className={"indented topTen"}>Z Range:</label>
      <div className={"col2to6 topTen"}>
        <input type="number" min={minZ} max={maxZ} step={0.1} onChange={e => props.onChangeStartZ(e.target.value)} value={props.selectedStartZ}  disabled={zDisabled}/>
        <span>&nbsp;to&nbsp;</span>
        <input type="number" min={minZ} max={maxZ} step={0.1} onChange={e => props.onChangeEndZ(e.target.value)} value={props.selectedEndZ}  disabled={zDisabled}/>
      </div>

      <label>&nbsp;</label>
      <div className={"col2to6"}>
        <span className={"stackInfo"}>{selectedStackSubVolumeTileCount}</span>
      </div>

      <label className={"dataGroupTitle topTen"}>Match</label>
      <span className={"col2to6"}>&nbsp;</span>
      <label className={"indented"}>Owner:</label>
      <Dropdown
        dropdownName="Select Match Owner"
        onChange={props.onMatchOwnerSelect}
        values={props.match_owners}
        value={props.selectedMatchOwner}/>

      <label className={"indented"}>Collection:</label>
      <Dropdown
        dropdownName="Select Match Collection"
        onChange={props.onMatchCollectionSelect}
        values={ matchCollectionDisabled ? [] : props.match_collections}
        value={props.selectedMatchCollection}
        disabled={matchCollectionDisabled}/>

      <label>&nbsp;</label>
      <div className={"col2to6"}>
        <span className={"stackInfo"}>{selectedMatchCountInfo}</span>
      </div>

      <label className={"topTen"}>&nbsp;</label>
      <button
        className={"col2to6 topTen"}
        onClick={e => props.onRenderClick(e.target.value)}
        disabled={viewDisabled}>Refresh View</button>

    </div>
  )
};

export const handleHelpClick = function() {
  let helpMessage = `
- Click Refresh View button to display sub-volume tiles and matches
- Hold down left mouse button and move to rotate
- Hold down right mouse button and move to pan
- Scroll to zoom
- Click on a tile to view information about it 
- Shift click tile to highlight all connections in the tile's layer
`;
  alert(helpMessage);
  return false
};

const Dropdown = (props) => {
  return (
    <select className={props.className} disabled={props.disabled} id={props.dropdownId} required onChange={e => props.onChange(e.target.value)} value={props.value}>
      <option value="" disabled>{props.dropdownName}</option>
      {
        props.values.map(value =>
          <option key={value}
            value={value}>{value}</option>)
      }
    </select>

  )
};

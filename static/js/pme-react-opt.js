var PMStrengthGradient = React.createClass({
  generateGradient : function(){
    var PMConnectionStrengthChromaScale = chroma.scale(this.props.colorList).domain([this.props.dmin, this.props.dmax])
    return PMConnectionStrengthChromaScale;
  },
  render: function(){
    return (
      <div className = "gradient">
        <PMStrengthGradientTitle gradientTitle={this.props.gradientTitle}/>
        <PMStrengthGradientBar gradient={this.generateGradient()} numSteps={this.props.numSteps} dmin={this.props.dmin} dmax={this.props.dmax}/>
        <PMStrengthGradientDomainLabels dmin={this.props.dmin} dmax={this.props.dmax}/>
      </div>
    );
  }
});

var PMStrengthGradientTitle = React.createClass({
  render: function(){
    return <span className="label"> {this.props.gradientTitle} </span>;
  }
});

var PMStrengthGradientBar = React.createClass({
  render: function(){
    var steps = [];
    var gradient = this.props.gradient;
    for (var i = 0; i < this.props.numSteps; i++){
      var bgColor = gradient(this.props.dmin + ((i/this.props.numSteps) * (this.props.dmax - this.props.dmin)))
      steps.push(<PMStrengthGradientStep key={i} stepColor={bgColor}/>)
    }
    return <div>{steps}</div>;
  }
});

var PMStrengthGradientStep = React.createClass({
  render: function(){
    var stepStyle = {
      backgroundColor: this.props.stepColor
    };
    return <span className="grad-step" style={stepStyle}></span>;
  }
});

var PMStrengthGradientDomainLabels = React.createClass({
  render: function(){
    var dmid = 0.5 * (this.props.dmin + this.props.dmax);
    return (
      <div>
        <span className="domain-min"> {this.props.dmin} </span>
        <span className="domain-med"> {dmid} </span>
        <span className="domain-max"> {this.props.dmax} </span>
      </div>
    );
  }
});

var MetadataInfo = React.createClass({
  render: function(){
    return <MetadataKVPairs kvpairs={this.props.kvpairs}/>
  }
});

var MetadataKVPairs = React.createClass({
  render: function(){
    var kvpairs = [];
    for (var i = 0; i < this.props.kvpairs.length; i++){
      kvpairs.push(<KVPair key={i} keyname={this.props.kvpairs[i].keyname} valuename={this.props.kvpairs[i].valuename}/>)
    }
    return <div>{kvpairs}</div>;
  }
});

var KVPair = React.createClass({
  render: function(){
    return <div> {this.props.keyname + ": " + this.props.valuename} </div>
  }
});

window.PMEReact = React.createClass({

  getInitialState: function() {
    return {
     'minWeight': null,
     'maxWeight': null,
     'mouseoverMetadata': null,
     'selectedMetadata': null,
     'isShiftDown': false
    };
  },

  render: function() {
    var canvas_node = <canvas ref="PMEcanvas"/>;
    var pm_connection_strength_gradient;
    var metadata_display;
    var selected_metadata_display;
    var mouseover_metadata_display;

    if (this.state.minWeight && this.state.maxWeight){
      pm_connection_strength_gradient = <PMStrengthGradient gradientTitle="Point Match Strength" colorList={pm_connection_strength_gradient_colors} numSteps={pm_connection_strength_gradient_steps} dmin={this.state.minWeight} dmax= {this.state.maxWeight} />;
    }
    if (this.state.selectedMetadata){
      selected_metadata_display = (<div><MetadataInfo id="selectedMetadata" kvpairs={this.state.selectedMetadata}/><br/></div>);
    }
    if (this.state.mouseoverMetadata){
      mouseover_metadata_display = <MetadataInfo id="mouseoverMetadata" kvpairs={this.state.mouseoverMetadata}/>;
    }
    metadata_display =
    (
      <div id="metaDataContainer">
        {selected_metadata_display}
        {mouseover_metadata_display}
      </div>
    );
    return <div>{pm_connection_strength_gradient}{metadata_display}{canvas_node}</div>;
  },

  componentDidMount: function() {
    var canvas = this.refs.PMEcanvas;
    canvas.addEventListener('resize', function(){
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }, false);
    canvas.addEventListener('mousemove', this.processMouseMove, false);
    canvas.addEventListener('mousedown', this.processMouseDown, false);
    canvas.addEventListener('mouseup', this.processMouseUp, false);
    document.addEventListener('keydown', this.detectShiftDown, false);
    document.addEventListener('keyup', this.detectShiftUp, false);
    var updatedStateValues = generateVisualization(this.refs.PMEcanvas, this.props.tileData);
    this.setState(updatedStateValues);
  },

  processMouseMove: function(event){
    var md = onMouseMove(event);
    this.setState({mouseoverMetadata: md});
  },

  processMouseDown: function(event){
    onMouseDown(event);
  },

  processMouseUp: function(event){
    var md = onMouseUp(event, this.state.isShiftDown);
    this.setState({selectedMetadata: md});
  },

  detectShiftDown: function(event){
    switch(event.keyCode) {
      case 16: this.setState({isShiftDown: true}); break;
    }
  },

  detectShiftUp: function(event){
    switch(event.keyCode) {
      case 16: this.setState({isShiftDown: false}); break;
    }
  }

});

//TODO make div that shows loading information
//TODO make template inheritance
var camera, scene, renderer, controls;
var intersected, selected;

var mouse, raycaster;
var downobj, upobj;
var downmouseX, upmouseX, downmouseY, upmouseY;

var size_scale = 0.05;
var position_scale = 0.1;

//distance between each layer
var z_spacing = 700;
var z_offset;

//number of units to shorten both sides of the intra-layer point match lines by
var line_shorten_factor = 45;
//used for the camera. anything beyond this distance will not be drawn.
var draw_distance = 1000000;
//tiles are grouped into THREE.Group objects by layer
//TODO what is the benefit of grouping together each layer?
var all_tile_groups = [];
//all point match lines are grouped into point_match_line_group
var point_match_line_group, tile_border_group;

//max and min strength of pm connections
var maxWeight, minWeight;

var pm_connection_strength_gradient_colors = ['#c33f2e', '#fc9d59', '#fee08b', '#e0f381', '#76c76f', '#3288bd'];
//how many steps to generate the gradient in
var pm_connection_strength_gradient_steps = 20;
var pm_connection_strength_chroma_scale;
var tile_gradient_colors = ['#fc00ff', '#00dbde'];
var tile_gradient_chroma_scale;

var line_color = 0xaaaaaa;
var line_width = 0.5;
var line_highlight_width = 4;

var tile_opacity = 0.5;
var tile_highlight_opacity = 0.9;

var tile_border_color = 0x4B4E4F;
var tile_border_width = 2;

var background_color = 0xffffff;

var camera_view_angle = 50;
var initial_camera_X = 0;
var initial_camera_Y = 0;
var initial_camera_Z = 10000;

var control_rotate_speed = 2;
var control_zoom_speed = 0.5;
var control_min_distance = 0;
var control_max_distance = 5000000;

var generateVisualization = function(canvas, tileData){
  scene = new THREE.Scene();
  mouse = new THREE.Vector2();
  raycaster = new THREE.Raycaster();
  point_match_line_group = new THREE.Group();
  tile_border_group = new THREE.Group();

  //TODO set maxZ dynamically using bounding box
  camera = new THREE.PerspectiveCamera(camera_view_angle, window.innerWidth / window.innerHeight, 1, draw_distance);
  camera.position.set(initial_camera_X, initial_camera_Y, initial_camera_Z);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
  renderer.setClearColor(background_color);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  controls = new THREE.TrackballControls(camera, renderer.domElement);
  controls.rotateSpeed = control_rotate_speed;
  controls.zoomSpeed = control_zoom_speed;
  controls.minDistance = control_min_distance;
  controls.maxDistance = control_max_distance;
  controls.addEventListener('change', renderPME);

  //adjusts Z so that the beginning offset is negative in order to center tiles with respect to (0,0,0)
  z_offset = 0.5 * tileData.length * z_spacing;
  //get a list of colors representing the interpolated gradient for tiles and connection strength
  tile_gradient_chroma_scale = chroma.scale(tile_gradient_colors).colors(tileData.length);

  var start = new Date().getTime();
  filterPointMatches(tileData);
  var weightRange = calculateWeightRange(tileData);
  pm_connection_strength_chroma_scale = chroma.scale(pm_connection_strength_gradient_colors).domain([minWeight, maxWeight]);

  start = new Date().getTime();
  console.log("started rendering");
  drawTiles(tileData);
  drawPMLines(tileData);
  console.log("Render time: " + (new Date().getTime() - start)/1000);
  console.log("number of tiles: ", tile_border_group.children.length);
  animate();

  return {
    minWeight: weightRange.minWeight,
    maxWeight: weightRange.maxWeight
  };
};

//remove point matches of tiles that are not drawn
var filterPointMatches = function(tileData){
  _.forEach(tileData, function(layer){
    _.remove(layer.pointMatches.matchesWithinGroup, function(match){
      return getTileCoordinates(match.pId, tileData) == undefined || getTileCoordinates(match.qId, tileData) == undefined;
    });
    _.remove(layer.pointMatches.matchesOutsideGroup, function(match){
      return getTileCoordinates(match.pId, tileData) == undefined || getTileCoordinates(match.qId, tileData) == undefined;
    });
  });
};

//checks if tile exists, and if so, return the tile coordinate information
var getTileCoordinates = function(tileId, tileData){
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

//calculate max and min connection strength based on number of point matches
//for use in selecting the color indicating the strength
var calculateWeightRange = function(tileData){
  maxWeight = 0;
  minWeight = Number.MAX_VALUE;
  _.forEach(tileData, function(layer){
    _.forEach(layer.pointMatches.matchesWithinGroup, function(m){
        maxWeight = Math.max(maxWeight, m.matches.w.length);
        minWeight = Math.min(minWeight, m.matches.w.length);
    });
    _.forEach(layer.pointMatches.matchesOutsideGroup, function(m){
        maxWeight = Math.max(maxWeight, m.matches.w.length);
        minWeight = Math.min(minWeight, m.matches.w.length);
    });
  });
  return {minWeight: minWeight, maxWeight: maxWeight};
};

var drawTiles = function(tileData){
  var merged_tile_geometry = new THREE.Geometry();
	var merged_tile_material = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: tile_opacity,
    side: THREE.DoubleSide,
    vertexColors: THREE.FaceColors,
    depthWrite: false
  });

  _.forEach(tileData, function(layer, index){
    var layer_color = tile_gradient_chroma_scale[index];
    var tile_group = new THREE.Group();
    tile_group.userData.zLayer = layer.z;

    _.forEach(layer.tileCoordinates, function(c){
      //adding data needed to draw the tile
      c.width = size_scale * (c.maxX - c.minX);
      c.height = size_scale * (c.maxY - c.minY);
      c.color = layer_color;
      //minX and minY are scaled down to produce actual coordinates in three.js
      c.xPos = position_scale * c.minX;
      c.yPos = position_scale * c.minY;
      c.zPos = z_offset;

      //creating geometries and drawing the tile
      //the merged tiles are what are drawn on the canvas
      var tile_geometry = new THREE.PlaneGeometry(c.width, c.height);
      for (var i = 0; i < tile_geometry.faces.length; i++) {
					tile_geometry.faces[i].color = new THREE.Color(c.color);
			}
      var tile_mesh = new THREE.Mesh(tile_geometry);
      tile_mesh.position.set(c.xPos, c.yPos, c.zPos);
      tile_mesh.updateMatrix();
      merged_tile_geometry.merge(tile_mesh.geometry, tile_mesh.matrix);

      //these tiles are created in order to use raycasting and tile borders
      //they are NOT drawn on the canvas!!!
      //creating individual geometries and meshes for each tile
      var tile_geometry_individual = new THREE.PlaneGeometry(c.width, c.height);
      //each tile has its own material, where its color is set
      var tile_material_individual = new THREE.MeshBasicMaterial({
        color: c.color,
        transparent: true,
        opacity: tile_opacity,
        side: THREE.DoubleSide,
        shading: THREE.SmoothShading,
        vertexColors: THREE.FaceColors,
        visible: false //these tiles are not drawn on the canvas!!
      });
      var tile_mesh_individual = new THREE.Mesh(tile_geometry_individual, tile_material_individual);
      tile_mesh_individual.position.set(c.xPos, c.yPos, c.zPos);
      tile_mesh_individual.updateMatrix();
      tile_mesh_individual.userData.tileId = c.tileId;
      tile_mesh_individual.userData.color = c.color;
      tile_group.add(tile_mesh_individual);
      c.mesh = tile_mesh_individual;
      //adds an invisible border to the tile. the opacity will be adjusted to show the border when the tile is highlighted
      var tile_border = new THREE.EdgesHelper(tile_mesh_individual, tile_border_color);
      tile_border.material.linewidth = tile_border_width;
      tile_border.material.visible = false;
      tile_mesh_individual.tileBorder = tile_border;
      tile_border_group.add(tile_border);
    });
    z_offset = z_offset - z_spacing;
    all_tile_groups.push(tile_group);
    //tile_group is NOT drawn on the canvas!! it needs to be added to the scene in order to use raycasting
    scene.add(tile_group);
  });

  //parent_tile_mesh is what is drawn on the canvas (improves performance)
  var parent_tile_mesh = new THREE.Mesh(merged_tile_geometry, merged_tile_material);
  scene.add(parent_tile_mesh);
  scene.add(tile_border_group);
};

var drawPMLines = function(tileData){
  var merged_line_geometry = new THREE.Geometry();
  var merged_line_material = new THREE.LineBasicMaterial({
    color: line_color,
    linewidth: line_width
  });

  //create intralayer lines
  _.forEach(tileData, function(layer){
    _.forEach(layer.pointMatches.matchesWithinGroup, function(m){
      m.pTile = getTileCoordinates(m.pId, tileData);
      m.qTile = getTileCoordinates(m.qId, tileData);
      //calculates new coordinates to draw the intra-layer lines so that they do not begin and start in the middle of the tile
      var xlen = m.qTile.xPos - m.pTile.xPos;
      var ylen = m.qTile.yPos - m.pTile.yPos;
      var hlen = Math.sqrt(Math.pow(xlen,2) + Math.pow(ylen,2));
      var ratio = line_shorten_factor / hlen;
      var smallerXLen = xlen * ratio;
      var smallerYLen = ylen * ratio;

      var line_geometry = new THREE.Geometry();
      //TODO this will eventually be customized once point matches are separated into different categories
      var line_material = new THREE.LineBasicMaterial({
        color: line_color,
        linewidth: line_width,
        visible: false
      });
      line_geometry.vertices.push(
        new THREE.Vector3(m.pTile.xPos + smallerXLen, m.pTile.yPos + smallerYLen, m.pTile.zPos),
        new THREE.Vector3(m.qTile.xPos - smallerXLen, m.qTile.yPos - smallerYLen, m.qTile.zPos)
      );
      merged_line_geometry.vertices.push(
        new THREE.Vector3(m.pTile.xPos + smallerXLen, m.pTile.yPos + smallerYLen, m.pTile.zPos),
        new THREE.Vector3(m.qTile.xPos - smallerXLen, m.qTile.yPos - smallerYLen, m.qTile.zPos)
      );
      var line = new THREE.Line(line_geometry, line_material);
      m.mesh = line;
      line.userData.connectionStrength = m.matches.w.length;
      line.userData.strength_color = pm_connection_strength_chroma_scale(line.userData.connectionStrength);
      point_match_line_group.add(line);
      addPointMatchLineUUIDsToTiles(line.uuid, m.pTile);
      addPointMatchLineUUIDsToTiles(line.uuid, m.qTile);
    });
  });

  //create interlayer lines
  _.forEach(removeDuplicatePMs(tileData), function(m){
    m.pTile = getTileCoordinates(m.pId, tileData);
    m.qTile = getTileCoordinates(m.qId, tileData);
    var line_geometry = new THREE.Geometry();
    //TODO this will eventually be customized once point matches are separated into different categories
    var line_material = new THREE.LineBasicMaterial({
      color: line_color,
      linewidth: line_width,
      visible: false
    });
    line_geometry.vertices.push(
      new THREE.Vector3(m.pTile.xPos, m.pTile.yPos, m.pTile.zPos),
      new THREE.Vector3(m.qTile.xPos, m.qTile.yPos, m.qTile.zPos)
    );
    merged_line_geometry.vertices.push(
      new THREE.Vector3(m.pTile.xPos, m.pTile.yPos, m.pTile.zPos),
      new THREE.Vector3(m.qTile.xPos, m.qTile.yPos, m.qTile.zPos)
    );
    var line = new THREE.Line(line_geometry, line_material);
    m.mesh = line;
    line.userData.connectionStrength = m.matches.w.length;
    line.userData.strength_color = pm_connection_strength_chroma_scale(line.userData.connectionStrength);
    point_match_line_group.add(line);
    addPointMatchLineUUIDsToTiles(line.uuid, m.pTile);
    addPointMatchLineUUIDsToTiles(line.uuid, m.qTile);
  });

  //merged_line is what is drawn on the canvas (improves performance)
  var merged_line = new THREE.LineSegments(merged_line_geometry, merged_line_material);
  scene.add(merged_line);
  //point_match_line_group contains the individual PM lines
  scene.add(point_match_line_group);
};

//adds the UUID of the point match line to the tile of the point match (so they can be highlighted later)
var addPointMatchLineUUIDsToTiles = function(lineUUID, tile){
  //create empty array if the list does not yet exist
  if (!tile.mesh.userData.point_match_line_UUIDs){
    tile.mesh.userData.point_match_line_UUIDs = [];
  }
  tile.mesh.userData.point_match_line_UUIDs.push(lineUUID);
};

//removes duplicate inter-layer point_matches
var removeDuplicatePMs = function(tileData){
  //gets the matchesOutsideGroup for all layers
  var allMatchesOutsideGroup = _.map(tileData, function(l){
    return l.pointMatches.matchesOutsideGroup;
  });
  //combines the matchesOutsideGroup into one array
  var combinedMatchesOutsideGroup = _.concat.apply(_, allMatchesOutsideGroup);
  //get unique matches by using the pId and qId as the iteree for uniqueness
  var uniqueMatchesOutsideGroup = _.uniqBy(combinedMatchesOutsideGroup, function(m){
    return [m.pId, m.qId].join();
  });
  return uniqueMatchesOutsideGroup;
};

var renderPME = function(){
  renderer.render(scene, camera);
};

var animate = function(){
  requestAnimationFrame(animate);
  renderPME();
  controls.update();
};

var getRaycastIntersections = function(){
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects(all_tile_groups, true);
};

var onMouseMove = function(event) {
  var metadataValues;
  event.preventDefault();
  var intersections = getRaycastIntersections();
  if (intersections.length > 0) {
    var intersectedObject = intersected ? intersected.object : null;
    //only highlight if the mouse moved to a different tile
    //(if the mouse is moved around in the same tile, don't do anything)
    if (intersectedObject != intersections[0].object) {
      if (intersected){ //dehighlight previous intersection
        dehighlight(intersected);
      }
      intersected = intersections[0];
      highlight(intersected);
    }
    //get updated metadata text
    metadataValues = getMouseoverMetadata(intersected);
  }else if (intersected){ //there are no current intersections, but there was a previous intersection
    dehighlight(intersected);
    intersected = null;
  }

  //TODO such a hack. hopefully this doesn't slow things down
  if (selected){
    highlight(selected);
  }

  return metadataValues;
};

var onMouseDown = function(event){
  event.preventDefault();
  var intersections = getRaycastIntersections();
  if (intersections.length > 0) {
    downobj = intersections[0];
  }else{
    //save the position of mousedown
    downmouseX = mouse.x;
    downmouseY = mouse.y;
  }
};

var onMouseUp = function(event, isShiftDown) {
  var metadataValues;
  event.preventDefault();
  var intersections = getRaycastIntersections();
  if (intersections.length > 0) {
    upobj = intersections[0];
  }else{
    //save position of the mouseup
    upmouseX = mouse.x;
    upmouseY = mouse.y;
  }
  if (downobj && upobj){
    //if the mouse was clicked on the same tile
    if (downobj.object == upobj.object){
      //dehighlight already selected tile
      if (selected){
        dehighlight(selected);
      }
      if (isShiftDown){
        //the entire layer will be selected.
        selected = upobj.object.parent;
      }else{
        //only a tile is selected
        selected = upobj;
      }
      //highlight new selected tile
      //can also be downobj since they are the same
      highlight(selected);
      metadataValues = getSelectedMetadata(selected);
    }
  }
  if (!downobj && !upobj){ //if the mouse is clicked outside
    //only dehighlight selected tile if mouse was clicked, not when it is dragged for panning
    if(downmouseX == upmouseX && downmouseY == upmouseY){
      if (selected){
        dehighlight(selected);
        selected = null;
      }
    }else if (selected){
      //do not remove metadata display if the mouse was not clicked
      metadataValues = getSelectedMetadata(selected);
    }
  }
  downobj = null;
  upobj = null;
  return metadataValues;
};

var highlight = function(intersected){
  //if an entire layer is selected, highlight all tiles and their connections of that layer
  if (intersected instanceof THREE.Group){
    _.forEach(intersected.children, function(t){
      t.material.opacity = tile_highlight_opacity;
      t.material.visible = true;
      if (t.tileBorder) t.tileBorder.material.visible = true;
    });
  }else{
    //increase opacity of tile
    intersected.object.material.opacity = tile_highlight_opacity;
    intersected.object.material.visible = true;
    //show tile border
    if (intersected.object.tileBorder) intersected.object.tileBorder.material.visible = true;
  }
  //increase width and change color of all of the tile's point match lines
  highlightLines(intersected, line_highlight_width);
};

var dehighlight = function(intersected){
  //if an entire layer is selected, dehighlight all tiles and their connections of that layer
  if (intersected instanceof THREE.Group){
    _.forEach(intersected.children, function(t){
      t.material.opacity = tile_opacity;
      t.material.visible = false;
      if (t.tileBorder) t.tileBorder.material.visible = false;
    });
  }else{
    //revert opacity of tile
    intersected.object.material.opacity = tile_opacity;
    intersected.object.material.visible = false;
    //hide tile border
    if (intersected.object.tileBorder) intersected.object.tileBorder.material.visible = false;
  }
  //revert style of the tile's point match lines
  highlightLines(intersected, line_width, true);
};

//highlights and unhighlights the point match lines of the moused over tile
var highlightLines = function(intersected, linewidth, dehighlight){
  if (intersected instanceof THREE.Group){
    _.forEach(intersected.children, function(t){
      _.forEach(t.userData.point_match_line_UUIDs, function(u){
        var pm_line = _.find(point_match_line_group.children, function(c){
          return c.uuid == u;
        });
        pm_line.material.linewidth = linewidth;
        if (dehighlight){
          pm_line.material.color.set(line_color);
          pm_line.material.visible = false;
        }else{
          pm_line.material.color.set(pm_line.userData.strength_color.hex());
          pm_line.material.visible = true;
        }
      });
    });
  }else{
    _.forEach(intersected.object.userData.point_match_line_UUIDs, function(u){
      var pm_line = _.find(point_match_line_group.children, function(c){
        return c.uuid == u;
      });
      pm_line.material.linewidth = linewidth;
      if (dehighlight){
        pm_line.material.color.set(line_color);
        pm_line.material.visible = false;
      }else{
        pm_line.material.color.set(pm_line.userData.strength_color.hex());
        pm_line.material.visible = true;
      }
    });
  }
};

var getMouseoverMetadata = function(tile){
  var md = [
    {
      keyname: "Tile Z",
      valuename: tile.object.parent.userData.zLayer
    },
    {
      keyname: "Tile ID",
      valuename: tile.object.userData.tileId
    },
    {
      keyname: "Number of tiles with point matches",
      valuename: tile.object.userData.point_match_line_UUIDs.length
    }
  ];
  return md;
};

var getSelectedMetadata = function(selected){
  var md;
  //check if a tile or a layer was selected
  if (selected instanceof THREE.Group){
      var pointMatchSetsCount = 0;
      _.forEach(selected.children, function(c){
        pointMatchSetsCount += c.userData.point_match_line_UUIDs.length;
      });
      md = [
        {
          keyname: "Selected Z",
          valuename: selected.userData.zLayer
        },
        {
          keyname: "Tile Count",
          valuename: selected.children.length
        },
        {
          keyname: "Number of point match sets",
          valuename: pointMatchSetsCount
        }
      ];
  }else{
    md = [
      {
        keyname: "Selected Tile Z",
        valuename: selected.object.parent.userData.zLayer
      },
      {
        keyname: "Selected Tile ID",
        valuename: selected.object.userData.tileId
      },
      {
        keyname: "Number of tiles with point matches",
        valuename: selected.object.userData.point_match_line_UUIDs.length
      }
    ];
  }
  return md;
};

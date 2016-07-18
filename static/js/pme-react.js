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

  var weightRange = calculateWeightRange(tileData);
  pm_connection_strength_chroma_scale = chroma.scale(pm_connection_strength_gradient_colors).domain([minWeight, maxWeight]);

  var start = new Date().getTime();
  drawComponents(tileData);
  var end = new Date().getTime();
  var time = end - start;
  console.log('Execution time: ' + time/1000);
  animate();

  return {
    minWeight: weightRange.minWeight,
    maxWeight: weightRange.maxWeight
  };
};

var renderPME = function(){
  renderer.render(scene, camera);
};

var animate = function(){
  requestAnimationFrame(animate);
  renderPME();
  controls.update();
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
        }else{
          pm_line.material.color.set(pm_line.userData.strength_color.hex());
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
      }else{
        pm_line.material.color.set(pm_line.userData.strength_color.hex());
      }
    });
  }
};

var dehighlight = function(intersected){
  //if an entire layer is selected, dehighlight all tiles and their connections of that layer
  if (intersected instanceof THREE.Group){
    _.forEach(intersected.children, function(t){
      t.material.opacity = tile_opacity;
      if (t.tileBorder) t.tileBorder.material.visible = false;
    });
  }else{
    //revert opacity of tile
    intersected.object.material.opacity = tile_opacity;
    //hide tile border
    if (intersected.object.tileBorder) intersected.object.tileBorder.material.visible = false;
  }
  //revert style of the tile's point match lines
  highlightLines(intersected, line_width, true);
};

var highlight = function(intersected){
  //if an entire layer is selected, highlight all tiles and their connections of that layer
  if (intersected instanceof THREE.Group){
    _.forEach(intersected.children, function(t){
      t.material.opacity = tile_highlight_opacity;
      if (t.tileBorder) t.tileBorder.material.visible = true;
    });
  }else{
    //increase opacity of tile
    intersected.object.material.opacity = tile_highlight_opacity;
    //show tile border
    if (intersected.object.tileBorder) intersected.object.tileBorder.material.visible = true;
  }
  //increase width and change color of all of the tile's point match lines
  highlightLines(intersected, line_highlight_width);
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

//adds the UUID of the point match line to the appropriate tile (so they can be highlighted later)
var addPointMatchLineUUIDsToTiles = function(lineUUID, tileId){
  //find the tile object3D
  var p_tile;
  _.forEach(all_tile_groups, function(g){
    p_tile = _.find(g.children, function(c){
      return c.userData.tileId == tileId;
    });
    if (p_tile){ //the tile was found
      return false;
    }
  });
  //create empty array if the list does not yet exist
  if (!p_tile.userData.point_match_line_UUIDs){
    p_tile.userData.point_match_line_UUIDs = [];
  }
  p_tile.userData.point_match_line_UUIDs.push(lineUUID);
};

//removes duplicate inter-layer point_matches. will eventually be used in a bigger function that processes point matches
var removeDuplicatePMs = function(tileData){
  //combine all interlayer matches so there are no duplicates
  var all_interlayer_point_matches = [];
  _.forEach(tileData, function(layer){
    _.forEach(layer.pointMatches.matchesOutsideGroup, function(m){
      var alreadyFound = _.find(all_interlayer_point_matches, function (m2){
        return m2.pId == m.pId && m2.qId == m.qId;
      });
      if (!alreadyFound){
        all_interlayer_point_matches.push(m);
      }
    });
  });
  return all_interlayer_point_matches;
};

var getTileCoordinates = function(tileId, tileData){
  var tileCoordinates;
  //loop through all tiles in each layer to find tile with tileId = tileId
  _.forEach(tileData, function(layer){
     tileCoordinates = _.find(layer.tileCoordinates, function (t){
      return t.tileId == tileId;
    });
    //tile was found
    if (tileCoordinates){
      return false;
    }
  });
  return tileCoordinates;
};

var drawComponents = function(tileData){
  //draw tiles
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
			var tile_geometry = new THREE.PlaneGeometry(c.width, c.height);
      //each tile has its own material, where its color is set
      var tile_material = new THREE.MeshBasicMaterial({
    		color: c.color,
    		transparent: true,
    		opacity: tile_opacity,
    		side: THREE.DoubleSide,
    		shading: THREE.SmoothShading,
    		vertexColors: THREE.FaceColors
    	});
			var tile_mesh = new THREE.Mesh(tile_geometry, tile_material);
			tile_mesh.position.set(c.xPos, c.yPos, c.zPos);
			tile_mesh.updateMatrix();
      tile_mesh.userData.tileId = c.tileId;
      tile_mesh.userData.color = c.color;
      tile_group.add(tile_mesh);

      //adds an invisible border to the tile. the opacity will be adjusted to show the border when the tile is highlighted
      var tile_border = new THREE.EdgesHelper(tile_mesh, tile_border_color);
      tile_border.material.linewidth = tile_border_width;
      tile_border.material.visible = false;
      tile_mesh.tileBorder = tile_border;
      tile_border_group.add(tile_border);
		});
		z_offset = z_offset - z_spacing;
    all_tile_groups.push(tile_group);
    scene.add(tile_group);
	});

  scene.add(tile_border_group);

  //draw intralayer lines
	_.forEach(tileData, function(layer){
		_.forEach(layer.pointMatches.matchesWithinGroup, function(m){
			var pTileCoordinates = getTileCoordinates(m.pId, tileData);
			var qTileCoordinates = getTileCoordinates(m.qId, tileData);
			if (pTileCoordinates && qTileCoordinates){
        //calculates new coordinates to draw the intra-layer lines so that they do not begin and start in the middle of the tile
        var xlen = qTileCoordinates.xPos - pTileCoordinates.xPos;
        var ylen = qTileCoordinates.yPos - pTileCoordinates.yPos;
        var hlen = Math.sqrt(Math.pow(xlen,2) + Math.pow(ylen,2));
        var ratio = line_shorten_factor / hlen;
        var smallerXLen = xlen * ratio;
        var smallerYLen = ylen * ratio;

        var line_geometry = new THREE.Geometry();
        //TODO this will eventually be customized once point matches are separated into different categories
        var line_material = new THREE.LineBasicMaterial({
          color: line_color,
          linewidth: line_width
        });
        var line = new THREE.Line(line_geometry, line_material);
				line_geometry.vertices.push(
					new THREE.Vector3(pTileCoordinates.xPos + smallerXLen, pTileCoordinates.yPos + smallerYLen, pTileCoordinates.zPos),
					new THREE.Vector3(qTileCoordinates.xPos - smallerXLen, qTileCoordinates.yPos - smallerYLen, qTileCoordinates.zPos)
				);
        line.userData.connectionStrength = m.matches.w.length;
        line.userData.strength_color = pm_connection_strength_chroma_scale(line.userData.connectionStrength);
        point_match_line_group.add(line);
        addPointMatchLineUUIDsToTiles(line.uuid, m.pId);
        addPointMatchLineUUIDsToTiles(line.uuid, m.qId);
			}
		});
	});

  //draw interlayer lines
  _.forEach(removeDuplicatePMs(tileData), function(m){
    var pTileCoordinates = getTileCoordinates(m.pId, tileData);
    var qTileCoordinates = getTileCoordinates(m.qId, tileData);
    if (pTileCoordinates && qTileCoordinates){
      var line_geometry = new THREE.Geometry();
      //TODO this will eventually be customized once point matches are separated into different categories
      var line_material = new THREE.LineBasicMaterial({
        color: line_color,
        linewidth: line_width
      });
      var line = new THREE.Line(line_geometry, line_material);

      line_geometry.vertices.push(
        new THREE.Vector3(pTileCoordinates.xPos, pTileCoordinates.yPos, pTileCoordinates.zPos),
        new THREE.Vector3(qTileCoordinates.xPos, qTileCoordinates.yPos, qTileCoordinates.zPos)
    );
      line.userData.connectionStrength = m.matches.w.length;
      line.userData.strength_color = pm_connection_strength_chroma_scale(line.userData.connectionStrength);
      point_match_line_group.add(line);
      addPointMatchLineUUIDsToTiles(line.uuid, m.pId);
      addPointMatchLineUUIDsToTiles(line.uuid, m.qId);
    }
  });

  scene.add(point_match_line_group);
  console.log("number of tiles: ", tile_border_group.children.length);
};

var calculateWeightRange = function(tileData){
  //calculate max and min connection strength based on number of point matches
  //for use in selecting the color indicating the strength
  maxWeight = 0;
  minWeight = Number.MAX_VALUE;
  _.forEach(tileData, function(layer){
    _.forEach(layer.pointMatches.matchesWithinGroup, function(m){
      var pTileCoordinates = getTileCoordinates(m.pId, tileData);
      var qTileCoordinates = getTileCoordinates(m.qId, tileData);
      if (pTileCoordinates && qTileCoordinates){
        maxWeight = Math.max(maxWeight, m.matches.w.length);
        minWeight = Math.min(minWeight, m.matches.w.length);
      }
    });
    _.forEach(layer.pointMatches.matchesOutsideGroup, function(m){
      var pTileCoordinates = getTileCoordinates(m.pId, tileData);
      var qTileCoordinates = getTileCoordinates(m.qId, tileData);
      if (pTileCoordinates && qTileCoordinates){
        maxWeight = Math.max(maxWeight, m.matches.w.length);
        minWeight = Math.min(minWeight, m.matches.w.length);
      }
    });
  });
  return {minWeight: minWeight, maxWeight: maxWeight};
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

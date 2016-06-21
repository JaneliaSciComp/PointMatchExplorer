function loadPME(){
  //TODO make div that shows loading information
  //TODO make template inheritance
  var container, controls, metadata_container, selected_tile_metadata_container;
  var camera, scene, renderer;

  var mouse = new THREE.Vector2();
  var raycaster = new THREE.Raycaster();
  var intersected, selected;
  var downobj, upobj;
  var downmouseX, upmouseX, downmouseY, upmouseY;

  var size_scale = 0.05;
  var position_scale = 0.1;

  //distance between each layer
  var z_spacing = 700;
  //adjusts Z so that the beginning offset is negative in order to center tiles with respect to (0,0,0)
  var z_offset = -0.5 * tileData.length * z_spacing;

  //number of units to shorten both sides of the intra-layer point match lines by
  var line_shorten_factor = 45;
  //used for the camera. anything beyond this distance will not be drawn.
  var draw_distance = 1000000;
  //tiles are grouped into THREE.Group objects by layer
  //TODO what is the benefit of grouping together each layer?
  var all_tile_groups = [];
  //all point match lines are grouped into point_match_line_group
  var point_match_line_group = new THREE.Group();
  var tile_border_group = new THREE.Group();

  //get a list of colors representing the interpolated gradient
  var gradient_hex_values = chroma.scale(['#fc00ff', '#00dbde']).colors(tileData.length);

  var line_color = 0xaaaaaa;
  var line_width = 0.5;
  var line_highlight_color = 0x0000ff;
  var line_highlight_width = 3;

  var tile_opacity = 0.5;
  var tile_highlight_opacity = 0.9;

  var tile_border_color = 0x4B4E4F;
  var tile_border_width = 2;

  init();
  animate();

  function init() {
    container = document.getElementById( 'container' );
    metadata_container = document.getElementById( 'metadata' );
    selected_tile_metadata_container = document.getElementById( 'selected_tile_metadata' );
    //TODO issue: rendering a lot of tiles (over 1000) then changing the Zs causes slowness even when there are less tiles in the second query
    //clear old rendering if a new start and end Z are entered
    $('#container').empty();
    metadata_container.innerHTML = "";
    selected_tile_metadata_container.innerHTML = "";
  	scene = new THREE.Scene();

  	//TODO set maxZ dynamically using bounding box
  	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, draw_distance );
  	camera.position.set( 0, 0, 10000 );
  	scene.add( camera );

  	var light = new THREE.PointLight( 0xffffff, 0.8 );
  	camera.add( light );

  	renderer = new THREE.WebGLRenderer( { antialias: true } );
  	renderer.setClearColor( 0xf0f0f0 );
  	renderer.setPixelRatio( window.devicePixelRatio );
  	renderer.setSize( window.innerWidth, window.innerHeight );
  	container.appendChild( renderer.domElement );

  	controls = new THREE.TrackballControls( camera, renderer.domElement );
  	controls.rotateSpeed = 2;
  	controls.zoomSpeed = 0.5;
  	controls.minDistance = 0;
  	controls.maxDistance = 5000000;
  	controls.addEventListener( 'change', render );

  	window.addEventListener( 'resize', function(){
      camera.aspect = window.innerWidth / window.innerHeight;
    	camera.updateProjectionMatrix();
    	renderer.setSize( window.innerWidth, window.innerHeight );
    }, false );
    renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, false );
    renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, false );
    renderer.domElement.addEventListener( 'mouseup', onDocumentMouseUp, false );

  	renderPME();
  }

  function renderPME(){
    //draw tiles
  	_.forEach(tileData, function(layer, index){
  		var layer_color = gradient_hex_values[index];
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
        var tile_border = new THREE.EdgesHelper( tile_mesh, tile_border_color );
        tile_border.material.linewidth = tile_border_width;
        tile_border.material.visible = false;
        tile_mesh.tileBorder = tile_border;
        tile_border_group.add(tile_border);
  		});
  		z_offset = z_offset + z_spacing;
      all_tile_groups.push(tile_group);
      scene.add(tile_group);
  	});

    scene.add(tile_border_group);

    //draw intralayer lines
  	_.forEach(tileData, function(layer){
  		_.forEach(layer.pointMatches.matchesWithinGroup, function(m){
  			var pTileCoordinates = getTileCoordinates(m.pGroupId, m.pId);
  			var qTileCoordinates = getTileCoordinates(m.qGroupId, m.qId);
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
          var line = new THREE.Line( line_geometry, line_material );
  				line_geometry.vertices.push(
  					new THREE.Vector3( pTileCoordinates.xPos + smallerXLen, pTileCoordinates.yPos + smallerYLen, pTileCoordinates.zPos ),
  					new THREE.Vector3( qTileCoordinates.xPos - smallerXLen, qTileCoordinates.yPos - smallerYLen, qTileCoordinates.zPos )
  				);
          point_match_line_group.add(line);
          addPointMatchLineUUIDsToTiles(line.uuid, m.pGroupId, m.pId);
          addPointMatchLineUUIDsToTiles(line.uuid, m.qGroupId, m.qId);
  			}
  		});
  	});

    //draw interlayer lines
    _.forEach(removeDuplicatePMs(), function(m){
      var pTileCoordinates = getTileCoordinates(m.pGroupId, m.pId);
      var qTileCoordinates = getTileCoordinates(m.qGroupId, m.qId);
      if (pTileCoordinates && qTileCoordinates){
        var line_geometry = new THREE.Geometry();
        //TODO this will eventually be customized once point matches are separated into different categories
        var line_material = new THREE.LineBasicMaterial({
          color: line_color,
          linewidth: line_width
        });
        var line = new THREE.Line( line_geometry, line_material );

        line_geometry.vertices.push(
          new THREE.Vector3( pTileCoordinates.xPos, pTileCoordinates.yPos, pTileCoordinates.zPos ),
          new THREE.Vector3( qTileCoordinates.xPos, qTileCoordinates.yPos, qTileCoordinates.zPos )
        );
        point_match_line_group.add(line);
        addPointMatchLineUUIDsToTiles(line.uuid, m.pGroupId, m.pId);
        addPointMatchLineUUIDsToTiles(line.uuid, m.qGroupId, m.qId);
      }
    });

    scene.add(point_match_line_group)
    console.log("number of tiles: ", tile_border_group.children.length)
  }

  //adds the UUID of the point match line to the appropriate tile (so they can be highlighted later)
  function addPointMatchLineUUIDsToTiles(lineUUID, groupId, tileId){
    var p_tile_group = _.find(all_tile_groups, function(g){
      return g.userData.zLayer == groupId;
    });
    var p_tile = _.find(p_tile_group.children, function(c){
      return c.userData.tileId == tileId;
    });
    if (!p_tile.userData.point_match_line_UUIDs){
      p_tile.userData.point_match_line_UUIDs = []
    }
    p_tile.userData.point_match_line_UUIDs.push(lineUUID)
  }

  //removes duplicate inter-layer point_matches. will eventually be used in a bigger function that processes point matches
  function removeDuplicatePMs(){
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
  }

  function getTileCoordinates(groupId, tileId){
  	var layerData = _.find(tileData, function(l){
  		return l.z == groupId;
  	});
  	//the layer could be undefined if the match was in a layer not rendered
  	if (layerData){
  		var tileCoordinates = _.find(layerData.tileCoordinates, function (t){
  			return t.tileId == tileId;
  		});
  		//the tile with ID m.pId might not exist when tileBounds were generated???
  		if (tileCoordinates){
  			return tileCoordinates;
  		}
  	}
  }

  function onDocumentMouseMove( event ) {
  	event.preventDefault();
  	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  	raycaster.setFromCamera( mouse, camera );

    //only intersect tiles (in THREE.Group), not point match lines
  	var intersections = raycaster.intersectObjects( all_tile_groups, true );

  	if ( intersections.length > 0) {
      var intersectedObject = intersected ? intersected.object : null;
      //only highlight if the mouse moved to a different tile (if the mouse is moved around in the same tile, don't do anything)
      if (intersectedObject != intersections[0].object) {
    		if (intersected){ //dehighlight previous intersection
          dehighlight(intersected);
          metadata_container.innerHTML = "";
    		}
    		intersected = intersections[0];
        highlight(intersected);
        //update metadata text
        updateMetadata(intersected);
      }
  	}else if (intersected){ //there are no current intersections, but there was a previous intersection
      dehighlight(intersected);
      metadata_container.innerHTML = "";
  		intersected = null;
  	}

    //TODO such a hack. hopefully this doesn't slow things down
    if (selected){
      highlight(selected)
    }
  }

  function onDocumentMouseDown(event){
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    var intersections = raycaster.intersectObjects( all_tile_groups, true );
    if ( intersections.length > 0 ) {
      downobj = intersections[0];
    }else{
      //save the position of mousedown
      downmouseX = mouse.x;
      downmouseY = mouse.y;
    }
  }

  function onDocumentMouseUp( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera( mouse, camera );
    var intersections = raycaster.intersectObjects( all_tile_groups, true );
    if ( intersections.length > 0 ) {
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
          selected_tile_metadata_container.innerHTML = "";
        }
        //highlight new selected tile
        selected = upobj; //can also be downobj since they are the same
        highlight(selected);
        updateSelectedMetadata(selected);
      }
    }
    if (!downobj && !upobj){ //if the mouse is clicked outside
      //only dehighlight selected tile if mouse was clicked, not when it is dragged for panning
      if(downmouseX == upmouseX && downmouseY == upmouseY ){
        if (selected){
          dehighlight(selected);
          selected = null;
        }
        selected_tile_metadata_container.innerHTML = "";
      }
    }
    downobj = null;
    upobj = null;

  }

  function updateMetadata(tile){
    var tileZText = "Tile Z: " + tile.object.parent.userData.zLayer;
    var tileIDText = "Tile ID: " + tile.object.userData.tileId;
    var tileNumPointMatchesText = "Number of tiles with point matches: " + tile.object.userData.point_match_line_UUIDs.length;
    metadata_container.innerHTML = "<br/>" +  tileZText + "<br/>" + tileIDText + "<br/>" + tileNumPointMatchesText;
  }

  function updateSelectedMetadata(tile){
    var tileZText = "Tile Z: " + tile.object.parent.userData.zLayer;
    var tileIDText = "Tile ID: " + tile.object.userData.tileId;
    var tileNumPointMatchesText = "Number of tiles with point matches: " + tile.object.userData.point_match_line_UUIDs.length;
    selected_tile_metadata_container.innerHTML = tileZText + "<br/>" + tileIDText + "<br/>" + tileNumPointMatchesText;
  }

  function highlight(intersected){
    //increase opacity of tile
    intersected.object.material.opacity = tile_highlight_opacity;
    //show tile border
    if (intersected.object.tileBorder) intersected.object.tileBorder.material.visible = true;
    //increase width and change color of all of the tile's point match lines
    highlightLines(intersected, line_highlight_width, line_highlight_color)
  }

  function dehighlight(intersected){
    //revert opacity of tile
    intersected.object.material.opacity = tile_opacity;
    //hide tile border
    if (intersected.object.tileBorder) intersected.object.tileBorder.material.visible = false;
    //revert style of the tile's point match lines
    highlightLines(intersected, line_width, line_color)
  }

  //highlights and unhighlights the point match lines of the moused over tile
  function highlightLines(intersectedTile, linewidth, lineColor){
    _.each(intersectedTile.object.userData.point_match_line_UUIDs, function(u){
      var pm_line = _.find(point_match_line_group.children, function(c){
        return c.uuid == u;
      });
      pm_line.material.linewidth = linewidth;
      pm_line.material.color.set(lineColor);
    });
  }
  function animate() {
  	requestAnimationFrame( animate );
  	render();
  	controls.update();
  }

  function render() {
  	renderer.render( scene, camera );
  }

}

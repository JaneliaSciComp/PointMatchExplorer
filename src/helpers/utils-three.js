import THREE from 'three'
import TrackballControls from 'three-trackballcontrols'
import 'lodash'
import chroma from 'chroma-js'

export var camera;
var scene, renderer, controls;
var intersected, selected;

var mouse, raycaster;
var downobj, upobj;
var downmouseX, upmouseX, downmouseY, upmouseY;
var animateId;

var size_scale = 0.05;
var position_scale = 0.1;

//distance between each layer
var z_spacing = 700;
var z_offset;

//number of units to shorten both sides of the intra-layer point match lines by
var line_shorten_factor = 45;
//used for the camera. anything beyond this distance will not be drawn.
var draw_distance = 1000000;

//maps the face index of the merged tiles to the tile information
var faceIndexToTileInfo = {};
//merged tiles and merged point match lines
var merged_tiles, merged_line;

//max and min strength of pm connections
var maxWeight, minWeight;

var pm_connection_strength_gradient_colors = ['#c33f2e', '#fc9d59', '#fee08b', '#e0f381', '#76c76f', '#3288bd'];
//how many steps to generate the gradient in
var pm_connection_strength_chroma_scale;
var tile_gradient_colors = ['#fc66ff', '#66fcff'];
var tile_gradient_chroma_scale;

var line_color = 0xaaaaaa;
var line_width = 0.5;
var line_highlight_width = 4;

var tile_opacity = 0.9;
// var tile_highlight_opacity = 0.9;

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

export const generateVisualization = function(canvas, tileData){
  scene = new THREE.Scene();
  mouse = new THREE.Vector2();
  raycaster = new THREE.Raycaster();

  camera = new THREE.PerspectiveCamera(camera_view_angle, window.innerWidth / window.innerHeight, 1, draw_distance);
  camera.position.set(initial_camera_X, initial_camera_Y, initial_camera_Z);
  scene.add(camera);

  renderer = new THREE.WebGLRenderer({antialias: true, canvas: canvas});
  renderer.setClearColor(background_color);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  controls = new TrackballControls(camera, renderer.domElement);
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

  drawTiles(tileData);
  drawPMLines(tileData);
  animate();

  return {
    minWeight: weightRange.minWeight,
    maxWeight: weightRange.maxWeight
  };
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
  });

  var faceIndexCounter = 0;
  _.forEach(tileData, function(layer, index){
    var layer_color = tile_gradient_chroma_scale[index];
    _.forEach(layer.tileCoordinates, function(c){
      //adding data needed to draw the tile
      c.width = size_scale * (c.maxXtranslated - c.minXtranslated);
      c.height = size_scale * (c.maxYtranslated - c.minYtranslated);
      c.color = layer_color;
      //minXtranslated and minYtranslated are scaled down to produce actual coordinates in three.js
      c.xPos = position_scale * c.minXtranslated;
      //making this negative orients the layer properly
      c.yPos = -position_scale * c.minYtranslated;
      c.zPos = z_offset;

      //creating geometries and drawing the tile
      //the merged tiles are what are drawn on the canvas
      var tile_geometry = new THREE.PlaneGeometry(c.width, c.height);
      for (var i = 0; i < tile_geometry.faces.length; i++) {
					tile_geometry.faces[i].color = new THREE.Color(c.color);
          faceIndexToTileInfo[faceIndexCounter + i] = c;
			}
      faceIndexCounter += tile_geometry.faces.length;

      var tile_mesh = new THREE.Mesh(tile_geometry);
      tile_mesh.position.set(c.xPos, c.yPos, c.zPos);
      tile_mesh.updateMatrix();
      merged_tile_geometry.merge(tile_mesh.geometry, tile_mesh.matrix);
    });
    z_offset = z_offset - z_spacing;
  });
  //merged_tiles is what is drawn on the canvas (improves performance)
  merged_tiles = new THREE.Mesh(merged_tile_geometry, merged_tile_material);
  scene.add(merged_tiles);
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

      merged_line_geometry.vertices.push(
        new THREE.Vector3(m.pTile.xPos + smallerXLen, m.pTile.yPos + smallerYLen, m.pTile.zPos),
        new THREE.Vector3(m.qTile.xPos - smallerXLen, m.qTile.yPos - smallerYLen, m.qTile.zPos)
      );

      var PMInfo = {
        startX: m.pTile.xPos + smallerXLen,
        startY: m.pTile.yPos + smallerYLen,
        startZ: m.pTile.zPos,
        endX: m.qTile.xPos - smallerXLen,
        endY: m.qTile.yPos - smallerYLen,
        endZ: m.qTile.zPos,
        connection_strength: m.matches.w.length,
        strength_color: pm_connection_strength_chroma_scale(m.matches.w.length)
      };

      addPointMatchInfoToTile(m.pTile, PMInfo);
      addPointMatchInfoToTile(m.qTile, PMInfo);
    });
  });

  //create interlayer lines
  _.forEach(removeDuplicatePMs(tileData), function(m){
    m.pTile = getTileCoordinates(m.pId, tileData);
    m.qTile = getTileCoordinates(m.qId, tileData);

    //since interlayer lines are drawn from the center of the tiles, no calculations need to be done
    merged_line_geometry.vertices.push(
      new THREE.Vector3(m.pTile.xPos, m.pTile.yPos, m.pTile.zPos),
      new THREE.Vector3(m.qTile.xPos, m.qTile.yPos, m.qTile.zPos)
    );

    var PMInfo = {
      startX: m.pTile.xPos,
      startY: m.pTile.yPos,
      startZ: m.pTile.zPos,
      endX: m.qTile.xPos,
      endY: m.qTile.yPos,
      endZ: m.qTile.zPos,
      connection_strength: m.matches.w.length,
      strength_color: pm_connection_strength_chroma_scale(m.matches.w.length)
    };

    addPointMatchInfoToTile(m.pTile, PMInfo);
    addPointMatchInfoToTile(m.qTile, PMInfo);
  });

  //merged_line is what is drawn on the canvas (improves performance)
  merged_line = new THREE.LineSegments(merged_line_geometry, merged_line_material);
  scene.add(merged_line);
};

var addPointMatchInfoToTile = function(tile, PMInfo){
  if (!tile.PMList){ tile.PMList = []; }
  tile.PMList.push(PMInfo);
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
  animateId = requestAnimationFrame(animate);
  renderPME();
  controls.update();
};

var getRaycastIntersections = function(event){
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects([merged_tiles], true);
};

export const onMouseMove = function(event) {
  var metadataValues;
  event.preventDefault();
  var intersections = getRaycastIntersections(event);
  if (intersections.length > 0) {
    var intersectedFaceIndex = intersected ? intersected.faceIndex : null;
    //only highlight if the mouse moved to a different tile
    //(if the mouse is moved around in the same tile, don't do anything)
    if (intersectedFaceIndex != intersections[0].faceIndex) {
      if (intersected){ //dehighlight previous intersection
        dehighlight(intersected.faceIndex);
      }
      intersected = intersections[0];
      highlight(intersected.faceIndex);
    }
    //get updated metadata text
    metadataValues = getMouseoverMetadata(intersected.faceIndex);
  }else if (intersected){ //there are no current intersections, but there was a previous intersection
    dehighlight(intersected.faceIndex);
    intersected = null;
  }
  return metadataValues;
};

export const onMouseDown = function(event){
  event.preventDefault();
  var intersections = getRaycastIntersections(event);
  if (intersections.length > 0) {
    downobj = intersections[0];
  }else{
    //save the position of mousedown
    downmouseX = mouse.x;
    downmouseY = mouse.y;
  }
};

export const onMouseUp = function(event, isShiftDown, isCtrlDown, isMetaDown, afterMouseUp, userInput, stackResolution) {
  var metadataValues;
  event.preventDefault();
  var intersections = getRaycastIntersections(event);
  if (intersections.length > 0) {
    upobj = intersections[0];
  }else{
    //save position of the mouseup
    upmouseX = mouse.x;
    upmouseY = mouse.y;
  }
  if (downobj && upobj){
    //if the mouse was clicked on the same tile
    if (downobj.faceIndex == upobj.faceIndex){
      //dehighlight already selected tile/layer
      if (selected){
        dehighlight(selected.faceIndex, true);
      }
      selected = upobj;
      if (isCtrlDown){
        openTileImageWithNeighbors(selected.faceIndex, userInput);
      }
      if (isMetaDown){
        openStackInCatmaid(selected.faceIndex, userInput, stackResolution);
      }
      //highlight new selected tile
      //can also be downobj since they are the same
      highlight(selected.faceIndex, true, isShiftDown);
      metadataValues = getSelectedMetadata(selected.faceIndex, isShiftDown);
    }
  }
  if (!downobj && !upobj){ //if the mouse is clicked outside
    //only dehighlight selected tile if mouse was clicked, not when it is dragged for panning
    if(downmouseX == upmouseX && downmouseY == upmouseY){
      if (selected){
        dehighlight(selected.faceIndex, true);
        selected = null;
      }
    }else if (selected){
      //do not remove metadata display if the mouse was not clicked
      metadataValues = getSelectedMetadata(selected.faceIndex, isShiftDown);
    }
  }
  downobj = null;
  upobj = null;
  afterMouseUp();
  return metadataValues;
};

var openTileImageWithNeighbors = function(faceIndex, userInput){
  var url = "http://tem-services.int.janelia.org:8080/render-ws/v1/owner/flyTEM";
  url += "/project/" + userInput.selectedProject;
  url += "/stack/" + userInput.selectedStack;
  url += "/tile/" + faceIndexToTileInfo[faceIndex].tileId;
  url += "/withNeighbors/jpeg-image?scale=0.5&filter=true";
  window.open(url);
};

var openStackInCatmaid = function(faceIndex, userInput, stackResolution){
  var tileInfo = faceIndexToTileInfo[faceIndex];
  var url = "http://renderer-catmaid:8000/?";
  url += "pid=" + userInput.selectedProject;
  url += "&zp=" + tileInfo.tileZ*stackResolution.stackResolutionZ;
  url += "&yp=" + (tileInfo.minY+tileInfo.maxY)/2*stackResolution.stackResolutionY;
  url += "&xp=" + (tileInfo.minX+tileInfo.maxX)/2*stackResolution.stackResolutionX;
  url += "&tool=navigator";
  url += "&sid0=" + userInput.selectedStack;
  url += "&s0=1.5";
  window.open(url);
};

var highlight = function(faceIndex, isSelected, isShiftDown){
  if (isShiftDown){
    var zLayer = faceIndexToTileInfo[faceIndex].tileZ;
    var line_geometry = new THREE.Geometry();
    var line_material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: line_highlight_width,
      vertexColors: THREE.VertexColors
    });

    var vertex_colors = [];
    var vertex_counter = 0;
    _.forEach(faceIndexToTileInfo, function(tile){
      //draw the point match lines for all the tiles in that layer
      if (tile.tileZ == zLayer){
        _.forEach(tile.PMList, function(pm){
          line_geometry.vertices.push(
            new THREE.Vector3(pm.startX, pm.startY, pm.startZ),
            new THREE.Vector3(pm.endX, pm.endY, pm.endZ)
          );
          vertex_colors[vertex_counter] = new THREE.Color( pm.strength_color.hex() );
          vertex_colors[vertex_counter+1] = new THREE.Color( pm.strength_color.hex() );
          vertex_counter += 2;
        });
      }
    });
    line_geometry.colors = vertex_colors;
    var selected_layer_PM_lines = new THREE.LineSegments(line_geometry, line_material);
    selected_layer_PM_lines.name = "selectedLayer";
    scene.add(selected_layer_PM_lines);
  }else{
    var tile = faceIndexToTileInfo[faceIndex];
    //draw the tile border
    var tileBorder = createTileBorder(tile, isSelected);
    //draw the point match lines
    var PMLines = createLines(tile, isSelected);
    //the names are necessary for dehighlighting the objects
    if (isSelected){
      tileBorder.name = "selectedTileBorder";
      PMLines.name = "selectedPMs";
    }
    else{
      tileBorder.name = "mouseoverTileBorder";
      PMLines.name = "mouseoverPMs";
    }
    scene.add(tileBorder);
    scene.add(PMLines);
  }
};

var createTileBorder = function(tile, isSelected){
  //draws 4 lines to form the border around the tile
  var border_geometry = new THREE.Geometry();
  var border_material = new THREE.LineBasicMaterial({
    color: tile_border_color,
    linewidth: tile_border_width,
    visible: true
  });
  //xPos and yPos are the centers of the tiles, a corner needs to be calcuated in order to draw the border_geometry
  var cornerX = tile.xPos - 0.5 * tile.width;
  var cornerY = tile.yPos - 0.5 * tile.height;
  border_geometry.vertices.push(
    new THREE.Vector3(cornerX, cornerY, tile.zPos),
    new THREE.Vector3(cornerX + tile.width, cornerY, tile.zPos),
    new THREE.Vector3(cornerX + tile.width, cornerY + tile.height, tile.zPos),
    new THREE.Vector3(cornerX, cornerY + tile.height, tile.zPos),
    new THREE.Vector3(cornerX, cornerY, tile.zPos)
  );
  var highlighted_tile_border = new THREE.Line(border_geometry, border_material);
  return highlighted_tile_border;
};

var createLines = function(tile, isSelected){
  var PMGroup = new THREE.Group();
  _.forEach(tile.PMList, function(pm){
    var line_geometry = new THREE.Geometry();
    var line_material = new THREE.LineBasicMaterial({
      color: pm.strength_color.hex(),
      linewidth: line_highlight_width
    });
    line_geometry.vertices.push(
      new THREE.Vector3(pm.startX, pm.startY, pm.startZ),
      new THREE.Vector3(pm.endX, pm.endY, pm.endZ)
    );
    var line = new THREE.Line(line_geometry, line_material);
    PMGroup.add(line);
  });
  return PMGroup;
};

var dehighlight = function(faceIndex, isSelected){
  if (isSelected){
    scene.remove(scene.getObjectByName("selectedTileBorder"));
    scene.remove(scene.getObjectByName("selectedPMs"));
    scene.remove(scene.getObjectByName("selectedLayer"));
  }else{
    scene.remove(scene.getObjectByName("mouseoverTileBorder"));
    scene.remove(scene.getObjectByName("mouseoverPMs"));
  }
};

var getMouseoverMetadata = function(faceIndex){
  var tile = faceIndexToTileInfo[faceIndex];
  var md = [
    {
      keyname: "Tile Z",
      valuename: tile.tileZ
    },
    {
      keyname: "Tile ID",
      valuename: tile.tileId
    },
    {
      keyname: "Number of tiles with point matches",
      valuename: tile.PMList.length
    }
  ];
  return md;
};

var getSelectedMetadata = function(faceIndex, isShiftDown){
  var selected = faceIndexToTileInfo[faceIndex];
  var md;
  //check if a tile or a layer was selected
  if (isShiftDown){
      var pointMatchSetsCount = 0;
      var tileCount = 0;
      var zLayer = faceIndexToTileInfo[faceIndex].tileZ;
      _.forEach(faceIndexToTileInfo, function(tile){
        if (tile.tileZ == zLayer){
          tileCount++;
          pointMatchSetsCount += tile.PMList.length;
        }
      });
      //needs to be halved since they each tile has 2 faces and they are counted twice
      pointMatchSetsCount = pointMatchSetsCount/2;
      md = [
        {
          keyname: "Selected Z",
          valuename: zLayer
        },
        {
          keyname: "Tile Count",
          valuename: tileCount
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
        valuename: selected.tileZ
      },
      {
        keyname: "Selected Tile ID",
        valuename: selected.tileId
      },
      {
        keyname: "Number of tiles with point matches",
        valuename: selected.PMList.length
      }
    ];
  }
  return md;
};

export const disposeThreeScene = function(){
  function disposeMesh(mesh){
    mesh.geometry.dispose();
    mesh.material.dispose();
  }
  // function empty(elem){
  //   while (elem.lastChild) elem.removeChild(elem.lastChild);
  // }
  cancelAnimationFrame(animateId);

  disposeMesh(merged_tiles);
  disposeMesh(merged_line);

  scene.remove(merged_tiles);
  scene.remove(merged_line);
  scene.remove(camera);

  merged_tiles = null;
  merged_line = null;
  camera = null;
  scene = null;
  controls = null;

  // empty(document.getElementById('container'));
};
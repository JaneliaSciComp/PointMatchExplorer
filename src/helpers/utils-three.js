import * as THREE from "three"
import { MeshLine, MeshLineMaterial } from "three.meshline" 
import TrackballControls from "three-trackballcontrols"
import "lodash"
import chroma from "chroma-js"

export var camera;
export var pm_connection_strength_gradient_colors = ["#c33f2e", "#fc9d59", "#fee08b", "#e0f381", "#76c76f", "#3288bd"];

// flipped gradient with strongest connections marked as red
//export var pm_connection_strength_gradient_colors = ["#3288bd", "#76c76f", "#e0f381", "#fee08b", "#fc9d59", "#c33f2e"];

let scene, renderer, controls;
let intersected, selected;

let mouse, raycaster;
let downobj, upobj;
let downmouseX, upmouseX, downmouseY, upmouseY;
let animateId;

const size_scale = 0.05;
const position_scale = 0.1;

//distance between each layer
const z_spacing = 700;
let z_offset;

//number of units to shorten both sides of the intra-layer point match lines by
const line_shorten_factor = 45;
//used for the camera. anything beyond this distance will not be drawn.
const draw_distance = 1000000;

//maps the face index of the merged tiles to the tile information
let faceIndexToTileInfo = {};
//merged tiles and merged point match lines
let merged_tiles, merged_line;

//max and min strength of pm connections
let maxWeight, minWeight;

//how many steps to generate the gradient in
let pm_connection_strength_chroma_scale;
const tile_gradient_colors = ["#fc66ff", "#66fcff"];
let tile_gradient_chroma_scale;

const line_color = 0xaaaaaa;
const line_width = 1;
let line_highlight_width = 20;

const tile_opacity = 0.9;
// var tile_highlight_opacity = 0.9;

const tile_border_color = 0x4B4E4F;
const tile_border_width = 2;

const background_color = 0xffffff;

const camera_view_angle = 50;
const initial_camera_X = 0;
const initial_camera_Y = 0;
const initial_camera_Z = 10000;

const control_rotate_speed = 2;
const control_zoom_speed = 0.5;
const control_min_distance = 0;
const control_max_distance = 5000000;

export const generateVisualization = function(canvas, tileData){
  scene = new THREE.Scene();
  mouse = new THREE.Vector2();
  raycaster = new THREE.Raycaster();

  camera = new THREE.PerspectiveCamera(camera_view_angle, window.innerWidth / window.innerHeight, 100, draw_distance);
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
  controls.addEventListener("change", renderPME);

  //adjusts Z so that the beginning offset is negative in order to center tiles with respect to (0,0,0)
  z_offset = 0.5 * tileData.length * z_spacing;
  //get a list of colors representing the interpolated gradient for tiles and connection strength
  tile_gradient_chroma_scale = chroma.scale(tile_gradient_colors).colors(tileData.length);

  const weightRange = calculateWeightRange(tileData);
  pm_connection_strength_chroma_scale = chroma.scale(pm_connection_strength_gradient_colors).domain([minWeight, maxWeight]);

  drawTiles(tileData);
  drawPMLines(tileData);
  animate();

  return {
    minWeight: weightRange.minWeight,
    maxWeight: weightRange.maxWeight
  }
};

//checks if tile exists, and if so, return the tile coordinate information
const getTileCoordinates = function (tileId,
                                     tileData) {
  let tileCoordinates;
  //loop through all tiles in each layer to find tile
  _.forEach(tileData, function (layer) {
    //since tileCoordinates is a dictionary, just check if tileId exists in the keys
    if (tileId in layer.tileCoordinates) {
      tileCoordinates = layer.tileCoordinates[tileId];
    }
    if (tileCoordinates) {
      return false;
    }
  });
  return tileCoordinates;
};

let getMatchWeight = function(canvasMatches) {
  let weight = 1;
  if (typeof canvasMatches.matchCount !== "undefined") {
    weight = canvasMatches.matchCount
  }
  return weight
};

//calculate max and min connection strength based on number of point matches
//for use in selecting the color indicating the strength
let calculateWeightRange = function(tileData) {
  let weight = 0;
  let maxWeight = 0;
  let minWeight = Number.MAX_VALUE;
  _.forEach(tileData, function(layer) {
    _.forEach(layer.pointMatches.matchCounts, function(m) {
      weight = getMatchWeight(m);
      maxWeight = Math.max(maxWeight, weight);
      minWeight = Math.min(minWeight, weight)
    })
  });
  return { minWeight: minWeight, maxWeight: maxWeight }
};

const drawTiles = function(tileData){
  const merged_tile_geometry = new THREE.Geometry();
  const merged_tile_material = new THREE.MeshBasicMaterial({
                                                             transparent: true,
                                                             opacity: tile_opacity,
                                                             side: THREE.DoubleSide,
                                                             vertexColors: THREE.FaceColors,
                                                           });

  let faceIndexCounter = 0;
  _.forEach(tileData, function(layer, index){
    const layer_color = tile_gradient_chroma_scale[index];
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
      c.PMList = [];
      c.layerPMList = [];

      //creating geometries and drawing the tile
      //the merged tiles are what are drawn on the canvas
      const tile_geometry = new THREE.PlaneGeometry(c.width, c.height);
      for (let i = 0; i < tile_geometry.faces.length; i++) {
        tile_geometry.faces[i].color = new THREE.Color(c.color);
        faceIndexToTileInfo[faceIndexCounter + i] = c
      }
      faceIndexCounter += tile_geometry.faces.length;

      const tile_mesh = new THREE.Mesh(tile_geometry);
      tile_mesh.position.set(c.xPos, c.yPos, c.zPos);
      tile_mesh.updateMatrix();
      merged_tile_geometry.merge(tile_mesh.geometry, tile_mesh.matrix)
    });
    z_offset = z_offset - z_spacing
  });
  //merged_tiles is what is drawn on the canvas (improves performance)
  merged_tiles = new THREE.Mesh(merged_tile_geometry, merged_tile_material);
  scene.add(merged_tiles)
};

const drawPMLines = function(tileData){
  const merged_line_geometry = new THREE.Geometry();
  const merged_line_material = new THREE.LineBasicMaterial({
                                                             color: line_color,
                                                             linewidth: line_width
                                                           });

  //create intra-layer lines
  _.forEach(tileData, function(layer) {

    let layerPMList = [];

    _.forEach(layer.pointMatches.matchCounts, function(m) {
      let matchWeight = getMatchWeight(m);
      if (matchWeight > 0) {
        m.pTile = getTileCoordinates(m.pId, tileData);
        m.qTile = getTileCoordinates(m.qId, tileData);

        let smallerXLen = 0;
        let smallerYLen = 0;

        if (m.pTile.zPos === m.qTile.zPos) {

          // calculates new coordinates to draw the intra-layer lines
          // so that they do not begin and start in the middle of the tile

          let xlen = m.qTile.xPos - m.pTile.xPos;
          let ylen = m.qTile.yPos - m.pTile.yPos;
          let hlen = Math.sqrt(Math.pow(xlen, 2) + Math.pow(ylen, 2));
          let ratio = line_shorten_factor / hlen;
          smallerXLen = xlen * ratio;
          smallerYLen = ylen * ratio

        } // else inter-layer lines are drawn from the center of the tiles, no calculations need to be done

        merged_line_geometry.vertices.push(
          new THREE.Vector3(m.pTile.xPos + smallerXLen, m.pTile.yPos + smallerYLen, m.pTile.zPos),
          new THREE.Vector3(m.qTile.xPos - smallerXLen, m.qTile.yPos - smallerYLen, m.qTile.zPos)
        );

        const PMInfo = {
          startX: m.pTile.xPos + smallerXLen,
          startY: m.pTile.yPos + smallerYLen,
          startZ: m.pTile.zPos,
          endX: m.qTile.xPos - smallerXLen,
          endY: m.qTile.yPos - smallerYLen,
          endZ: m.qTile.zPos,
          connection_strength: matchWeight,
          strength_color: pm_connection_strength_chroma_scale(matchWeight)
        };

        addPointMatchInfoToTile(m.pTile, PMInfo);
        addPointMatchInfoToTile(m.qTile, PMInfo);

        if (m.pTile.zPos === m.qTile.zPos) {
          layerPMList.push(PMInfo);
          m.pTile.layerPMList = layerPMList;
          m.qTile.layerPMList = layerPMList;
        }

      }
    })
  });

  //merged_line is what is drawn on the canvas (improves performance)
  merged_line = new THREE.LineSegments(merged_line_geometry, merged_line_material);
  scene.add(merged_line)
};

const addPointMatchInfoToTile = function(tile, PMInfo){
  if (!tile.PMList){ tile.PMList = [] }
  tile.PMList.push(PMInfo)
};

const renderPME = function(){
  renderer.render(scene, camera)
};

const animate = function(){
  animateId = requestAnimationFrame(animate);
  renderPME();
  controls.update()
};

const getRaycastIntersections = function (event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  return raycaster.intersectObjects([merged_tiles], true);
};

export const onMouseMove = function(event) {
  let metadataValues;
  event.preventDefault();
  const intersections = getRaycastIntersections(event);
  if (intersections.length > 0) {
    const intersectedFaceIndex = intersected ? intersected.faceIndex : null;
    //only highlight if the mouse moved to a different tile
    //(if the mouse is moved around in the same tile, don't do anything)
    if (intersectedFaceIndex !== intersections[0].faceIndex) {
      if (intersected){ //dehighlight previous intersection
        dehighlight(intersected.faceIndex)
      }
      intersected = intersections[0];
      highlight(intersected.faceIndex)
    }
    //get updated metadata text
    metadataValues = getMouseoverMetadata(intersected.faceIndex)
  }else if (intersected){ //there are no current intersections, but there was a previous intersection
    dehighlight(intersected.faceIndex);
    intersected = null
  }
  return metadataValues
};

export const onMouseDown = function(event){
  event.preventDefault();
  const intersections = getRaycastIntersections(event);
  if (intersections.length > 0) {
    downobj = intersections[0]
  }else{
    //save the position of mousedown
    downmouseX = mouse.x;
    downmouseY = mouse.y
  }
};

export const onMouseUp = function(event, isShiftDown, isCtrlDown, isMetaDown, isPDown, afterMouseUp, userInput, stackResolution) {
  let metadataValues;
  event.preventDefault();
  const intersections = getRaycastIntersections(event);
  if (intersections.length > 0) {
    upobj = intersections[0]
  }else{
    //save position of the mouseup
    upmouseX = mouse.x;
    upmouseY = mouse.y
  }
  if (downobj && upobj){
    //if the mouse was clicked on the same tile
    if (downobj.faceIndex === upobj.faceIndex){
      //dehighlight already selected tile/layer
      if (selected){
        dehighlight(selected.faceIndex, true);
        if (isPDown) {
          openTilePair(selected.faceIndex, upobj.faceIndex, userInput)
        }
      }
      selected = upobj;
      if (isCtrlDown){
        openTileImageWithNeighbors(selected.faceIndex, userInput)
      }
      if (isMetaDown){
        openStackInCatmaid(selected.faceIndex, userInput, stackResolution)
      }
      //highlight new selected tile
      //can also be downobj since they are the same
      highlight(selected.faceIndex, true, isShiftDown);
      metadataValues = getSelectedMetadata(selected.faceIndex, isShiftDown)
    }
  }
  if (!downobj && !upobj){ //if the mouse is clicked outside
    //only dehighlight selected tile if mouse was clicked, not when it is dragged for panning
    if(downmouseX === upmouseX && downmouseY === upmouseY){
      if (selected){
        dehighlight(selected.faceIndex, true);
        selected = null
      }
    }else if (selected){
      //do not remove metadata display if the mouse was not clicked
      metadataValues = getSelectedMetadata(selected.faceIndex, isShiftDown)
    }
  }
  downobj = null;
  upobj = null;
  afterMouseUp();
  return metadataValues
};

const openTileImageWithNeighbors = function openTileImageWithNeighbors(faceIndex, userInput) {

  const tile = faceIndexToTileInfo[faceIndex];

  const width = tile.maxX - tile.minX + 1;
  const renderScale = 400.0 / width;

  const url = "http://" + userInput.dynamicRenderHost + "/render-ws/view/tile-with-neighbors.html?tileId=" +
              tile.tileId +
              "&renderScale=" + renderScale +
              "&renderStackOwner=" + userInput.selectedStackOwner +
              "&renderStackProject=" + userInput.selectedProject +
              "&renderStack=" + userInput.selectedStack +
              "&matchOwner=" + userInput.selectedMatchOwner +
              "&matchCollection=" + userInput.selectedMatchCollection;

  window.open(url)
};

const openTilePair = function openTilePair(faceIndexA, faceIndexB, userInput) {

  const pTile = faceIndexToTileInfo[faceIndexA];
  const qTile = faceIndexToTileInfo[faceIndexB];

  const maxWidth = Math.max((pTile.maxX - pTile.minX + 1), (qTile.maxX - qTile.minX + 1));
  const renderScale = 700.0 / maxWidth;

  const url = "http://" + userInput.dynamicRenderHost + "/render-ws/view/tile-pair.html?pId=" + pTile.tileId +
              "&qId=" + qTile.tileId +
              "&renderScale=" + renderScale +
              "&renderStackOwner=" + userInput.selectedStackOwner +
              "&renderStackProject=" + userInput.selectedProject +
              "&renderStack=" + userInput.selectedStack +
              "&matchOwner=" + userInput.selectedMatchOwner +
              "&matchCollection=" + userInput.selectedMatchCollection;

  window.open(url)
};

const openStackInCatmaid = function(faceIndex, userInput, stackResolution){
  const tileInfo = faceIndexToTileInfo[faceIndex];
  let url = "http://" + userInput.catmaidHost + "/?";
  url += "pid=" + userInput.selectedStackOwner + "__" + userInput.selectedProject;
  url += "&zp=" + tileInfo.tileZ*stackResolution.stackResolutionZ;
  url += "&yp=" + (tileInfo.minY+tileInfo.maxY)/2*stackResolution.stackResolutionY;
  url += "&xp=" + (tileInfo.minX+tileInfo.maxX)/2*stackResolution.stackResolutionX;
  url += "&tool=navigator";
  url += "&sid0=" + userInput.selectedStack;
  url += "&s0=1.5";
  window.open(url)
};

let highlight = function(faceIndex, isSelected, isShiftDown) {

  let tile = faceIndexToTileInfo[faceIndex];

  if (isShiftDown){
    //draw the point match lines for all the tiles in that layer
    let selected_layer_PM_lines = new THREE.Group();
    addHighlightedPMLines(selected_layer_PM_lines, tile.layerPMList);
    selected_layer_PM_lines.name = "selectedLayer";
    scene.add(selected_layer_PM_lines);

  } else {

    //draw the tile border
    const tileBorder = createTileBorder(tile);
    //draw the point match lines
    const PMLines = createLines(tile, isSelected);
    //the names are necessary for dehighlighting the objects
    if (isSelected){
      tileBorder.name = "selectedTileBorder";
      PMLines.name = "selectedPMs"
    }
    else{
      tileBorder.name = "mouseoverTileBorder";
      PMLines.name = "mouseoverPMs"
    }
    scene.add(tileBorder);
    scene.add(PMLines)
  }
};

let addHighlightedPMLines = function(group, PMList) {
  // /*eslint no-console: "off"*/
  // console.log("addHighlightedPMLines: entry, PMList length is: " + PMList.length);

  const canvasResolution = new THREE.Vector2(window.innerWidth, window.innerHeight);

  _.forEach(PMList, function(pm) {
    const line_geometry = new THREE.Geometry();
    line_geometry.vertices.push(
      new THREE.Vector3(pm.startX, pm.startY, pm.startZ),
      new THREE.Vector3(pm.endX, pm.endY, pm.endZ)
    );
    const line = new MeshLine();
    line.setGeometry(line_geometry);
    const line_material = new MeshLineMaterial({
                                                 color: new THREE.Color(pm.strength_color.hex()),
                                                 lineWidth: line_highlight_width,
                                                 sizeAttenuation: true,
                                                 resolution: canvasResolution

                                               });
    const meshLine = new THREE.Mesh(line.geometry, line_material);
    group.add(meshLine)
  })
  // /*eslint no-console: "off"*/
  // console.log("addHighlightedPMLines: exit");
};

const createTileBorder = function(tile){
  //draws 4 lines to form the border around the tile
  const border_geometry = new THREE.Geometry();
  const border_material = new THREE.LineBasicMaterial({
                                                        color: tile_border_color,
                                                        linewidth: tile_border_width,
                                                        visible: true
                                                      });
  //xPos and yPos are the centers of the tiles, a corner needs to be calcuated in order to draw the border_geometry
  const cornerX = tile.xPos - 0.5 * tile.width;
  const cornerY = tile.yPos - 0.5 * tile.height;
  border_geometry.vertices.push(
    new THREE.Vector3(cornerX, cornerY, tile.zPos),
    new THREE.Vector3(cornerX + tile.width, cornerY, tile.zPos),
    new THREE.Vector3(cornerX + tile.width, cornerY + tile.height, tile.zPos),
    new THREE.Vector3(cornerX, cornerY + tile.height, tile.zPos),
    new THREE.Vector3(cornerX, cornerY, tile.zPos)
  );
  return new THREE.Line(border_geometry, border_material); // highlighted_tile_border
};

const createLines = function(tile){
  const PMGroup = new THREE.Group();
  addHighlightedPMLines(PMGroup, tile.PMList);
  return PMGroup
};

const dehighlight = function(faceIndex, isSelected){
  if (isSelected){
    scene.remove(scene.getObjectByName("selectedTileBorder"));
    scene.remove(scene.getObjectByName("selectedPMs"));
    scene.remove(scene.getObjectByName("selectedLayer"))
  }else{
    scene.remove(scene.getObjectByName("mouseoverTileBorder"));
    scene.remove(scene.getObjectByName("mouseoverPMs"))
  }
};

const getMouseoverMetadata = function(faceIndex){
  const tile = faceIndexToTileInfo[faceIndex];
  return [
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
};

const getSelectedMetadata = function(faceIndex, isShiftDown){
  const selected = faceIndexToTileInfo[faceIndex];
  let md;
  //check if a tile or a layer was selected
  if (isShiftDown){
    let pointMatchSetsCount = 0;
    let tileCount = 0;
    const zLayer = faceIndexToTileInfo[faceIndex].tileZ;
    _.forEach(faceIndexToTileInfo, function(tile){
      if (tile.tileZ === zLayer){
        tileCount++;
        pointMatchSetsCount += tile.PMList.length
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
    ]
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
    ]
  }
  return md
};

export const disposeThreeScene = function(){
  function disposeMesh(mesh){
    mesh.geometry.dispose();
    mesh.material.dispose()
  }

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
  faceIndexToTileInfo = {}

};

window.addEventListener( "resize", onWindowResize, false );

function onWindowResize(){
  if(camera && renderer){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight )
  }
}

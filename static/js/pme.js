//TODO make div that shows loading information
//TODO make template inheritance
var container, controls;
var camera, scene, renderer;

var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
var intersected, old_color;

var size_scale = 0.05;
var position_scale = 0.1;

//distance between each layer
var z_spacing = 500;
//adjusts Z so that the beginning offset is negative in order to center tiles with respect to (0,0,0)
var z_offset = -0.5 * tileData.length * z_spacing;

var highlight_color = 0xff0000;
var gradient_hex_values = rgbGradient("#fc00ff", "#00dbde", tileData.length);

//number of units to shorten both sides of the intra-layer point match lines by
var line_shorten_factor = 45;

init();
animate();

function init() {
	container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();

	//TODO change 10000000 based on maximum dimension of data
	//TODO set maxZ dynamically using bounding box
	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000000 );
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
	controls.minDistance = 500;
	controls.maxDistance = 5000000;
	controls.addEventListener( 'change', render );

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	window.addEventListener( 'resize', onWindowResize, false );

	renderPME();
}

function renderPME(){
	//TODO put each layer in its own group (only merge tiles of one layer, not all layers together)
	//creating geometries and materials for the tiles and point match connections
	var parent_geometry = new THREE.Geometry();
	var parent_material = new THREE.MeshLambertMaterial({
		color: 0xffffff,
		transparent: false,
		opacity: 0.5,
		side: THREE.DoubleSide,
		shading: THREE.SmoothShading,
		vertexColors: THREE.FaceColors
	});
	var parent_mesh = new THREE.Mesh(parent_geometry, parent_material);

	var line_geometry = new THREE.Geometry();
	var line_material = new THREE.LineBasicMaterial({
		color: 0x0000ff,
		linewidth: 1
	});
	var point_match_lines = new THREE.LineSegments( line_geometry, line_material );

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

	_.forEach(tileData, function(layer, index){
		var layer_color = gradient_hex_values[index];
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
			_.forEach(tile_geometry.faces, function(f){
				f.color = new THREE.Color( c.color );
			})
			var tileMesh = new THREE.Mesh(tile_geometry);
			tileMesh.position.set(c.xPos, c.yPos, c.zPos);
			tileMesh.updateMatrix();
			parent_geometry.merge(tileMesh.geometry, tileMesh.matrix);
		});
		z_offset = z_offset + z_spacing;
	});

	_.forEach(tileData, function(layer){
		_.forEach(layer.pointMatches.matchesWithinGroup, function(m){
			var pTileCoordinates = getTileCoordinates(m.pGroupId, m.pId);
			var qTileCoordinates = getTileCoordinates(m.qGroupId, m.qId);
			if (pTileCoordinates && qTileCoordinates){
        //calculates new coordinates to draw the intra-layer lines so that the do not begin and start in the middle of the tile
        var xlen = qTileCoordinates.xPos - pTileCoordinates.xPos;
        var ylen = qTileCoordinates.yPos - pTileCoordinates.yPos;
        var hlen = Math.sqrt(Math.pow(xlen,2) + Math.pow(ylen,2));
        var ratio = line_shorten_factor / hlen;
        var smallerXLen = xlen * ratio;
        var smallerYLen = ylen * ratio;
				line_geometry.vertices.push(
					new THREE.Vector3( pTileCoordinates.xPos + smallerXLen, pTileCoordinates.yPos + smallerYLen, pTileCoordinates.zPos ),
					new THREE.Vector3( qTileCoordinates.xPos - smallerXLen, qTileCoordinates.yPos - smallerYLen, qTileCoordinates.zPos )
				);
			}
		});
		_.forEach(layer.pointMatches.matchesOutsideGroup, function(m){
			var pTileCoordinates = getTileCoordinates(m.pGroupId, m.pId);
			var qTileCoordinates = getTileCoordinates(m.qGroupId, m.qId);
			if (pTileCoordinates && qTileCoordinates){
				line_geometry.vertices.push(
					new THREE.Vector3( pTileCoordinates.xPos, pTileCoordinates.yPos, pTileCoordinates.zPos ),
					new THREE.Vector3( qTileCoordinates.xPos, qTileCoordinates.yPos, qTileCoordinates.zPos )
				);
			}
		});
	});

	scene.add(point_match_lines);
	scene.add(parent_mesh);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
	raycaster.setFromCamera( mouse, camera );

	var intersections = raycaster.intersectObjects( scene.children );

	function setFaceColor(faceIndex, color){
		intersected.object.geometry.faces[faceIndex].color.set(new THREE.Color(color));
		var adjacent_face_index = faceIndex % 2 == 0 ? faceIndex + 1 : faceIndex -1;
		intersected.object.geometry.faces[adjacent_face_index].color.set(new THREE.Color(color));
		intersected.object.geometry.colorsNeedUpdate = true;
	}

  //only highlight tiles, not point match lines
	if ( intersections.length > 0 && intersections[0].object.type != "LineSegments") {
		if (intersected){
			//revert old object to its original color
			setFaceColor(intersected.faceIndex, old_color);
			old_color = null;
		}
		intersected = intersections[ 0 ];
		if (!old_color){ //only set old_color once
			old_color = intersected.object.geometry.faces[intersected.faceIndex].color.getHex()
		}
		setFaceColor(intersected.faceIndex, highlight_color);

	}else if (intersected){ //there are no current zintersections, but there was a previous intersection
		//revert old object to its original color
		setFaceColor(intersected.faceIndex, old_color);
		intersected = null;
		old_color = null;
	}

}

function animate() {
	requestAnimationFrame( animate );
	render();
	controls.update();
}

function render() {
	renderer.render( scene, camera );
}

//TODO use a library for this
//returns a list of hex values representing the interpolated gradient
function rgbGradient(start_color, end_color, steps){
	// Converts a hex string into an [r,g,b] array
	var h2r = function(hex) {
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? [
			parseInt(result[1], 16),
			parseInt(result[2], 16),
			parseInt(result[3], 16)
		] : null;
	};

	// Inverse of the above
	var r2h = function(rgb) {
		return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
	};

	var _interpolateColor = function(color1, color2, factor) {
		if (arguments.length < 3) {
			factor = 0.5;
		}
		var result = color1.slice();
		for (var i = 0; i < 3; i++) {
			result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
		}
		return result;
	};

	var scol = h2r(start_color);
	var	ecol = h2r(end_color);

	var retval = [];
	var factor_step = 1/(steps-1);
	for ( var idx = 0; idx < steps; idx ++ ) {
			var icol = _interpolateColor(scol, ecol, factor_step * idx);
			var hcol = r2h(icol);
			retval.push(hcol);
	}
	return retval;
}

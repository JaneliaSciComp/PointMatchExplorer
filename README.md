# PointMatchExplorer
Point Match Explorer is a web app that supports visualization of tile specifications and corresponding 
match data hosted by a [render web services](https://github.com/saalfeldlab/render) instance. 
PME utilizes React/Redux for the front-end and  Three.js to render the visualization. 

To build
---------

1. install npm (only first time )
2. clone the repository (only first time)
3. cd into the root of the respository
4. run the following:

```
    npm install # only needed initially or if dependencies change.
    npm run dist
```

To Develop
----------
Repeat build process, but run the following instead of ```npm run dist```:

```
    npm run devserver
```

The app is now available at the specified address. Webpack will watch for changes
and recompile the bundle, so simply refresh your browser after updating the code.

Functionality
--------------

Key/mouse mapping:

- hold down left mouse button and move to rotate
- hold down right mouse button and move to pan
- scroll to zoom
- click on tile to highlight it and its point matches
- shift click on a tile to highlight all tiles and point matches of that tile's section
- command + click on a tile to view its section in Catmaid, zoomed in on that tile
- ctrl+click on a tile to view match data for the tile and its neighboring tiles
- after selecting (clicking) one tile, hold p key and click second tile to view match data for the tile pair

## Author Information
PointMatchExplorer was originally written by Jenny Xing and Alex Weston.

## Contributors
- Eric Trautman

[![Janelia Research Campus](images/hhmi_janelia_transparentbkgrnd.png)](http://www.janelia.org)

[Scientific Computing](http://www.janelia.org/research-resources/computing-resources)

[Janelia Research Campus](http://www.janelia.org)

[Howard Hughes Medical Institute](http://www.hhmi.org)  

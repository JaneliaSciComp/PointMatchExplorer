# PointMatchExplorer
Point Match Explorer is a web app that aids in stitching of images from flyTEM with a visualization
of point matches between tiles. 
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
- ctrl+click on a tile to view a grayscale png image of the tile and its neighbors

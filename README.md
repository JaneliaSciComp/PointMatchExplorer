# PointMatchExplorer
Point Match Explorer is a web app that aids in stitching of images from flyTEM with a visualization
of point matches between tiles. 
PME utilizes React/Redux for the front-end and  Three.js to render the visualization. 

To build
---------
install npm
install webpack globally
clone the repository
cd into the root of the respository

    >npm install
    >webpack

Currently, PME cannot be developed locally because it requires flyTEM data from the server.
Therefore, it needs to be deployed to the 'renderer' server for testing.
It is recommended to use webpack and build everything locallly, then copy bundle.js and index.js to renderer for deployment. 
To deploy into production:

    > webpack --display-error-details
    > rsync -av bundle.js [YOUR USERNAME HERE]@vm543:/opt/local/jetty_base/webapps/pme/bundle.js

Functionality
--------------

hold down left mouse button and move to rotate
hold down right mouse button and move to pan
scroll to zoom
click on tile to highlight it and its point matches
shift click on a tile to highlight all tiles and point matches of that tile's section
command + click on a tile to view its section in Catmaid, zoomed in on that tile
ctrl+click on a tile to view a grayscale png image of the tile and its neighbors

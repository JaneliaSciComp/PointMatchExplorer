/*eslint no-console:0 */
'use strict';
require('core-js/fn/object/assign');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const config = require('./webpack.config');
const open = require('open');

/**
 * Flag indicating whether webpack compiled for the first time.
 * @type {boolean}
 */
let isInitialCompilation = true;

const compiler = webpack(config);

new WebpackDevServer(compiler, config.devServer)
.listen(config.devServer.port, 'localhost', (err) => {
  if (err) {
    console.log(err);
  }
  console.log('Listening at localhost:' + config.devServer.port);
});

compiler.hooks.done.tap('MyPlugin', (context, entry) => {
  if (isInitialCompilation) {
    // Ensures that we log after webpack printed its stats (is there a better way?)
    setTimeout(() => {

      const renderDevHost = 'renderer-dev.int.janelia.org%3A8080';
      const renderParameters = '/?renderDataHost=' + renderDevHost + '&dynamicRenderHost=' + renderDevHost +
                               '&catmaidHost=renderer-catmaid.int.janelia.org%3A8000';

      const baseUrl = 'http://localhost:' + config.devServer.port;
      const iframeUrl = baseUrl + '/webpack-dev-server' + renderParameters;
      const inlineUrl = baseUrl + renderParameters;

      const matchParameters = '&matchOwner=flyTEM&matchCollection=FAFB_montage_fix';
      const stackParameters = '&renderStackOwner=flyTEM&renderStackProject=FAFB_montage&renderStack=v15_montage';
      const zParameters = '&startZ=27&endZ=27';

      console.log('\n✓ The bundle is now ready for serving!\n');
      console.log('  Open in iframe mode:\t\x1b[33m%s\x1b[0m', iframeUrl + '\n');
      console.log('  Open in inline mode:\t\x1b[33m%s\x1b[0m', inlineUrl + '\n');
      console.log('  Test parameters:\t  \x1b[33m%s\x1b[0m', matchParameters + stackParameters + zParameters + '\n');
      // console.log('  \x1b[33mHMR is active\x1b[0m. The bundle will automatically rebuild and live-update on changes.')
    }, 350);
  }
  isInitialCompilation = false;
});

// entry point of the library

var core = require('./modules/core');
var logging = require('./modules/logging');

module.exports = {
  interpretScrapingDirective: core.interpretScrapingDirective,
  log: logging.log
};

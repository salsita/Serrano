// entry point of the library

var core = require('./modules/core');
var logging = require('./modules/logging');

module.exports = {
  interpretScrapingDirective: core.interpretScrapingDirective,
	interpretScrapingUnit: core.interpretScrapingUnit,
	scrapeUnit: core.interpretScrapingUnit,
  logging: logging.publicApi
};

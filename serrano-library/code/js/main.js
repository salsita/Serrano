// entry point of the library

var core = require('./modules/core');
var document = require('./modules/scrapingDocument');
var logging = require('./modules/logging');

module.exports = {
  logging: {
    setOptions: logging.setOptions,
    log: logging.log
  },
  document: {
    load: document.loadDocument,
    unload: document.unloadDocument,
    getUnit: document.getScrapingUnit
  },
  engine: {
    scrapeUnit: core.interpretScrapingUnit
  },
  testing: {
    scrapeDirective: core.interpretScrapingDirective
  },
  utils: {
    getSecondLevelDomain: document.getSecondLevelDomain
  }
};

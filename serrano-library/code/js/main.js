// entry point of the library

var scrapingUnit = require('./modules/scrapingUnit');
var document = require('./modules/scrapingDocument');
var engine = require('./engine')
var interpreter = require('./modules/interpreter');
var logging = require('./modules/logging');

module.exports = {
  logging: {
    config: logging.config,
    log: logging.log
  },
  document: {
    load: document.loadDocument,
    unload: document.unloadDocument,
    getUnit: document.getScrapingUnit
  },
  engine: engine,
  testing: {
    scrapeDirective: interpreter.interpretScrapingDirective
  },
  utils: {
    getSecondLevelDomain: document.getSecondLevelDomain
  }
};

// entry point of the library

var scrapingUnit = require('./modules/scrapingUnit');
var document = require('./modules/globalDocument');
var engine = require('./modules/engine');
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
    getRules: document.getRules
  },
  engine: engine,
  testing: {
    scrapeDirective: interpreter.interpretScrapingDirective
  }
};

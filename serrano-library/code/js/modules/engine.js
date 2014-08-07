/**
 * Created by tomasnovella on 8/7/14.
 */

var _ = require('../libs/lodash');
var interpreter = require('./interpreter');
var scrapingUnit = require('./scrapingUnit');
/**
 * This object contains all the scrapingUnit and actions bound to a given URI.
 */
var rules;


function exec() { // todo context.storage??? ->transfer further...
  var action;
  var templateContext = {};

  if (arguments.length === 0) { // exec()
    action = rules.actions;
  } else if (arguments.length === 1) { // exec(<templateContext>) and exec(act_name)
    if (typeof (arguments[0]) === 'string'){ // exec(act_name)
      action = rules.actions[arguments[0]];
    } else { // exec(<templateContext>)
      templateContext = arguments[0];
    }
  } else if(arguments.length === 2) {   // exec(act_name, <templateContext>);
    action = rules.actions[arguments[0]];
    templateContext = arguments[0];
  }

  var context = interpreter.createContext();
  context.template = templateContext;

  return interpreter.interpretScrapingDirective(action, context);
}

function scrape() {
  var unit;

  if (arguments.length === 0) { // scrape()
    unit = rules.scraping;
  } else if(arguments.length === 1) {
    unit = rules.scraping[arguments[0]]
  }
  return scrapingUnit.scrapeUnit(unit);
}

module.exports = {
  setRules: function(different) {rules = different;},
  exec: exec,
  scrape: scrape
};

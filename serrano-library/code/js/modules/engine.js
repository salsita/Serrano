/**
 * Created by tomasnovella on 8/7/14.
 */

var interpreter = require('./interpreter');
var scrapingUnit = require('./scrapingUnit');

/**
 * This object contains all the scraping units and actions bound to a given URI.
 * See the official spec or the unit tests for more information.
 */
var rules;

/**
 * Selects the action from the rules object. Then executes it.
 * @param {string}[actName] Name of the action within the rules object.
 * @param {Object} [templateContext]
 * @throws Error when the action is not found.
 */
function exec() {
  var action;
  var templateContext;

  if (!rules.actions) {
    throw new Error('no action found in the rules object');
  }
  if (arguments.length === 0) { // exec()
    action = rules.actions;
    templateContext = {};
  } else if (arguments.length === 1) { // exec(<templateContext>) and exec(act_name)
    if (typeof (arguments[0]) === 'string') { // exec(act_name)
      action = rules.actions[arguments[0]];
      templateContext = {};
    } else { // exec(<templateContext>)
      action = rules.actions;
      templateContext = arguments[0];
    }
  } else if(arguments.length === 2) {   // exec(act_name, <templateContext>);
    action = rules.actions[arguments[0]];
    templateContext = arguments[1];
  }

  var context = interpreter.createContext();
  context.template = templateContext;
  if (!action || typeof(templateContext)!== 'object') {
    throw new Error('No valid action/templateContext selected from the rules object. ' +
      'Arguments array-like object of exec function: '+ JSON.stringify(arguments) +
      '. Template supplied:'+JSON.stringify(templateContext)+'. Rules object: ' +
      JSON.stringify(rules));
  }
  return interpreter.interpretScrapingDirective(action, context);
}

/**
 * Selects the scraping unit from the rules object and scrapes it.
 * @param {string} [scrapName] Name of the scraping unit.
 * @returns {Promise} Returns a promise containing scraped data.
 * @throws Error when the scraping unit is not found.
 */
function scrape(scrapName) {
  var unit;
  if (!rules || !rules.scraping) {
    throw new Error('No scraping units found in the rules object');
  }
  if (!scrapName) { // scrape()
    unit = rules.scraping;
  } else { // scrape(unit_name)
    unit = rules.scraping[arguments[0]];
  }

  if (!unit || !unit.result) {
    throw new Error('No unit selected from the rules object. ' +
      'Arguments array-like object of the scrape function:' + JSON.stringify(arguments) +
      '. Rules object: '+ JSON.stringify(rules));
  }
  return scrapingUnit.scrapeUnit(unit);
}

module.exports = {
  setRules: function(different) {rules = different;}, // context setter
  exec: exec,
  scrape: scrape
};

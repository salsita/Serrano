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
 * Fetches a correct object from the container.
 * Container is specified in the doc.
 * For now we have only 2 containers: 'actions' and 'scraping' containers
 * within the rules object.
 * @param container
 * @param args
 * @returns {{object: *, templateContext: *}}
 * @example
 * // very brief container examples
 * container1 = {"name1": ["!constant", 123], "name2": ["!constant", 456]};
 * container2 = ["!constant", 123]
 */
function lookUpObjectInContainer(container, args) {
  var object;
  var templateContext;

  if (!container) {
    throw new Error('No object found in the rules object');
  }
  if (args.length === 0) { // exec()
    object = container;
    templateContext = {};
  } else if (args.length === 1) { // exec(<templateContext>) and exec(act_name)
    if (typeof (args[0]) === 'string') { // exec(act_name)
      object = container[args[0]];
      templateContext = {};
    } else { // exec(<templateContext>)
      object = container;
      templateContext = args[0];
    }
  } else if (args.length === 2) { // exec(act_name, <templateContext>);
    object = container[args[0]];
    templateContext = args[1];
  }
  return {object: object, templateContext: templateContext};
}
/**
 * Selects the action from the rules object. Then executes it.
 * @param {string}[actName] Name of the action within the rules object.
 * @param {Object} [templateContext]
 * @throws Error when the action is not found.
 */
function exec() {
  var __ret = lookUpObjectInContainer(rules.actions, arguments);
  var action = __ret.object;
  var templateContext = __ret.templateContext;

  var context = interpreter.createContext();
  context.template = templateContext;
  if (!action || typeof(templateContext) !== 'object') {
    throw new Error('No valid action/templateContext selected from the rules object. ' +
      'Arguments array-like object of exec function: ' + JSON.stringify(arguments) +
      '. Template supplied:' + JSON.stringify(templateContext) + '. Rules object: ' +
      JSON.stringify(rules));
  }
  return interpreter.interpretScrapingDirective(action, context);
}

/**
 * Selects the scraping unit from the rules object and scrapes it.
 * @param {string}[actName] Name of the action within the rules object.
 * @param {Object} [templateContext]
 * @returns {Promise} Returns a promise containing scraped data.
 * @throws Error when the scraping unit is not found.
 */
function scrape() {
  var __ret = lookUpObjectInContainer(rules.scraping, arguments);
  var unit = __ret.object;
  var templateContext = __ret.templateContext;
console.log('context'+JSON.stringify(templateContext));
  if (!unit || !unit.result) {
    throw new Error('No unit selected from the rules object. ' +
      'Arguments array-like object of the scrape function:' + JSON.stringify(arguments) +
      '. Rules object: '+ JSON.stringify(rules));
  }
  var context = interpreter.createContext();
  context.template = templateContext;
  return scrapingUnit.scrapeUnit(unit, context);
}

module.exports = {
  setRules: function(different) {rules = different;}, // context setter
  exec: exec,
  scrape: scrape
};

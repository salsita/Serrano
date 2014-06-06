/**
 * Created by tomasnovella on 5/12/14.
 */

var _ = require('../libs/lodash');
var depthChecker = require('./depthChecker');
var simplifier = require('./simplifier');
var evaluator = require('./evaluator');

/**
 * Context in which the commands are executed.
 * (todo: Temporary solution.)
 */
var context = {storage: {}};

/**
 * Gets one raw scraping directive. Checks for the depth, simplifies and runs it.
 * Don't forget, it manipulates with the global storage object.
 * @param directive Directive to run
 * @param [implicitArgument] Optional implicit argument.
 * @returns The return value of the instruction.
 */
function interpretScrapingDirective(directive, implicitArgument) {
  if (!depthChecker.isValidDepth(directive)) {
    throw new SyntaxError('Depth of nesting of the instruction is too high');
  }

  var simplified = simplifier.simplifyScrapingDirective(directive);

  return evaluator.evalScrapingDirective(simplified, context, implicitArgument );
}

/**
 * Evaluates the given JSON.
 * @param json Object to evaluate.
 * @returns {Object} Object with the same keys,
 *   but with evaluated values instead of scraping directives.
 */
function fillObject(json) {
  var output = {};
  _.forOwn(json, function(val, key) {
    if (_.isPlainObject(val)) {
      output[key] = fillObject(val);
    } else {
      output[key] = interpretScrapingDirective(val);
    }
  });
  return output;
}

/**
 * Interprets the JSON. TODO will be rewritte...
 * @param json A JSON object to be processed by the Serrano Interpreter.
 * @returns {Object}
 */
function runJson(json) {
  fillObject(json._tmp);
  delete json._tmp;
  return fillObject(json);
}


module.exports = {
  runJson: runJson,
  interpretScrapingDirective: interpretScrapingDirective // used in commands.js
};

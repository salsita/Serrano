/**
 * Created by tomasnovella on 8/7/14.
 */

var _ = require('../libs/lodash');

var depthChecker = require('./depthChecker');
var simplifier = require('./simplifier');
var evaluator = require('./evaluator');
var exceptions = require('./exceptions');
var renderer = require('./instructionTemplateRenderer');

/**
 * Gets one raw scraping directive. Checks for the depth, simplifies and runs it.
 * @param directive Directive to run
 * @param context Context in which the instructions are processed.
 * @param [implicitArgument] Optional implicit argument.
 * @note it throws error in well-reasoned cases and it should not be taken lightly
 * @returns The return value of the instruction.
 */
function interpretScrapingDirective(directive, context, implicitArgument) {
  try {
    if (!depthChecker.isValidDepth(directive)) {
      throw new exceptions.RuntimeError('Depth of nesting of the instruction is too high');
    }
    var rendered = renderer.render(directive, context.template);
    var simplified = simplifier.simplifyScrapingDirective(rendered);
    return evaluator.evalScrapingDirective(simplified, context, implicitArgument);
  } catch (e) {
    e.scrapingDirective = directive;
    e.storage = context.storage;
    e.implicitArgument = implicitArgument;
    throw e;
  }
}

/**
 * Default context 'prototype'.
 * Every time a a unit is scraped a new deep clone of this is created.
 */
var defaultContext = {
  storage: {},
  interpretScrapingDirective: interpretScrapingDirective,
  $: require('../libs/jquery')
};

/**
 * Creates new context based on the `defaultContext` prototype .
 */
function createContext() {
  return _.cloneDeep(defaultContext); // deep clone
}


module.exports = {
  interpretScrapingDirective: interpretScrapingDirective,
  createContext: createContext
};

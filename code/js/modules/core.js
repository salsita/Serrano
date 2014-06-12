/**
 * Created by tomasnovella on 5/12/14.
 */

var _ = require('../libs/lodash');
var depthChecker = require('./depthChecker');
var simplifier = require('./simplifier');
var evaluator = require('./evaluator');
var exceptions = require('./exceptions');

/**
 * Gets one raw scraping directive. Checks for the depth, simplifies and runs it.
 * Don't forget, it manipulates with the global storage object.
 * @param directive Directive to run
 * @param context Context in which the instructions are processed.
 * @param [implicitArgument] Optional implicit argument.
 * @returns The return value of the instruction.
 */
function interpretScrapingDirective(directive, context, implicitArgument) {
  if (!depthChecker.isValidDepth(directive)) {
    throw new SyntaxError('Depth of nesting of the instruction is too high');
  }

  var simplified = simplifier.simplifyScrapingDirective(directive);

  return evaluator.evalScrapingDirective(simplified, context, implicitArgument );
}



function processActions(actions, context) {
  _.forEach(actions, function(action){
    return interpretScrapingDirective(action, context);
  });
}

function processTemp(temp, context) {
  // transform: {name1:tmpVar1, name2:tmpVar2} --> [specialtmpVar1, specialtmpVar2]
  // where specialTmpVar = {name:..., prio:..., code:...}
  var transformed = [];
  _.forEach(temp, function(item, key){
    var transItem = {name: key};
    if (_.isPlainObject(item)) { // {prio:..., code:...}
      transItem.prio = item.prio || 0;
      transItem.code = item.code;
    } else { // just an instruction
      transItem.prio = 0;
      transItem.code = item;
    }
    transformed.push(transItem);
  });

  _.sortBy(transformed, _.property('prio'));

  _.forEach(transformed, function(item){ // setVal...

    var instr = ['!setVal', interpretScrapingDirective(item.code, context), item.name];
    interpretScrapingDirective(instr, context);

  });
}

function processResult(result) {
  if (_.isPlainObject(result)) {
    return _.mapValues(result, function(item){
      return interpretScrapingDirective(item, context);
    });
  } else {
    return interpretScrapingDirective(result, context);
  }
}
function processScrapingUnit(scrapingUnit) {
  var context = { storage: {} };

  // 1. process actions
  var actions = scrapingUnit.actions;
  if (_.isArray(actions)) {
    processActions(actions, context);
  }

  // 2. process temp
  var temp = scrapingUnit.temp;
  if (_.isPlainObject(temp)) {
    processTemp(temp, context);
  }

  // 3. process result
  var result = scrapingUnit.result;
  if (!result) {
    throw new exceptions.RuntimeError('No result defined for the scraping unit');
  }

 return processResult(result);
}

function interpretScrapingUnit(scrapingUnit, doneCallback, failCallback) {
  if (_.isPlainObject(scrapingUnit.waitFor)) {
    var millis = scrapingUnit.waitFor.millis;
    if (_.isUndefined(millis)) {
      millis = 2000;
    }
    if (millis === 0) {
      millis = 1000*3600*24; // one day should suffice
    }
    var waitForSelector = scrapingUnit.waitFor.name;
    function process() {
      var deferred = $.Deferred();

      timer = setInterval(function() {
        if ($(waitForSelector).length) {
          deferred.resolve();
          clearInterval(timer);
        }
      }, 500);

      setTimeout(function() {
        clearInterval(timer);
        deferred.reject();
      }, millis);

      return deferred.promise();
    }
    var promise = process();
    promise.done(function() {
      doneCallback(processScrapingUnit(scrapingUnit));
    }).fail(function(){
        failCallback(scrapingUnit);
    });

  } else { // no waitfor, everything simple
    doneCallback(processScrapingUnit(scrapingUnit));
  }
}
module.exports = {
  test: function(dir) {return interpretScrapingDirective(dir, {storage:{} }); },

  // these four functions are exported only for unit testing
  processActions: processActions,
  processTemp: processTemp,
  processResult: processResult,
  processScrapingUnit: processScrapingUnit,

  interpretScrapingDirective: interpretScrapingDirective, // used in commands.js
  interpretScrapingUnit: interpretScrapingUnit
};

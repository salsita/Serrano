/**
 * Created by tomasnovella on 4/3/14.
 */
var _ = require('../libs/lodash');
var commands = require("./commands");
var argumentCountChecker = require('./argumentCountChecker');
var exceptions = require('./exceptions');

function simplifySelector(selector) {
  var result = [],
    selName = selector[0],
    decorator = selName[0];

  // in every case
  result.push(["!jQuery", selName.substr(1)]);

  switch (decorator) {
    case '~':
      result.push(["!arr"]);
      break;
    case '=':
      result.push(["!call", "text"]);
      break;
  }
  return result;
}

function simplifyInstruction(instruction) {
  var result = [],
    returnsValue = false; // 5 + true = 6,...

  for (var i = 0; i < instruction.length; ++i) {
    var selcmd = instruction[i];

    if (commands.isSelector(selcmd)) {
      result.push(simplifySelector(selcmd));
      returnsValue = true;
    } else if (commands.isCommand(selcmd)) {
      var argcSupplied = selcmd.length - 1 + returnsValue, // -1 for the head==commName
        commName = selcmd[0].substr(1),
        cmd = commands.getCommand(commName),
        signature = cmd.argumentCount;

      if (!argumentCountChecker.checkArgumentCount(argcSupplied, signature)) {
        var msg = "Command " + selcmd[0] + " was supplied with invalid number of arguments";
        throw new exceptions.WrongArgumentError(msg);
      }
      returnsValue = cmd.returnsValue;
      /*global simplifyCommand*/
      result.push(simplifyCommand(selcmd));
    } else {
      throw new TypeError("In instruction, selector or command expected");
    }
  }
  return result;
}

function simplifyCommand(command) {
  var result = [command[0]], // command head stays the same
    commName = command[0].substr(1),
    args = command.slice(1);

  var rawArguments = commands.getCommand(commName).rawArguments;

  for (var i=0; i < args.length; ++i) {
    var arg1 = args[i];
    if (_.isString(arg1) || _.isNumber(arg1) || _.isPlainObject(arg1) || // basic types
      _.contains(rawArguments, i)) { // is raw
      result.push(arg1);
    } else if (commands.isSelector(arg1)) {
      result.push(simplifySelector(arg1));
    } else if (commands.isCommand(arg1)) {
      result.push(simplifyCommand(arg1));
    } else if (commands.isInstruction(arg1)) {
      result.push(simplifyInstruction(arg1));
    } else {
      throw new TypeError("Invalid command argument at position " + i + " for "+ commName);
    }
  }
  return result;
}

/**
 * Initialises commands with right jQuery object.
 * @param $ jQuery object
 */
function init($) {
  commands.init($);
}

/**
 * Initialises commands, including some testCommands. Used for testing.
 * @param $
 */
function testInit($) {
  init($);
  commands.addTestCommands();
}

/**
 * Simplifies the scraping directive so that selectors are transformed into instructions.
 * Additionally, checks for syntactic correctness.
 * Syntactic correctness check means:
 *   1. scraping directive fully corresponds to the grammar of the language
 *   2. every function has a right number of arguments
 * @param directive
 * @returns {*}
 */
function simplifyScrapingDirective(directive) {
  if (commands.isSelector(directive)) {
    return simplifySelector(directive);
  } else if (commands.isCommand(directive)) {
    return simplifyCommand(directive);
  } else if (commands.isInstruction(directive)) {
    return simplifyInstruction(directive);
  } else {
    throw new TypeError("selector/command/instruction expected");
  }
}



module.exports = {
  init: init,
  testInit: testInit,
  simplifyScrapingDirective: simplifyScrapingDirective
};

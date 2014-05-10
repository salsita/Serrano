/**
 * Created by tomasnovella on 4/3/14.
 */
var _ = require('../libs/lodash');
var commands = require('./commands');
var argumentCountChecker = require('./argumentCountChecker');
var exceptions = require('./exceptions');

// takes ['$selector'] returns ['!jQuery', 'selector']
// e.g.2: ['>~$selector'] ->  [['>!jQuery', 'selector'] ['!arr']]
function simplifySelector(selector) {
  var piped = commands.isPipedName(selector[0]),
    removedPipe = selector[0].substr(piped ? 1 : 0),
    decorator = removedPipe[0];

  // in every case
  var jqCommand = [(piped ? '>' : '') + '!jQuery', removedPipe.substr(1)];

  // ['$<sel>'] returns a command
  if (decorator === '$') {
    return jqCommand;
  }

  // ['~<sel>'] and ['=<sel>'] return an instruction
  var result = [jqCommand];
  switch (decorator) {
    case '~':
      result.push(['>!arr']);
      break;
    case '=':
      result.push(['>!call', 'text']);
      break;
  }
  return result;
}

// takes an instruction returns an instruction
// Syntactic check: CANNOT be complete because simplifier doesn't know about
// the implementation of the commands (whether they call evalInstruction(),...)
// to it doesn't check raw arguments that
// further it assumes, that whenever a command/selector is prefixed with '>'
// then it surely gets this implicit argument. (otherwise gets undefined)
function simplifyInstruction(instruction) {
  var result = [];
  for (var i = 0; i < instruction.length; ++i) {
    var selcmd = instruction[i],
      commFullName = selcmd[0],
      piped = commands.isPipedName(commFullName);


    if (commands.isSelector(selcmd)) {
      // simplifySelector returns command or instruction
      result = result.concat(commands.getDecorator(selcmd)==='$' ?
        [simplifySelector(selcmd)] : simplifySelector(selcmd));
    } else if (commands.isCommand(selcmd)) {
      var commName = commands.getCommandName(selcmd[0]),
        signature = commands.getCommand(commName).argumentCount;

      // -1 for the head==commName, +1 if it receives an explicit argument ('>')
      var argcSupplied = selcmd.length - 1 + (piped ? 1 : 0);
      if (!argumentCountChecker.checkArgumentCount(argcSupplied, signature)) {
        var msg = 'Command ' + commFullName + ' was supplied with invalid number of arguments';
        throw new exceptions.WrongArgumentError(msg);
      }
      /*global simplifyCommand*/
      result.push(simplifyCommand(selcmd));
    } else {
      throw new TypeError('In instruction, selector or command expected'+
        ' in' + JSON.stringify(instruction));
    }
  }

  return result;
}

// takes command, returns command
function simplifyCommand(command) {
  var result = [command[0]], // command head stays the same
    commName = commands.getCommandName(command[0]),
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
      throw new TypeError('Invalid command argument at position ' + i + ' for '+ commName);
    }
  }
  return result;
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
    throw new TypeError('selector/command/instruction expected');
  }
}

module.exports = {
  simplifyScrapingDirective: simplifyScrapingDirective
};

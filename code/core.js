/**
 * Created by tomasnovella on 4/17/14.
 */

var jq = require('../libs/jquery');
var _ = require('../libs/lodash');

var commands = require('./commands');
var exceptions = require('./exceptions');

// todo or should I reverse the order of arguments? (as in apply(undefined, ...))
function evalCommand(command, implicitArgument) {
  var args = [],
    commName = command[0].substr(1),
    command = commands.getCommand(commName);

  if (!_.isUndefined(implicitArgument) && implicitArgument != null) {
    args.push(implicitArgument)
  }

  for (var i = 1; i < command.length; ++i) {
    var arg = command[i];
    if (commands.isCommand(arg) && !_.contains(command.rawArguments, i)) {
      args.push(evalCommand(arg));
    } else if (commands.isInstruction(arg)) {
      args.push(evalInstruction(arg));
    } else {
      args.push(arg);
    }
  }

  return command.code.apply(undefined, args);
}

// in the new, simplified grammar, instruction is just a set of commands
function evalInstruction(instruction, implicitArgument) {
  var returnValue = undefined;

  for (var i = 0; i < instruction.length; ++i) {
    var currCommand = instruction[i],
      commName = currCommand[0].substr(1),
      command = commands.getCommand(commName);

    if (!command.implicitForeach ||
      (command.implicitForeach && _.contains(command.rawArguments, 0))) {
      returnValue = evalCommand(currCommand, returnValue);
    } else {
      if (_.isArray(returnValue)) {
        returnValue = _.map(returnValue, function(retVal) {
          evalCommand(currCommand, retVal);
        });
      } else {
        returnValue = evalCommand(currCommand, retVal);
      }
    }
  }
  return returnValue;
}

// TODO, I mean TOTHINKABOUT --- I use the same init() and testInit()
// in simplifier - maybe we could write it only once...

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

module.exports = {
  init: init,
  testInit: testInit,
  evalCommand: evalCommand,
  evalInstruction: evalInstruction
};

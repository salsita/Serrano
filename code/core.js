/**
 * Created by tomasnovella on 4/17/14.
 */

var _ = require('../libs/lodash');
var commands = require('./commands');

/**
 * Evaluates given command.
 * @param cmd Command to evaluate.
 * @param implicitArgument Optional implicit argument.
 * @returns {*} Returns the result of command execution.
 */
function evalCommand(cmd, implicitArgument) {
  var args = [],
    commName = cmd[0].substr(1),
    command = commands.getCommand(commName);

  if (!_.isUndefined(implicitArgument) && implicitArgument !== null) {
    args.push(implicitArgument);
  }

  for (var i = 1; i < cmd.length; ++i) {
    var arg = cmd[i];
    if (_.contains(command.rawArguments, i)) {
      args.push(arg);
    } else if (commands.isInstruction(arg)) {
      /*globals evalInstruction */
      args.push(evalInstruction(arg));
    } else if (commands.isCommand(arg)) {
      args.push(evalCommand(arg));
    } else {
      args.push(arg);
    }
  }

  return command.code.apply(undefined, args);
}

/**
 * Evaluates given instruction.
 * @param instruction Instruction to evaluate.
 * @param implicitArgument Optional implicit argument.
 * @returns {*} Returns the result of the instruction.
 */
function evalInstruction(instruction, implicitArgument) {
  // instruction after simplification is just an array of commands
  for (var i = 0; i < instruction.length; ++i) {
    var currCommand = instruction[i],
      commName = currCommand[0].substr(1),
      command = commands.getCommand(commName);

    if (!command.implicitForeach ||
      (command.implicitForeach && _.contains(command.rawArguments, 0))) {
      implicitArgument = evalCommand(currCommand, implicitArgument);
    } else {
      if (_.isArray(implicitArgument)) {
        /*jshint -W083 */ // for jshint: Don't make functions within a loop.
        implicitArgument = _.map(implicitArgument, function(retVal) {
          return evalCommand(currCommand, retVal);
        });
      } else {
        implicitArgument = evalCommand(currCommand, implicitArgument);
      }
    }
  }
  return implicitArgument;
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

module.exports = {
  init: init,
  testInit: testInit,
  evalInstruction: evalInstruction
};

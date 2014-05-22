/**
 * Created by tomasnovella on 4/17/14.
 */

var _ = require('../libs/lodash');
var argumentCountChecker = require('./argumentCountChecker');
var commands = require('./commands');

/**
 * Evaluates given command.
 * @param cmd Command to evaluate.
 * @param [implicitArgument] Optional implicit argument. If the command is not
 *   piped, ignore the implicit argument.
 * @returns {*} Returns the result of command execution.
 */
function evalCommand(cmd, implicitArgument) {
  var args = [],
    piped = commands.isPipedName(cmd[0]),
    commName = commands.getCommandName(cmd[0]),
    command = commands.getCommand(commName);

  if (piped) {
    args.push(implicitArgument);
  }

  for (var i = 1; i < cmd.length; ++i) {
    var arg = cmd[i];
    if (argumentCountChecker.checkArgumentCount(i, command.rawArguments)) {
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

  return command.code.apply(commands.getCommands(), args);
}

/**
 * Evaluates given instruction.
 * @param instruction Instruction to evaluate. Must be simplified.
 * @param [implicitArgument] Optional implicit argument.
 * @returns {*} Returns the result of the instruction.
 */
function evalInstruction(instruction, implicitArgument) {
  var currCommand; // currCmd is only used within the loop
  function _mapper(item) { return evalCommand(currCommand, item); }


  // instruction after simplification is just an array of commands
  for (var i = 0; i < instruction.length; ++i) {
    currCommand = instruction[i];
    var commName = commands.getCommandName(currCommand[0]),
      command = commands.getCommand(commName);



    if (!argumentCountChecker.checkArgumentCount(0, command.rawArguments) && command.implicitForeach  &&
      _.isArray(implicitArgument)) {
      implicitArgument = _.map(implicitArgument, _mapper);
    } else {
      implicitArgument = evalCommand(currCommand, implicitArgument);
    }

  }
  return implicitArgument;
}

/**
 * Evaluated given scraping directive (can be either a command or an instruction).
 * @param directive Directive to evaluate. Must be simplified.
 * @param [implicitArgument]
 * @returns {*}
 */
function evalScrapingDirective(directive, implicitArgument) {
  if (commands.isInstruction(directive)) {
    return evalInstruction(directive, implicitArgument);
  } else if (commands.isCommand(directive)) {
    return evalCommand(directive, implicitArgument);
  }
}

module.exports = {
  evalScrapingDirective: evalScrapingDirective
};

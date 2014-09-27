/**
 * Created by tomasnovella on 4/17/14.
 */

var _ = require('../libs/lodash');
var argumentCountChecker = require('./argumentCountChecker');
var commands = require('./commands');

/**
 * Evaluates given command.
 * @param cmd Command to evaluate.
 * @param context Context in which the command runs.
 * @param [implicitArgument] Optional implicit argument. If the command is not
 *   piped, ignore the implicit argument.
 * @returns {*} Returns the result of command execution.
 */
function evalCommand(cmd, context, implicitArgument) {
  var commandArguments = [context],
    piped = commands.isPipedName(cmd[0]),
    commName = commands.getCommandName(cmd[0]),
    command = commands.getCommand(commName);

  if (piped) {
    commandArguments.push(implicitArgument);
  }

  /**
   * On the zeroth position is the command name, so the first argument starts
   * at position 1.
   */
  var FIRST_ARGUMENT_POSITION = 1;
  for (var i = FIRST_ARGUMENT_POSITION; i < cmd.length; ++i) {
    var arg = cmd[i];

    /**
     * When the command is NOT piped (eg ["!constant", "foo"]) it means that
     * the "foo" is actually on the first position=0 (we count arguments from 0) on the argument list!
     */
    var argumentPositionWithRespectToPiping = i + (piped? 0: -1);

    if (argumentCountChecker.isInRange(argumentPositionWithRespectToPiping, command.rawArguments)) {
      commandArguments.push(arg);
    } else if (commands.isInstruction(arg)) {
      /*global evalInstruction */
      commandArguments.push(evalInstruction(arg, context));
    } else if (commands.isCommand(arg)) {
      commandArguments.push(evalCommand(arg, context));
    } else if (typeof (arg) === "string") {
      var rendered = require('./template').render(arg, context.template);
      commandArguments.push(rendered);
    } else {
      commandArguments.push(arg);
    }
  }

  return command.code.apply(commands.getCommands(), commandArguments);
}

/**
 * Evaluates given instruction.
 * @param instruction Instruction to evaluate. Must be simplified.
 * @param context
 * @param [implicitArgument] Optional implicit argument.
 * @returns {*} Returns the result of the instruction.
 */
function evalInstruction(instruction, context, implicitArgument) {
  var currCommand; // currCmd is only used within the loop
  function _mapper(item) { return evalCommand(currCommand, context, item); }


  // instruction after simplification is just an array of commands
  for (var i = 0; i < instruction.length; ++i) {
    currCommand = instruction[i];
    var commName = commands.getCommandName(currCommand[0]),
      command = commands.getCommand(commName);

    // implicit foreach
    if (!argumentCountChecker.isInRange(0, command.rawArguments) &&
      command.implicitForeach  && _.isArray(implicitArgument)) {
      implicitArgument = _.map(implicitArgument, _mapper);
    } else {
      implicitArgument = evalCommand(currCommand, context, implicitArgument);
    }

  }
  return implicitArgument;
}

/**
 * Evaluated given scraping directive (can be either a command or an instruction).
 * @param directive Directive to evaluate. Must be simplified.
 * @param context Context in which the scraping directive runs.
 * @param [implicitArgument]
 * @returns {*}
 */
function evalScrapingDirective(directive, context, implicitArgument) {
  if (commands.isInstruction(directive)) {
    return evalInstruction(directive, context, implicitArgument);
  } else if (commands.isCommand(directive)) {
    return evalCommand(directive, context, implicitArgument);
  }
}

module.exports = {
  evalScrapingDirective: evalScrapingDirective
};

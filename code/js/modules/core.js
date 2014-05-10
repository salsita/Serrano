/**
 * Created by tomasnovella on 4/17/14.
 */

var _ = require('../libs/lodash');
var commands = require('./commands');

/**
 * Evaluates given command.
 * @param cmd Command to evaluate.
 * @param implicitArgument Optional implicit argument. If the command is not
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

  return command.code.apply(commands.getCommands(), args);
}

/**
 * Evaluates given instruction.
 * @param instruction Instruction to evaluate.
 * @param implicitArgument Optional implicit argument.
 * @returns {*} Returns the result of the instruction.
 */
function evalInstruction(instruction, implicitArgument) {
  /*globals currCommand*/ // currCmd is only used within the loop
  function _mapper(item) { return evalCommand(currCommand, item); }


  // instruction after simplification is just an array of commands
  for (var i = 0; i < instruction.length; ++i) {
    var currCommand = instruction[i],
      commName = commands.getCommandName(currCommand[0]),
      command = commands.getCommand(commName);

    if (!command.implicitForeach ||
      (command.implicitForeach && _.contains(command.rawArguments, 0))) {
      implicitArgument = evalCommand(currCommand, implicitArgument);
    } else {
      if (_.isArray(implicitArgument)) {
        implicitArgument = _.map(implicitArgument, _mapper);
      } else {
        implicitArgument = evalCommand(currCommand, implicitArgument);
      }
    }
  }
  return implicitArgument;
}


module.exports = {
  evalInstruction: evalInstruction
};

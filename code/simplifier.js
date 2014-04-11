/**
 * Created by tomasnovella on 4/3/14.
 */
var _ = require('../libs/underscore');
var commands = require("./commands");

function isCommandName(name)
{
  return typeof(name) === "string" && name[0] === "!" && name.substr(1) in commands;
}

function isDecoratedName(name)
{

  if (typeof name !== "string")
  {
    return false;
  }

  return  _.contains(["$", "~", "="], name[0]);
}

function stripDecorator(name)
{
  if (!isDecoratedName(name))
  {
    throw new TypeError("Decorator expected. Received " + name);
  }
  return name.substr(1);
}
function isCommand(array)
{
  return _.isArray(array) && array.length !== 0 && isCommandName(array[0]);
}

function isInstruction(array)
{
  return _.isArray(array) && array.length !== 0 &&
    (_.isArray(array[0]) || isDecoratedName(array[0]));
}
/*global simplify */
// command types:
// if in the head of instruction, then ["!commName", <arg>, <arg>,...]
// else also: "!commName"
// Note: <arg> may be an instruction or command
function simplifyCommand(cmd)
{
  var commandName = cmd[0].substr(1);

  var ret = [];
  for(var i = 0; i < cmd.length; ++i)
  {
    // if the argument should be passed raw, pass it that way
    if (_.contains(commands[commandName].rawArguments, i))
    {
      ret.push(cmd[i]);
    } else
    {
      if (_.isArray(cmd[i]))
      {
        ret.push(simplify(cmd[i]));
      } else // numeric/string/whatever
      {
        ret.push(cmd[i]);
      }
    }
  }

  return ret;
}
// instruction types:
// 1. ["$something",<command>, <command>,...]
// 2. ["~somthing", <command>, <command>,...]
// 3. ["=somthing", <command>, <command>,...]
// 4. [<command>, <command>, <command>,...]
function simplifyInstruction(instr)
{
  var ret = [];

  // let's start with the head
  var head = instr[0];
  // cases 1. 2. and 3.
  if (isDecoratedName(head))
  {
    // always done by default (for all decorators)
    ret.push(["!jQuery", stripDecorator(head)]);
    switch (head[0])
    {
      case "~":
        ret.push(["!arr"]);
        break;
      case "=":
        ret.push(["!call", "text"]);
        break;
    }
  } else // case 4.
  {
    if (isCommand(head))
    {
      ret.push(simplifyCommand(head));
    } else
    {
      throw new TypeError("Command expected. Received "+ head.toString());
    }
  }
  for (var i = 1; i < instr.length; ++i)
  {
    if (isCommandName(instr[i])) // "!lower" -> ["!lower"]
    {
      ret.push([instr[i]]);
    } else if (isCommand(instr[i])) // ["!lower"]
    {
      ret.push(simplifyCommand(instr[i]));
    } else
    {
      throw new TypeError("Command expected. Received "+ instr[i].toString());
    }
  }

  return ret;
}

function simplify(instr)
{
  if (isCommand(instr))
  {
    return simplifyCommand(instr);
  } else if (isInstruction(instr))
  {
    return simplifyInstruction(instr);
  } else
  {
    throw new TypeError("Valid command or instruction expected. Received "+ instr.toString());
  }
}

module.exports.simplify = simplify;

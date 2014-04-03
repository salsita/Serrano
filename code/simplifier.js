/**
 * Created by tomasnovella on 4/3/14.
 */

function isCommandName(name)
{
  return typeof(name) === "string" && name[0] == "!";
}

function isDecoratedName(name)
{
  if (typeof name !== "string")
    return false;

  return $.inArray(name[0], ["$", "~", "="]);
}

function stripDecorator(name)
{
  if (!isDecoratedName(name))
    throw new TypeError("Not a decorator!");
  return name.substr(1);
}
function isCommand(array)
{
  return $.isArray(array) && array.length != 0 && isCommandName(array[0]);
}

function isInstruction(array)
{
  return $.isArray(array) && array.length != 0 &&
    ($.isArray(array[0]) || isDecoratedName(array[0]));
}

function simplifyCommand(cmd)
{
  var commandName = cmd[0].substr(1);
  if (!commands.hasOwnProperty(commandName))
    throw NotImplementedError(cmd[0]);

  var ret = [];
  for(var i = 0; i < cmd.length; ++i)
  {
    // if the argument should be passed raw, pass it that way
    if ($.inArray(i, commands[commandName].raw))
      ret.push(cmd[i]);
    else
    {
      if ($.isArray(cmd[i]))
        ret.push(simplify(cmd[i]));
      else // numeric/string/whatever
        ret.push(cmd[i]);
    }
  }

  return ret;
}

function simplifyInstruction(instr)
{
  var ret = [];

  // let's start with the head
  var head = instr[0];
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
  } else
  {
    if (isCommand(head))
      ret.push(simplifyCommand(head));
    else
      throw new TypeError("simplifyInstruction gets some non-command");
  }
  for (var i = 1; i < instr.length; ++i)
  {
    if (isCommandName(instr[i])) // "!lower" -> ["!lower"]
      ret.push([instr[i]]);
    else if(isCommand(instr[i]))
      ret.push(simplifyCommand(instr[i]));
  }

  return ret;
}

function simplify(instr)
{
  if (isCommand(instr))
  {
    return simplifyCommand(instr);
  } else if(isInstruction(instr))
  {
    return simplifyInstruction(instr);
  } else
    throw new TypeError("It's neither a command nor an instruction!")
}
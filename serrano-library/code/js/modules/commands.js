var _ = require('../libs/lodash');
var exceptions = require('./exceptions');



/**
 * Set of commands in use.
 * We can manipulate with this object using addCommands() and init() functions.
 */
/**
 * All the commands have the following format:
 * 'command name': {
 *   argumentCount: (default='') number of arguments a command takes. Denoted as a string in a format
 *     used when specifying pages to be printed e.g. '1,3-8, 10, 13-'
 *   implicitForeach: (default=true) if the return value of the previous function is array ->
 *     decides whether pass it as it is, or run an implicit foreach
 *   rawArguments: (default='') array of argument positions that should be passed
 *     raw (without preprocessing) -> those at that positions there are ARRAYS that we
 *     do not want to preprocess
 *   code: Function (the code of the function itself)
 * }
 *
 * Note: sometimes a function can have conflicting attributes,
 *   i.e. implicitForeach==true and 0 is in rawArguments 'array'.
 *   In that case, rawArguments application has higher priority, i.e it functions the same
 * as if implicitForeach would be set to false.
 */

var commands = {};

/**
 * Contains all the default values for a command
 */
var commandDefaults = {
  argumentCount: '',
  implicitForeach: true,
  rawArguments: '',
  code: function() {
    throw new exceptions.NotImplementedError();
  }
};



/**
 * In case some commands properties are not explicitly filled,
 * set their default according to commandDefaults object.
 * @private
 * @param {Object} commands Commands.
 * @returns {Object} Commands with default properties.
 */
function setDefaultCommandProperties(commands) {
  var result = {};
  _.forOwn(commands, function(cmdBody, cmdName){
    result[cmdName] = _.extend({}, commandDefaults, cmdBody);
  });
  return result;
}


/**
 * Adds another set of commands into the set of available commands.
 * @param {Object} commands The set of commands.
 */
function addCommands(commandSet) {
  var defaults = setDefaultCommandProperties(commandSet);
  _.forOwn(defaults, function(commBody, commName){
    commands[commName] = commBody;
  });
}

/**
 * Creates a completely new command set.
 * @param different Array of available commands .
 */
function setCommands(different) {
  commands = {};
  addCommands(different);
}

/**
 * Initializes the command set with the built-in commands.
 */
function init() {
  var builtinCommands = require('./commandSets/builtinCommands'),
      magnetoCommands = require('./commandSets/magnetoCommands');

  setCommands(builtinCommands);
  addCommands(magnetoCommands);

  // add synonyms
  commands.and = commands.all;
  commands.or = commands.any;
  commands['>and'] = commands['>all'];
  commands['>or'] = commands['>any'];
}
// 'init' - add basic commands to use
init();

// utility functions
/**
 * Checks whether a command/selector starts with a '>'. Longer sequences of '>'
 * are not allowed.
 * @param {String} name Potential command/selector name with all the prefixes/decorators,...
 * @returns {boolean} True, if command/selector starts with a pipe.
 */
function isPipedName(name) {
  return typeof(name) === 'string' && name[0] === '>' && name[1] !== '>';
}

/**
 * Retrieves a proper command name that is found in the `commands` object.
 * @param {String} Potential command name used in the instruction.
 * @returns {String| undefined} Corresponding command name.
 */
function getCommandName(commandName) {
  if (typeof (commandName) !== 'string' || commandName.length < 2) {
    return;
  }

  var piped = isPipedName(commandName);

  // '>!command' or '!command' => '>command' or 'command', respectively
  var  removedExclamationMark = piped ? (commandName.substr(0,1)+commandName.substr(2)) :
    commandName.substr(1);

  if (piped) { // '>cmd' searches for '>cmd' and 'cmd'
    if (commands[removedExclamationMark]) {
      return removedExclamationMark;
    } else if (commands[removedExclamationMark.substr(1)]) {
      return removedExclamationMark.substr(1);
    }
  } else { // cmd searches for 'cmd'
    if (commands[removedExclamationMark]) {
      return removedExclamationMark;
    }
  }
}

/**
 * Checks whether it starts with a decorator. Decorators are '$', '~', and '='.
 * @private
 * @param {string} name
 * @returns {boolean}
 */
function isDecoratedName(name) {
  return (typeof(name) === 'string' && _.contains(['$', '~', '='], name[0])) ||
    (isPipedName(name) && isDecoratedName(name.substr(1)));
}

/**
 * Checks if the given array looks like a command (has a valid command name in the head).
 * @param command
 * @returns {boolean}
 */
function isCommand(command) {
  return _.isArray(command) && command.length !== 0 && undefined !== getCommandName(command[0]);
}

/**
 * Returns the decorator of the selector.
 * @param selector
 * @returns {Char} The decorator. ('$' or '=' or '~')
 */
function getDecorator(selector) {
  var selName = selector[0],
    piped = isPipedName(selName);

  return selName[piped? 1 : 0];
}
/**
 * Checks whether the argument is a selector.
 * @param selector Potential selector.
 * @returns {boolean}
 */
function isSelector(selector) {
  return _.isArray(selector) && selector.length === 1 && isDecoratedName(selector[0]);
}


/**
 * Checks whether the argument is a valid instruction.
 * @param array Potential instruction.
 * @returns {boolean}
 */
function isInstruction(array) {
  return _.isArray(array) && array.length !== 0 &&
    _.all(array, function(item){
      return isSelector(item) || isCommand(item);
    });
}


module.exports = {
  init: init, // only needed when we need to refresh commands from scratch
  addCommands: addCommands,
  setCommands: setCommands,
  getCommand: function(command) { return commands[command]; },
  getCommands: function() {return commands;},

  isPipedName: isPipedName,
  getCommandName: getCommandName,
  isCommand: isCommand,
  getDecorator: getDecorator,
  isSelector: isSelector,
  isInstruction: isInstruction
};

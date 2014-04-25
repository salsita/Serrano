var jq = require('../libs/jquery');
var _ = require('../libs/lodash');

var exceptions = require('./exceptions');

/**
 * Container used for storing all the variables and values from scraping directives.
 * Functions like getVal and setVal have direct access to this object.
 *
 * @type {{}}
 */
var storage = {};

/**
 * Set of commands in use.
 * We can manipulate with this object using addCommands() and init() functions.
 * @type {{}}
 */
var commands = {};

/**
 * Contains all the default values for a command
 * @type {{argumentCount: string, implicitForeach: boolean, rawArguments: Array,
 *   returnsValue: boolean}}
 */
var commandDefaults = {
  argumentCount: '',
  implicitForeach: true,
  rawArguments: [],
  returnsValue: true,
  code: function() {
    throw new exceptions.NotImplementedError();
  }
};

/**
 * Contains all the available functions in the following format:
 * 'function name': {
 *   argumentCount: number of arguments a command takes. Denoted as a string in a format
 *     used when specifying pages to be printed e.g. '1,3-8, 10, 13-'
 *   implicitForeach: (default) true // if the return value of the previous function is array ->
 *     decides whether pass it as it is, or run an implicit foreach
 *   rawArguments: (default)[] // array of argument positions that should be passed raw (without preprocessing) ->
 *     those at that positions there are ARRAYS that we do not want to preprocess
 *   returnsValue: (default) true // indicates whether a command returns a value
 *   code: Function (the code of the function itself)
 * }
 */
var builtinCommands = {
  getVal: {
    argumentCount: '1',
    code: function(key) {
      if (storage.hasOwnProperty(key)) {
        return storage[key];
      } else {
        throw new exceptions.WrongArgumentError('getVal '+ key +' no value found');
      }
    }
  },

  setVal: {
    argumentCount: '2',
    code: function(key, value) {
      storage[key] = value;
      return storage[key];
    }
  },


  lower: {
    argumentCount: '1',
    code: function(arg) {
      return arg.toLowerCase();
    }
  },

  upper: {
    argumentCount: '1',
    code: function(arg) {
      return arg.toUpperCase();
    }
  },

  // conditions
  lt: {
    argumentCount: '2',
    code: function(left, right) {
      return left < right;
    }
  },
  le: {
    argumentCount: '2',
    code: function(left, right) {
      return left <= right;
    }
  },
  gt: {
    argumentCount: '2',
    code: function(left, right) {
      return left > right;
    }
  },
  ge: {
    argumentCount: '2',
    code: function(left, right) {
      return left >= right;
    }
  },

  at: {
    argumentCount: '1-',
    implicitForeach: false,
    rawArguments: [1],
    code: function(array, index) {
      // here we have a list of indices
      if (_.isArray(index)) {
        var resolvedElements = [];
        _(index).forEach(function(i) {
          var el = array[i];
          if (typeof el !== 'undefined') {
            resolvedElements.push(el);
          }
        });
        return resolvedElements;
      } else { // isInt
        return array[index];
      }
    }
  },

  concat: {
    argumentCount: '1-',
    implicitForeach: false,
    code: function(pieces, glue) {
      glue = typeof glue !== 'undefined' ? glue : ' '; // default glue is ' '
      return pieces.join(glue);
    }
  },

  replace: {
    argumentCount: '3',
    code: function (str, old, n) {
      return str.replace(old, n);
    }
  },
  noop: {
    argumentCount: '0,1',
    returnsValue: false,
    code : function() {
      return undefined;
    }

  },

  filter: { // will be rewritten
    rawArguments: [1],
    code: function(obj, condition) {
      condition=0;
      //return evaluate([obj, condition]);
    }
  }
};


function JQueryDependentCommands($) {
  return {
    jQuery : {
      argumentCount: '1',
      code: function(obj1, obj2) {
        if (arguments.length === 1) {
          return $(obj1);
        } else { // it's chained
          return $(obj2, obj1);
        }
      }
    },

    // converts a jQuery object into an array - https://api.jquery.com/jQuery.makeArray/
    arr: {
      argumentCount: '1',
      code: function(obj) {
        return $.makeArray(obj);
      }
    }
  };
}

/**
 * These commands are not used in the production version and are used only for
 * testing purposes.
 * @type {{acceptsOneToFiveArguments: {argumentCount: string, code: code}, acceptsZeroToOneArguments: {argumentCount: string, code: code}, secondArgumentIsRaw: {argumentCount: string, rawArguments: number[], code: code}}}
 */
var testCommands = {
  acceptsOneToFiveArguments : {
    argumentCount: '1-5',
    code: function() {
      var args = Array.prototype.slice.call(arguments);
      return args;
    }
  },
  acceptsZeroToOneArguments : {
    argumentCount: '0-1',
    code: function() {
      var args = Array.prototype.slice.call(arguments);
      return args;
    }
  },
  secondArgumentIsRaw: {
    argumentCount: '0-2',
    rawArguments: [2],
    code: function() {
      var args = Array.prototype.slice.call(arguments);
      return args;
    }
  }


};

/**
 * In case some commands properties are not explicitly filled,
 * set their default according to commandDefaults object
 * @param commands
 * @returns {{}}
 */
function setDefaultCommandProperties(commands) {
  var result = {};
  _.forOwn(commands, function(commBody, commName){
    result[commName] = _.extend({}, commandDefaults, commBody);
  });
  return result;
}


/**
 * Adds another set of commands into the set of available commands.
 * @param {object} commands The set of commands.
 */
function addCommands() {
  var commandSets = Array.prototype.slice.call(arguments);

  _.forEach(commandSets, function(commandSet) {
    commandSet = setDefaultCommandProperties(commandSet);
    commands = _.merge(commands, commandSet);
  });
}

/**
 * Used for testing purposes. Adds tests commands.
 */
function addTestCommands() {
  addCommands(testCommands);
}

/**
 * Returns an object that corresponds with a command
 * @param command
 * @returns {*}
 */
function getCommand(command) {
  return commands[command];
}

/**
 * Returns object that contains all the commands.
 * @returns {{}}
 */
function getCommands(){
  return commands;
}

/**
 * Initializes the global object "commands" with builtin commands and jQuery-dependent
 * commands.
 * @param $
 */
function init($) {
  $ = $ || jq;
  commands = {};
  var jQueryDependentCommands = new JQueryDependentCommands($);

  addCommands(jQueryDependentCommands, builtinCommands);
}



// utility functions
/**
 * Checks whether name is a valid command name.
 * @param name Potential comand name.
 * @returns {boolean} True if name is a command name.
 */
function isCommandName(name) {
  return typeof(name) === "string" && name[0] === "!" && name.substr(1) in commands;
}


/**
 * Checks whether it starts with a decorator. Decorators are "$", "~", and "=".
 * @param name
 * @returns {boolean}
 */
function isDecoratedName(name) {
  return typeof(name) === "string" && _.contains(["$", "~", "="], name[0]);
}

/**
 * Checks whether the argument is a selector.
 * @param selector Potential selector.
 * @returns {boolean}
 */
function isSelector(selector) {
  return _.isArray(selector) && selector.length === 1 && isDecoratedName(selector[0][0]);
}

/**
 * Checks whether the argument is a valid command.
 * @param array Potential command.
 * @returns {boolean}
 */
function isCommand(array) {
  return _.isArray(array) && array.length > 0 && isCommandName(array[0]);
}

/**
 * Checks whether the argument is a valid instruction.
 * @param array Potential instruction.
 * @returns {boolean}
 */
function isInstruction(array) {
  return _.isArray(array) && array.length !== 0 &&
    (isSelector(array[0]) || isCommand(array[0]));
}


module.exports = {
  init: init,
  addCommands: addCommands,
  addTestCommands: addTestCommands,
  getCommands: getCommands,
  getCommand: getCommand,


  isCommandName: isCommandName,
  isDecoratedName: isDecoratedName,
  isSelector: isSelector,
  isCommand: isCommand,
  isInstruction: isInstruction
};

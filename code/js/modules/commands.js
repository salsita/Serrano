var $ = require('../libs/jquery');
var _ = require('../libs/lodash');

var storageFactory = require('./storageFactory');
var exceptions = require('./exceptions');
var core; /* defined at the of the file */

/**
 * Default place for storage of helper values, used by setVal and getVal.
 * @type {*}
 */
var storage = storageFactory.createStorage();

/**
 * Set of commands in use.
 * We can manipulate with this object using addCommands() and init() functions.
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
 * Contains all the available functions in the following format:
 * 'function name': {
 *   argumentCount: (default=''_ number of arguments a command takes. Denoted as a string in a format
 *     used when specifying pages to be printed e.g. '1,3-8, 10, 13-'
 *   implicitForeach: (default=true) // if the return value of the previous function is array ->
 *     decides whether pass it as it is, or run an implicit foreach
 *   rawArguments: (default='') // array of argument positions that should be passed
 *     raw (without preprocessing) -> those at that positions there are ARRAYS that we
 *     do not want to preprocess
 *   code: Function (the code of the function itself)
 * }
 *
 * Note: sometimes a function can have conflicting atributes,
 *   i.e. implicitForeach==true and 0 is in rawArguments 'array'.
 *   In that case, rawArguments application has higher priority, i.e it functions the same
 * as if implicitForeach would be set to false.
 */
var builtinCommands = {
  // jQuery-based element(s) selecting
  jQuery : {
    argumentCount: '1-2',
    code: function(obj1, obj2) {
      if (arguments.length === 1) {
        return $(obj1);
      } else { // it's chained
        return $(obj2, obj1);
      }
    }
  },

  // storing and fetching variables
  getVal: {
    argumentCount: '1',
    code: function(key) {
      return storage.getVal(key);
    }
  },

  setVal: {
    argumentCount: '2',
    implicitForeach: false,
    code: function(value, key) {
      return storage.setVal(key, value);
    }
  },
  // conditions
  // existence tests
  'exists': {
    argumentCount: '1',
    code: function(arg) {
      return arg !== undefined && arg !== null;
    }
  },

  'nexists': {
    argumentCount: '1',
    code: function(arg) {
      return !this.exists.code(arg);
    }
  },
  'empty': {
    argumentCount: '1',
    code: function(arg) {
      return typeof(arg) === 'object' &&
        ('length' in arg ? (0 === arg.length) : (0 === Object.keys(arg).length));
    }
  },
  'nempty': {
    argumentCount: '1',
    code: function(arg) {
      return !this.empty.code(arg);
    }
  },

  // comparisons
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
  eq: {
    argumentCount: '2',
    code: function(left, right) {
      /*jslint eqeq: true*/
      return left == right;
    }
  },
  neq: {
    argumentCount: '2',
    code: function(left, right) {
      /*jslint eqeq: true*/
      return left != right;
    }
  },

  // compound conditions
  all: {
    argumentCount: '1-',
    code: function() {
      var args = Array.prototype.slice.call(arguments);
      return _.all(args);
    }
  },
  '>all': {
    argumentCount: '2-',
    rawArguments: '1-',
    code: function() {
      var implicit = arguments[0],
        rest = Array.prototype.slice.call(arguments, 1);

      return _.all(rest, function(condition) {
        return core.interpretScrapingDirective(condition, implicit);
      });
    }
  },

  any: {
    argumentCount:'1-',
    code: function() {
      var args = Array.prototype.slice.call(arguments);
      return _.any(args);
    }
  },
  '>any': {
    argumentCount: '2-',
    rawArguments:'1-',
    code: function() {
      var implicit = arguments[0],
        rest = Array.prototype.slice.call(arguments, 1);

      return _.any(rest, function(condition) {
        return core.interpretScrapingDirective(condition, implicit);
      });
    }
  },
  // converts a jQuery object into an array - https://api.jquery.com/jQuery.makeArray/
  arr: {
    argumentCount: '1',
    code: function(obj) {
      return $.makeArray(obj);
    }
  },

  // access object properties
  prop: {
    argumentCount: '2-3',
    implicitForeach: false, // get prop of the whole object
    code: function(obj, prop, inner) {
      if (inner || ! _.has(obj, prop)) {
        return _.map(obj, function(item) {
          return item[prop];
        });
      } else {
        return obj[prop];
      }
    }
  },
  // access object methods
  call: {
    argumentCount: '2-3', // depending whether it has "inner" argument...
    implicitForeach: false,
    code: function(obj, method, inner) {
      if (!inner && obj && _.isFunction(obj[method])) { // outer obj
        return obj[method]();
      } else {
        return _.map(obj, function(item) {
          return item[method]();
        });
      }
    }
  },

  apply: {
    argumentCount: '3-4',
    implicitForeach: false,
    code: function(obj, method, attrs, inner) {
      if (!inner && obj && _.isFunction(obj[method])) { // outer obj
        return obj[method].apply(obj, attrs);
      } else {
        return _.map(obj, function(item) {
          if (_.isFunction(item[method])) {
            return item[method].apply(item, attrs);
          }
        });
      }
    }
  },

  // code branching
  if: {
    argumentCount: '2-3',
    rawArguments: '1,2',
    // `ifbody` and `elsebody` must be raw because they
    // can be instructions with side effects (setVal)
    // so I cannot let interpret them before knowing which one I want to...
    code: function(condition, ifbody, elsebody) {
      if (condition) {
        return core.interpretScrapingDirective(ifbody);
      } else {
        return core.interpretScrapingDirective(elsebody);
      }
    }
  },

  // filtering
  filter: {
    argumentCount: '1',
    implicitForeach: false,
    rawArguments: '1',
    code: function(data, condition) {
      return _.filter(data, function(item) {
        return core.interpretScrapingDirective(condition, item);
      });
    }
  },
  // array reduction commands
  len: {
    argumentCount:'1',
    implicitForeach: false,
    code: function(obj) {
      return obj && obj.length;
    }
  },

  at: {
    argumentCount: '2',
    implicitForeach: false,
    code: function(array, index) {
      if (_.isArray(index)) {
        return _.map(index, function(i) {
          // array.length + negativeNumber (this is why it is not -i but +i).
          return array[i < 0 ? array.length + i : i];
        });
      } else { // isInt
        return array[index < 0 ? array.length + index : index];
      }
    }
  },

  first: {
    argumentCount: '1',
    implicitForeach: false,
    code: function(array) {
      return array[0];
    }
  },

  last: {
    argumentCount: '1',
    implicitForeach: false,
    code: function(array) {
      return array[array.length - 1];
    }
  },
  // arithmetics
  scalarOp : {
    argumentCount: '3',
    code: function(a, b, op) {
      switch (op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return a / b;
      }
    }
  },

  arrayScalarOp: {
    argumentCount: '3',
    code: function(first, second, op) {
      var that = this;
      if (_.isArray(first)) {
        return _.map(first, function(el) {
          return that.scalarOp.code.call(that, el, second, op);
        });
      } else {
        return _.map(second, function(el) {
          return that.scalarOp.code.call(that, first, el, op);
        });
      }
    }
  },

  arrayArrayOp: {
    argumentCount: '3',
    code: function(array1, array2, op) {
      if (array1.length !== array2.length) {
        return NaN;
      }
      var that = this;
      return _.zip(array1, array2).map(function(pair) {
        return that.scalarOp.code.call(that, pair[0], pair[1], op);
      });
    }
  },

  op: {
    argumentCount: '3',
    code: function(item1, item2, op) {
      // scalar + scalar
      if (_.isNumber(item1) && _.isNumber(item2)) {
        return this.scalarOp.code(item1, item2, op);
      } else if (_.isArray(item1) && _.isArray(item2)) {
        return this.arrayArrayOp.code.call(this, item1, item2, op);
      } else {
        return this.arrayScalarOp.code.call(this, item1, item2, op);
      }
    }
  },

  '+' : {
    argumentCount: '2',
    code: function(a, b) {
      return this.op.code.call(this, a, b, '+');
    }
  },
  '-' : {
    argumentCount: '2',
    code: function(a, b) {
      return this.op.code.call(this, a, b, '-');
    }
  },
  '*' : {
    argumentCount: '2',
    code: function(a, b) {
      return this.op.code.call(this, a, b, '*');
    }
  },
  '/' : {
    argumentCount: '2',
    code: function(a, b) {
      return this.op.code.call(this, a, b, '/');
    }
  },

  // convenience commands
  sum: {
    argumentCount: '1',
    code: function(array) {
      return _.reduce(array, function(sum, num) {
        return sum + num;
      });
    }
  },
  avg: {
    argumentCount: '1',
    code: function(array) {
      return this.sum.code(array) / array.length;
    }
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
  _.forOwn(commands, function(commBody, commName){
    result[commName] = _.extend({}, commandDefaults, commBody);
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
  setCommands(builtinCommands);

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
  __setJQuery: function(different) {return $ = different;},
  __setStorage: function(different) {return storage = different;},
  __getStorage: function() {return storage;},

  isPipedName: isPipedName,
  getCommandName: getCommandName,
  isCommand: isCommand,
  getDecorator: getDecorator,
  isSelector: isSelector,
  isInstruction: isInstruction
};

// circular dependency fix. commands->core->(simplifier+evaluator)->commands
// https://coderwall.com/p/myzvmg
core = require('./core');

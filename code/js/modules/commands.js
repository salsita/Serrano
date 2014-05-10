var $ = require('../libs/jquery');
var _ = require('../libs/lodash');

var exceptions = require('./exceptions');

/**
 * Container used for storing all the variables and values from scraping directives.
 * Functions like getVal and setVal have direct access to this object.
 */
var storage = {};

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
  rawArguments: [],
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
 *   rawArguments: (default)[] // array of argument positions that should be passed
 *     raw (without preprocessing) -> those at that positions there are ARRAYS that we
 *     do not want to preprocess
 *   code: Function (the code of the function itself)
 * }
 *
 * Note: sometimes a function can have conflicting atributes,
 *   i.e. implicitForeach==true and 0 is in rawArguments array.
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

  // converts a jQuery object into an array - https://api.jquery.com/jQuery.makeArray/
  arr: {
    argumentCount: '1',
    code: function(obj) {
      return $.makeArray(obj);
    }
  },

  // storing and fetching variables
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
    implicitForeach: false,
    code: function(value, key) {
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

  // *** conditions *****************

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
        'length' in Object.keys(arg) ? 0 === arg.length : 0 === Object.keys(arg);
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
  all: { // todo how about augmentation? hopefully o.k.
    argumentCount: '1-',
    code: function() {
      var args = Array.prototype.slice.call(arguments);
      return _.all(args);
    }
  },

  //alias
  and: this.all,

  any: {
    argumentCount:'1-',
    code: function() {
      var args = Array.prototype.slice.call(arguments);
      return _.any(args);
    }
  },
  or: this.any,

  filter: {
    argumentCount: '1',
    rawArguments: [1],
    code: function() {
      // todo:
      // eval.evalExpression(...);
    }
  },
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

  call: {
    argumentCount: '2-3', // depending whther it has "inner" argument...
    implicitForeach: false,
    code: function(obj, method, inner) {
      if (inner || ! _.has(obj, method)) {
        return _.map(obj, function(item) {
          return item[method]();
        });
      } else {
        return obj[method]();
      }
    }
  },

  apply: {
    argumentCount: '3-4',
    rawArguments: [],
    implicitForeach: false,
    code: function(obj, method, attrs, inner) {
      if (inner || ! _.has(obj, method)) {
        return _.map(obj, function(item) {
          if (_.isFunction(obj[method])) {
            return item[method].apply(null, attrs);
          }
        });
      } else {
        if (_.isFunction(obj[method])) { // else TypeError: Cannot read property 'apply' of undefined
          return obj[method].apply(null, attrs);
        }
      }
    }
  },

  // code branching
  if: {
    argumentCount: '2-3',
    code: function(condition, ifbody, elsebody) {
      if (condition) {
        return ifbody;
      } else {
        return elsebody;
      }
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
      if (_.isArray(first)) {
        return _.map(first, function(el) {
          return this.scalarOp.code(el, second, op);
        });
      } else {
        return _.map(second, function(el) {
          return this.scalarOp.code(first, el, op);
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
      return _.zip(array1, array2).map(function(pair) {
        return this.scalarOp.code(pair[0], pair[1], op);
      });
    }
  },

  op: {
    argumentCount: '3',
    code: function(item1, item2, op) {
      // scalar + scalar todo: isNumber/isFInite/isNaN what do we want?
      if (_.isNumber(item1) && _.isNumber(item2)) {
        return this.scalarOp.code(item1, item2, op);
      } else if (_.isArray(item1) && _.isArray(item2)) {
        return this.arrayArrayOp.code(item1, item2, op);
      } else {
        return this.arrayScalarOp.code(item1, item2, op);
      }
    }
  },

  '+' : {
    argumentCount: '2',
    code: function(a, b) {
      return this.op.code(a, b, '+');
    }
  },
  '-' : {
    argumentCount: '2',
    code: function(a, b) {
      return this.op.code(a, b, '-');
    }
  },
  '*' : {
    argumentCount: '2',
    code: function(a, b) {
      return this.op.code(a, b, '*');
    }
  },
  '/' : {
    argumentCount: '2',
    code: function(a, b) {
      return this.op.code(a, b, '/');
    }
  },

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
  },
  // array reduction commands
  len: {
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

  // convenience commands
  concat: { // fixme this is not working how it is supposed to...
    argumentCount: '1-',
    implicitForeach: false,
    code: function() {
      var args = Array.prototype.slice.call(arguments);
      Array.prototype.concat.apply([], args);
    }
  },

  union: {
    argumentCount: '1-',
    implicitForeach: false,
    code: function() {
      var args = Array.prototype.slice.call(arguments);
      return _(args).flatten().union().valueOf();
    }
  },
  replace: {
    argumentCount: '3',
    code: function (str, old, n) {
      return str.replace(old, n);
    }
  }
 };

/**
 * In case some commands properties are not explicitly filled,
 * set their default according to commandDefaults object.
 * @private
 * @param {Array of commands} commands.
 * @returns {Array of commands} Commands with default properties.
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

// 'init' - add basic commands to use
addCommands(builtinCommands);

/**
 * Creates a completely new command set.
 * @param different Array of available commands .
 */
function setCommands(different) {
  commands = {};
  addCommands(different);
}


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
  return _.isArray(command) && command.length !== 0 && Boolean(getCommandName(command[0]));
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
  addCommands: addCommands,
  setCommands: setCommands,
  getCommand: function(command) { return commands[command]; },
  getCommands: function() {return commands;},
  __setJQuery: function(different) {$ = different;},

  isPipedName: isPipedName,
  getCommandName: getCommandName,
  isCommand: isCommand,
  getDecorator: getDecorator,
  isSelector: isSelector,
  isInstruction: isInstruction
};

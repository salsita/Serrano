/**
 * Created by tomasnovella on 8/29/14.
 */
var _ = require('../../libs/lodash');
var logging = require('../logging');
var exceptions = require('../exceptions');

/**
 * These are the most basic commands, present everywhere.
 */
var builtinCommands = {
  constant: {
    argumentCount: '1',
    rawArguments: '0',
    code: function(context, value) {
      return value;
    }
  },

  // jQuery-based element(s) selecting
  jQuery : {
    argumentCount: '1-2',
    code: function(context, obj1, obj2) {
      var el;
      if (arguments.length === 2) {
        el = context.$(obj1);
      } else { // it's chained
        el = context.$(obj2, obj1);
      }

      if (el.length === 0 && logging.config().logEmptyElements) {
        logging.log('Serrano selector selected an empty command. Arguments given to a selector:'+
          'Obj1 = '+ JSON.stringify(obj1) + ' Obj2 = '+ JSON.stringify(obj2) +
          ' Context = '+ JSON.stringify(context));
      }
      return el;
    }
  },

  // storing and fetching variables
  getVal: {
    argumentCount: '1',
    code: function(context, key) {
      return context.storage[key];
    }
  },

  setVal: {
    argumentCount: '2',
    implicitForeach: false,
    code: function(context, value, key) {
      return context.storage[key] = value;
    }
  },

  // conditions
  // existence tests
  'exists': {
    argumentCount: '1',
    code: function(context, arg) {
      return arg !== undefined && arg !== null;
    }
  },

  'nexists': {
    argumentCount: '1',
    code: function(context, arg) {
      return !this.exists.code(context, arg);
    }
  },
  'empty': {
    argumentCount: '1',
    code: function(context, arg) {
      return typeof(arg) === 'object' &&
        ('length' in arg ? (0 === arg.length) : (0 === Object.keys(arg).length));
    }
  },
  'nempty': {
    argumentCount: '1',
    code: function(context, arg) {
      return !this.empty.code(context, arg);
    }
  },

  // comparisons
  lt: {
    argumentCount: '2',
    code: function(context, left, right) {
      return left < right;
    }
  },
  le: {
    argumentCount: '2',
    code: function(context, left, right) {
      return left <= right;
    }
  },
  gt: {
    argumentCount: '2',
    code: function(context, left, right) {
      return left > right;
    }
  },
  ge: {
    argumentCount: '2',
    code: function(context, left, right) {
      return left >= right;
    }
  },
  eq: {
    argumentCount: '2',
    code: function(context, left, right) {
      /*jslint eqeq: true*/
      return left == right;
    }
  },
  neq: {
    argumentCount: '2',
    code: function(context, left, right) {
      /*jslint eqeq: true*/
      return left != right;
    }
  },

  // compound conditions
  all: {
    argumentCount: '1-',
    code: function(/* context */) {
      var args = Array.prototype.slice.call(arguments, 1);
      return _.foldl(args, function(acc, val) {
        return acc && val;
      }, true);
    }
  },

  '>all': {
    argumentCount: '2-',
    rawArguments: '1-',
    code: function(context, implicit) {
      var rest = Array.prototype.slice.call(arguments, 2); // slice off context + implicit arg

      return _.foldl(rest, function(acc, condition) {
        return acc && context.interpretScrapingDirective(condition, context, implicit);
      }, true);
    }
  },

  any: {
    argumentCount:'1-',
    code: function(/* context */) {
      var args = Array.prototype.slice.call(arguments, 1);
      return _.foldl(args, function(acc, val) {
        return acc || val;
      }, false);
    }
  },

  '>any': {
    argumentCount: '2-',
    rawArguments:'1-',
    code: function(context, implicit) {
      var rest = Array.prototype.slice.call(arguments, 2); // slices off context and implicit arg...
      return _.foldl(rest, function(acc, condition) {
        return acc || context.interpretScrapingDirective(condition, context, implicit);
      }, false);

    }
  },

  // converts a jQuery object into an array - https://api.jquery.com/jQuery.makeArray/
  arr: {
    argumentCount: '1',
    implicitForeach: false,
    code: function(context, obj) {
      return context.$.makeArray(obj);
    }
  },

  // access object properties
  prop: {
    argumentCount: '2-3',
    implicitForeach: false, // get prop of the whole object
    code: function(context, obj, prop, inner) {
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
    code: function(context, obj, method, inner) {
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
    code: function(context, obj, method, attrs, inner) {
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
    code: function(context, condition, ifbody, elsebody) {
      if (condition) {
        return context.interpretScrapingDirective(ifbody, context);
      } else {
        return elsebody && context.interpretScrapingDirective(elsebody, context);
      }
    }
  },

  // filtering
  filter: {
    argumentCount: '2',
    implicitForeach: false,
    rawArguments: '1',
    code: function(context, data, condition) {
      if (_.isArray(data)) {
        return  _.filter(data, function(item) {
          return context.interpretScrapingDirective(condition, context, item);
        });
      } else {
        return context.interpretScrapingDirective(condition, context, data)? data : undefined;
      }
    }
  },

  indices: {
    argumentCount: '2',
    implicitForeach: false,
    rawArguments: '1',
    code: function(context, data, condition) {
      if (!_.isArray(data)) { // if not called with an array, return undefined
        return;
      }
      var res = [];
      _.forEach(data, function(item, index) {
        if (context.interpretScrapingDirective(condition, context, item)) {
          res.push(index);
        }
      });
      return res;
    }
  },


  // array reduction commands
  len: {
    argumentCount:'1',
    implicitForeach: false,
    code: function(context, obj) {
      return _.size(obj);
    }
  },

  at: {
    argumentCount: '2',
    implicitForeach: false,
    code: function(context, array, index) {
      if (!array || !array.length) { // non array, return undefined.
        return;
      }
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
    code: function(context, array) {
      return array[0];
    }
  },

  last: {
    argumentCount: '1',
    implicitForeach: false,
    code: function(context, array) {
      return array[array.length - 1];
    }
  },

  // arithmetics
  _scalarOp : { // these private methods are never invoked directly, so they don't need context
    argumentCount: '3',
    code: function(context, a, b, op) {
      a = parseFloat(a);
      b = parseFloat(b);

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

  _arrayScalarOp: {
    argumentCount: '3',
    code: function(context, first, second, op) {
      var that = this;
      if (_.isArray(first)) {
        return _.map(first, function(el) {
          return that._scalarOp.code.call(that, context, el, second, op);
        });
      } else {
        return _.map(second, function(el) {
          return that._scalarOp.code.call(that, context, first, el, op);
        });
      }
    }
  },

  _arrayArrayOp: {
    argumentCount: '3',
    code: function(context, array1, array2, op) {
      if (array1.length !== array2.length) {
        return NaN;
      }
      var that = this;
      return _.zip(array1, array2).map(function(pair) {
        return that._scalarOp.code.call(that, context, pair[0], pair[1], op);
      });
    }
  },

  _op: {
    argumentCount: '3',
    code: function(context, item1, item2, op) {
      var arrCount = 0;
      if (_.isArray(item1)) {
        ++arrCount;
      }
      if(_.isArray(item2)) {
        ++arrCount;
      }

      switch (arrCount) {
        case 2: // array + array
          return this._arrayArrayOp.code.call(this, context, item1, item2, op);
        case 1: // array + scalar || scalar + array
          return this._arrayScalarOp.code.call(this, context, item1, item2, op);
        case 0: // scalar + scalar
          return this._scalarOp.code.call(this, context, item1, item2, op);
      }
    }
  },

  '+' : {
    argumentCount: '2',
    code: function(context, a, b) {
      return this._op.code.call(this, context, a, b, '+');
    }
  },
  '-' : {
    argumentCount: '2',
    code: function(context, a, b) {
      return this._op.code.call(this, context,  a, b, '-');
    }
  },
  '*' : {
    argumentCount: '2',
    code: function(context, a, b) {
      return this._op.code.call(this, context, a, b, '*');
    }
  },
  '/' : {
    argumentCount: '2',
    code: function(context, a, b) {
      return this._op.code.call(this, context, a, b, '/');
    }
  },

  sum: {
    argumentCount: '1',
    code: function(context, array) {
      if (_.isArray(array)) {
        return _.reduce(array, function(sum, num) {
          return sum + parseFloat(num);
        }, 0);
      } else {
        throw new exceptions.RuntimeError('Non-array value supplied to !sum.');
      }
    }
  },
  avg: {
    argumentCount: '1',
    code: function(context, array) {
      return this.sum.code(context, array) / array.length;
    }
  },

  // convenience commands
  lower: {
    argumentCount: '1',
    code: function(context, str) {
      return str.toLowerCase();

    }
  },

  upper: {
    argumentCount: '1',
    code: function(context, str) {
      return str.toUpperCase();
    }
  },

  trim: {
    argumentCount: '1',
    code: function(context, str) {
      return str.trim();
    }
  },
  split: {
    argumentCount: '2',
    code: function(context, str, sep) {
      return str.split(sep);
    }
  },
  substr: {
    argumentCount: '2-3',
    code: function(context, str, start, length) {
      return str.substr(start, length);
    }
  },

  // convenience commands
  concat: {
    argumentCount: '1-',
    implicitForeach: false,
    code: function(/* context */) {
      var args = Array.prototype.slice.call(arguments, 1);
      return Array.prototype.concat.apply([], args);
    }
  },

  union: {
    argumentCount: '1-',
    implicitForeach: false,
    code: function(/* context */) {
      var args = Array.prototype.slice.call(arguments, 1);
      return _(args).flatten().union().valueOf();
    }
  },

  splice: {
    argumentCount: '3',
    implicitForeach: false,
    code: function(context, array, index, howmany) {
      // array.length - (-positiveIndex) === array.length + positiveIndex
      index = (index < 0) ? (array.length) + index : index;
      array.splice(index, howmany);
      return array;
    }
  },

  join: {
    argumentCount:'2',
    implicitForeach: false,
    code: function(context, array, separator) {
      return array.join(separator);
    }
  },

  replace: {
    argumentCount: '3',
    code: function(context, str, old, n) {
      return str.replace(old, n);
    }
  },

  replaceAll: {
    argumentCount: '3',
    code: function(context, str, old, n) {
      var reg = new RegExp(old, 'g');
      return str.replace(reg, n);
    }
  },

  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match
  match: {
    argumentCount: '2',
    code: function(context, str, regexp) {
      if (str) {
        return str.match(regexp);
      }
    }
  },

  interpretArray: {
    argumentCount: '1',
    rawArguments: '0',
    code: function(context, array) {
      return _.map(array, function(scrapDir) {
        return context.interpretScrapingDirective(scrapDir, context);
      });
    }
  },

  // action commands
  remove: {
    argumentCount: '1',
    code: function(context, selector) {
      return selector.remove();
    }
  },

  insert: {
    argumentCount: '2-3',
    code: function(context, selector, where, tpl) {
      if (where === 'before') {
        return selector.before(tpl);
      } else {
        return selector.after(tpl);
      }
    }
  },

  replaceWith: {
    argumentCount: '2',
    code: function(context, selector, tpl) {
      return selector.replaceWith(tpl);
    }
  },

  // global object access
  window: {
    argumentCount: '0',
    code: function(/* context */) {
      /*global window */
      if (window) {
        return window;
      }
    }
  },
  document: {
    argumentCount: '0',
    code: function(/* context */) {
      /*global window */
      if (window && window.document) {
        return window.document;
      }
    }
  },
  href: {
    argumentCount: '0',
    code: function(/* context */) {
      /*global window */
      if (window && window.document) {
        return window.document.location.href;
      }
    }
  },

  // data types
  date: {
    argumentCount: '0-1',
    code: function(context, arg) {
      if (arg) {
        return new Date(arg);
      } else {
        return new Date();
      }
    }
  },

  // https://developer.mozilla.org/cs/docs/Web/JavaScript/Reference/Global_Objects/RegExp
  regexp: {
    argumentCount: '1, 2',
    code: function(context, pattern, flags) {
      return new RegExp(pattern, flags);
    }
  },
  attr: {
    argumentCount: '2',
    code: function(context, obj, attrib) {
      return obj.attr(attrib);
    }
  },
  isArray: {
    argumentCount: '1',
    code: function(context, obj) {
      return _.isArray(obj);
    }
  }
};

module.exports = builtinCommands;

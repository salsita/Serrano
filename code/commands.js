jQuery = require("../libs/jquery");


storage = {};

/**
 * Contains all the available functions in the following format:
 * "function name": {
 *   implicitForeach : (default) true // if the return value of the previous function is array ->
 *     decides whether pass it as it is, or run an implicit foreach
 *   rawArguments: (default)[] // array of argument positions that should be passed raw (without preprocessing) ->
 *     those at that positions there are ARRAYS that we do not want to preprocess
 *   code : Function (the code of the function itself)
 * }
 */
commands = {
  'getVal': {
    'argumentCount': '2',
    'implicitForeach': true,
    'rawArguments': [],
    'code': function(key) {
      if (storage.hasOwnProperty(key)) {
        return storage[key];
      } else {
        throw new WrongArgumentError('getVal '+ key +' no value found');
      }
    }
  },

  'setVal': {
    'argumentCount': '3',
    'implicitForeach': true,
    'rawArguments': [],
    'code': function(key, value) {
      storage[key] = evaluateExpression(value);
      return storage[key];
    }
  },

  'jQuery': {
    'argumentCount': '1',
    'implicitForeach': true,
    'rawArguments': [],
    'code': function(obj) {
      return $(obj);
    }
  },
  'lower': {
    argumentCount: "1",
    implicitForeach: true,
    rawArguments:[],
    code: function(arg) {
      return arg.toLowerCase();
    }
  },
  'lt': {
    argumentCount:"2,3",
    implicitForeach: true,
    rawArguments:[1],
    'code': function(){
      // ...
    }
  },

  // converts a jQuery object into an array - https://api.jquery.com/jQuery.makeArray/
  'makeArray': {
    'code':function(obj) {
      return jQuery.makeArray(obj);
    }
  },
  'a': {
    'code': function(obj) {
      return this.makeArray(obj);
    }
  },

  // TODO: maybe extend - so that I can get an array of indexes too... (nonEvaluation of an expression)
  'at': {
    'implicitForeach': false,
    'rawArguments': [1],
    'code': function(array, index) {
      //if (jQuery.isArray(index));
      return array[index];
    }
  },

  'concat': {
    'implicitForeach': false,
    'rawArguments': [0], // maybe a stupid thing since argument [0] si never raw (think about it!)
    'code': function(pieces, glue) {
      glue = typeof glue !== 'undefined' ? glue : ' '; // default glue is ' '
      return pieces.join(glue);
    }
  },

  'replace': {
    'code': function (str, old, n) {
      return str.replace(old, n);
    }
  },

  // note 1: thing I cannot compute - return only those people whose age is below 50.
  // example: <people><person name="tomas" age="22"/><person name="peter" age="55"></people>
  // [[".person", "!toArray"], ["!filter", ["!gt",["attr", "age"], 50]]]
  //

  // ["=li .age", ["!filter", ["!gt", 50]]
  // loops through all ages and returns an array of ages that meet the condition
  // takes an argument. If satisfies a condition - returns it. Otherwise returns undefined.
  'filter': {
    'implicitForeach': false,
    'rawArguments': [1],
    'code': function(obj, condition) {
      return evaluateExpression([obj, condition]);
    }
  },

  'gt': {
    'code': function(left, right) {

    }
  }

};

jqChains = {
  'lowercase':'buhulowercase',
  'attr': 'buhuattr'
};

module.exports = commands;

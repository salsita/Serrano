/**
 * Created by tomasnovella on 4/25/14.
 */
var assert = require('assert');

var commands = require('./commands');
var $ = require('../libs/jquery-mock');

var testCommands = {
  nonForeachable: {
    implicitForeach: false,
    argumentCount: 1,
    code: function(impl) {
      return impl;
    }
  },
  foreachableImplicitRawArgument: { // same as non foreachable
    argumentCount: '1-2',
    rawArguments: '0',
    code: function(impl) {
      return impl;
    }
  },

  constant: {
    argumentCount: '1',
    rawArguments: '1',
    code: function(c) {
      return c;
    }
  },
  replace: {
    argumentCount: '3',
    code: function (str, old, n) {
      return str.replace(old, n);
    }
  },
  arr: {
    argumentCount: '1',
    code: function(obj) {
      return $.makeArray(obj);
    }
  },
  len: {
    implicitForeach: false,
    code: function(obj) {
      return obj && obj.length;
    }
  },
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

  stringifyFirstArgument: {
    argumentCount: '1',
    code: function(impl, first) {
      return JSON.stringify(first);
    }
  },

  stringifyRawFirstArgument: {
    argumentCount: '1',
    rawArguments: '1',
    code: function(impl, first) {
      return JSON.stringify(first);
    }
  },

  '>implDifferent': {
    argumentCount: '1-2',
    code: function() {
      return 'with >';
    }
  },
  'implDifferent': {
    argumentCount: '0-1',
    code: function() {
      return 'without >';
    }
  }
};

var evaluator = require('./evaluator');

describe('interpreter evaluator', function() {
    var ei = evaluator.evalScrapingDirective;

    beforeEach(function(){
      commands.setCommands(testCommands);
    });
    it('should verify chaining and implicit argument passing', function(){
      var explicit = [['!replace', 'Hello world!', 'world', 'Roman']],
        implicit = [['!constant', 'Hello world!'], ['>!replace', 'world', 'Roman']],
        custom = [['>!replace', 'world', 'Roman']]; // takes extra implicit argument

      assert.equal(ei(explicit), 'Hello Roman!');
      assert.equal(ei(implicit), 'Hello Roman!');
      assert.equal(ei(custom, 'Hello world!'), 'Hello Roman!');
    });

    it('should make sure we can have different implementations for "command" and ">command"', function(){
      var i1 = [['!implDifferent']];
      var i2 = [['!constant', 'const'],['>!implDifferent']];
      assert.equal(ei(i1), 'without >');
      assert.equal(ei(i2), 'with >');
    });

    it('should verify implicit foreach', function(){
      var implicitForeach = [ ['!constant', ['Hello world!', 'Goodbye world!']],
        ['>!replace', 'world', 'Roman'] ];
      assert.deepEqual(ei(implicitForeach), ['Hello Roman!', 'Goodbye Roman!']);

      var noForeach = [['!constant', ['Hello world!', 'Goodbye world!']],['>!nonForeachable']];
      assert.deepEqual(ei(noForeach), ['Hello world!', 'Goodbye world!']);

      var foreachRawImplicit = [ ['!constant', ['Hello world!', 'Goodbye world!']],
        ['>!foreachableImplicitRawArgument'] ];
      assert.deepEqual(ei(foreachRawImplicit), ['Hello world!', 'Goodbye world!']);
    });


    // 3. raw vs processed arguments
    it('should verify raw vs processed argument passing', function(){
      var raw = [ ['!constant', 'whatever'],
        ['>!stringifyRawFirstArgument', [['!jQuery', 'h2'], ['>!arr'], ['>!len']] ] ];
      assert.strictEqual(ei(raw), '[["!jQuery","h2"],[">!arr"],[">!len"]]');


      var processed = [ ['!constant', 'whatever'],
        ['>!stringifyFirstArgument', [['!jQuery', 'h2'], ['>!arr'], ['>!len']] ] ];
      assert.strictEqual(ei(processed), '2');
    });

    // 4. mock jQuery
    it('should verify mock jQuery in action', function(){
      var mock = [['!jQuery', 'h2'], ['>!arr'], ['>!len']];
      assert.strictEqual(ei(mock), 2);
    });
});

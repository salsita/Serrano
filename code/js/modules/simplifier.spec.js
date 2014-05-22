var assert = require('assert');

var _ = require('../libs/lodash');
var $ = require('../libs/jquery-mock');


var simplifier = require('./simplifier');
var exceptions = require('./exceptions');
var commands = require('./commands');

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
    argumentCount: '0-3',
    rawArguments: '2',
    code: function() {
      var args = Array.prototype.slice.call(arguments);
      return args;
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
    code: function(c) {
      return c;
    }
  },
  arr: {
    argumentCount: '1',
    code: function(obj) {
      return $.makeArray(obj);
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
  }
};


describe('module for grammar simplification', function() {
  beforeEach(function(){
    commands.setCommands(testCommands);
  });
  var simplify = simplifier.simplifyScrapingDirective;


  it('should check the selectors are correctly simplified', function() {
    assert.ok(_.size(commands.getCommands()) > 0);
    assert.ok(commands.getCommand('constant'));

    assert.equal('function', typeof(simplify));

    // test all three selectors
    var sel1 = ['$.dollarSelector'];
    var res1 = ['!jQuery', '.dollarSelector' ];
    assert.deepEqual(simplify(sel1), res1);

    var selArg = [['$.sel'], ['>!arr']];
    var rSelArg = [['!jQuery', '.sel'], ['>!arr']];

    assert.deepEqual(simplify(selArg), rSelArg);

    var sel2 = [ ['=.to text'],[">!prop", "length"]];
    var res2 = [ [ '!jQuery', '.to text' ], [ '>!call', 'text' ], [">!prop", "length"]];
    assert.deepEqual(simplify(sel2), res2);

    var sel3 = ['~to .array h5'];
    var res3 = [ [ '!jQuery', 'to .array h5' ], [ '>!arr' ] ];
    assert.deepEqual(simplify(sel3), res3);
  });

  it('should make sure that all commands exist and comply with their signatures', function(){
    var unknownCommand = ['!unknowCommand', 5];
    assert.throws(function() { simplify(unknownCommand);}, TypeError);

    var wrongArgc = [['$users'], ['!acceptsOneToFiveArguments']]; // received zero
    var wrongArgc2 = [['~blahblah'], ['>!acceptsZeroToOneArguments', 'secondArg']]; // two
    assert.throws(function() { simplify(wrongArgc); }, exceptions.WrongArgumentError);
    assert.throws(function() { simplify(wrongArgc2); }, exceptions.WrongArgumentError);

  });

  it('should verify that raw argument is left raw', function(){
    // implicit arg, first arg, second arg...
    var secondRaw = ['!secondArgumentIsRaw',
      ['$implicitArg [to=be] simplified'],
      {prop1:42, prop2:47},
      ['$thisArgumentIsRaw']];


    var rSecondRaw = [ '!secondArgumentIsRaw',
      [ '!jQuery', 'implicitArg [to=be] simplified' ],
      { prop1: 42, prop2: 47 },
      [ '$thisArgumentIsRaw' ] ];

    assert.deepEqual(simplify(secondRaw), rSecondRaw);
  });

  it('should make sure that pipes and complicated expressions are simplified correctly',
    function(){
      var correctArgc = [ ['$users'],
        ['>!acceptsOneToFiveArguments'],
        ['>!acceptsOneToFiveArguments',
          ['~selectorIsSecondArgument.div'],
          ['!acceptsZeroToOneArguments'] ] ];

      var rCorrectArgc = [["!jQuery","users"],
        [">!acceptsOneToFiveArguments"],
        [">!acceptsOneToFiveArguments",
          [["!jQuery","selectorIsSecondArgument.div"],[">!arr"]],
          ["!acceptsZeroToOneArguments"] ]];
      assert.deepEqual(simplify(correctArgc), rCorrectArgc);
  });

});

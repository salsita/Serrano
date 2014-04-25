var assert = require("assert");

var jQueryMock = require('../libs/jquery-mock');
var simplifier = require('./simplifier');
var exceptions = require('./exceptions');

simplifier.testInit(jQueryMock);


describe("module for grammar simplification", function() {
  it("should verify whether the grammar is correctly simplified", function() {

    var s = simplifier.simplifyScrapingDirective;
    assert.equal("function", typeof(s));

    // test all three selectors
    var sel1 = ['$.dollarSelector'];
    var res1 = [ [ '!jQuery', '.dollarSelector' ] ];

    var sel2 = ['=.to text'];
    var res2 = [ [ '!jQuery', '.to text' ], [ '!call', 'text' ] ];

    var sel3 = ['~to .array h5'];
    var res3 = [ [ '!jQuery', 'to .array h5' ], [ '!arr' ]];

    var unknownCommand = ['!unknowCommand', 5];


    // implicit arg, first arg, second arg...
    var secondRaw = ['!secondArgumentIsRaw',
      ['$implicitArg [to=be] simplified'],
      {prop1:42, prop2:47},
      ['$thisArgumentIsRaw']];


    var rSecondRaw = [ '!secondArgumentIsRaw',
      [ [ '!jQuery', 'implicitArg [to=be] simplified' ] ],
      { prop1: 42, prop2: 47 },
      [ '$thisArgumentIsRaw' ] ];


    // noop does not return a value
    var wrongArgc = [['$users'], ['!noop'], ['!acceptsOneToFiveArguments']];
    var wrongArgc2 = [['~blahblah'], ['!acceptsZeroToOneArguments', 'secondArg']];

    var correctArgc = [ ['$users'],
      ['!acceptsOneToFiveArguments'],
      ['!acceptsOneToFiveArguments', ['~selectorIsSecondArgument.div'], ['!acceptsZeroToOneArguments']] ];

    var rCorrectArgc = [[["!jQuery","users"]],
      ["!acceptsOneToFiveArguments"],
      ["!acceptsOneToFiveArguments",[["!jQuery","selectorIsSecondArgument.div"],["!arr"]],
        ["!acceptsZeroToOneArguments"]]];


    var correctArgc2 = [['~blahblah'], ['!noop'], ['!acceptsZeroToOneArguments', 'secondArg']];
    var rCorrectArgc2 = [ [["!jQuery","blahblah"],["!arr"]],
      ["!noop"], ["!acceptsZeroToOneArguments","secondArg"] ];

    var correctArgc3 = [ ['~blahblah'], ['!noop'], ['!acceptsZeroToOneArguments'] ];
    var rCorrectArgc3 = [ [["!jQuery","blahblah"],["!arr"]],
      ["!noop"], ["!acceptsZeroToOneArguments"] ];

    assert.deepEqual(s(sel1), res1);
    assert.deepEqual(s(sel2), res2);
    assert.deepEqual(s(sel3), res3);

    assert.throws(function() { s(unknownCommand);}, TypeError);

    assert.deepEqual(s(secondRaw), rSecondRaw);

    assert.throws(function() { s(wrongArgc); }, exceptions.WrongArgumentError);
    assert.throws(function() { s(wrongArgc2); }, exceptions.WrongArgumentError);

    assert.deepEqual(s(correctArgc), rCorrectArgc);
    assert.deepEqual(s(correctArgc2), rCorrectArgc2);
    assert.deepEqual(s(correctArgc3), rCorrectArgc3);
  });
});

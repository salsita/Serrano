var assert = require("assert");

var jQueryMock = require('../libs/jquery-mock');
var simplifier = require("./simplifier");

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



//    var v4 = ["$users", ["!filter", ["$name", ["prop", "length"], ["!lt", 30]]]];
//    var r4 = [["!jQuery","users"], ["!filter",["$name",["prop","length"],["!lt",30]]]];
//
//    var v5 = ["~somthing", "notAFunction"];
//    var v6 = ["$something", "!notImplemented"];
//    var v7 = ["!someNotImplementedcommand"];



    assert.deepEqual(s(sel1), res1);
    assert.deepEqual(s(sel2), res2);
    assert.deepEqual(s(sel3), res3);

    assert.throws(function() { s(unknownCommand);}, TypeError);

    assert.deepEqual(s(secondRaw), rSecondRaw);


  });
});

var assert = require("assert");

var simplifier = require("./simplifier");

describe("module for grammar simplification", function() {
  it("should verify whether the grammar is correctly simplified", function() {

    var s = simplifier.simplify;
    assert.equal("function", typeof(s));

    var v1 = ["$users.ages blah"]; // this is an instruction! do not forget...
    var r1 = [["!jQuery", "users.ages blah"]];

    var v2 = ["!setVal",["=.classSth", "!lower"], "myVariable"];
    var r2 = ["!setVal",[ ["!jQuery", ".classSth"], ["!call", "text"], ["!lower"] ],"myVariable" ];

    // wrong number of arguments, simplifier cannot detect, because it needs context....
    var v3 = ["!getVal"];
    var r3 = ["!getVal"];

    var v4 = ["!lt", ["$.this Is Raw", "!lower"], ["~notraw", "!lower"]];
    var r4 = ["!lt", ["$.this Is Raw", "!lower"],[["!jQuery", "notraw"], ["!arr" ], ["!lower" ] ] ];

    var v5 = ["$somthing", "notAFunction"];
    var v6 = ["$something", "!notImplemented"];
    var v7 = ["!someNotImplementedcommand"];

    assert.deepEqual(s(v1), r1);
    assert.deepEqual(s(v2), r2);
    assert.deepEqual(s(v3), r3);
    assert.deepEqual(s(v4), r4);
    assert.throws(function() { s(v5); }, TypeError);
    assert.throws(function() { s(v6); }, TypeError);
    assert.throws(function() { s(v7); }, TypeError);

  });
});

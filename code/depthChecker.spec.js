/**
 * Created by tomasnovella on 4/25/14.
 */

var assert = require("assert");

var depthChecker = require('./depthChecker');

describe("module for potential buffer overflow check", function() {
  it("should verify whether the nested array of instructions is not too deep", function() {


    var vdepth = depthChecker.isValidDepth; // valid depth
    var arr1 = ["a", ["a", ["a",["c", ["d"]]]], ["g"], 65536,[1, 2, 3]];
    var arr2 = ["a", ["a", "a", "a", "a"]];

    assert.ifError(vdepth(arr1, 4));
    assert.ok(vdepth(arr1, 5));

    assert.ifError(vdepth(arr2, 1));
    assert.ok(vdepth(arr2, 2));

  });
});


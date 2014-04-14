var assert = require('assert');
// tested module:
var argcParser = require('./argumentCountChecker');

// tests:
describe('module for parsing the right number of arguments', function() {
  it('should verify whether argc parsing is correct', function() {
    var vargc = argcParser.checkArgumentCount; // valid argc
    assert.equal('function', typeof(vargc));

    var signature = " 2-   4 , 6, 10-";

    // passing tests
    assert.ok(vargc(2, signature));
    assert.ok(vargc(3, signature));
    assert.ok(vargc(4, signature));
    assert.ok(vargc(6, signature));
    assert.ok(vargc(10, signature));
    assert.ok(vargc(123, signature));

    // failing tests
    assert.ifError(vargc(-1, signature));
    assert.ifError(vargc(0, signature));
    assert.ifError(vargc(5, signature));
    assert.ifError(vargc(7, signature));
    assert.ifError(vargc(8, signature));
    assert.ifError(vargc(9, signature));

  });
});

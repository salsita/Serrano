var assert = require('assert');
// tested module:
var argcChecker = require('./argumentCountChecker');

// tests:
describe('module for parsing the right number of arguments', function() {
  it('should verify whether argc parsing is correct', function() {

    var vargc = argcChecker.checkArgumentCount; // valid argc
    assert.equal('function', typeof(vargc));

    var signature = " 2-   4 , 6, 10  - ";

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

    // invalid signatures will fail
    assert.ifError(vargc(42, '42,hello world'));
    assert.ifError(vargc(456, ''));
    assert.ifError(vargc(2, '1-3,')); // ending ,
    assert.ifError(vargc(5, ''));
    assert.ifError(vargc(5, '2,4-6, 7-8-9,10'));
  });
});

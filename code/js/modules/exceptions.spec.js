/**
 * Created by tomasnovella on 5/10/14.
 */

var assert = require('assert');

var exceptions = require('./exceptions');

describe('module with custom-defined exceptions', function() {
  it('should check if the exceptions are fully functional', function() {

    assert.throws(function() { throw new exceptions.InvalidJSONError(); }, exceptions.InvalidJSONError);
    assert.throws(function() { throw new exceptions.NotImplementedError(); }, exceptions.NotImplementedError);
    assert.throws(function() { throw new exceptions.WrongArgumentError(); }, exceptions.WrongArgumentError);
    assert.throws(function() { throw new exceptions.RuntimeError(); }, exceptions.RuntimeError);

  });
});

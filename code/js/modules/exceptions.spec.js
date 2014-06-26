/**
 * Created by tomasnovella on 5/10/14.
 */
var _ = require('../libs/lodash');
var assert = require('assert');

var exceptions = require('./exceptions');

describe('module with custom-defined exceptions', function() {
  it('should check if the exceptions are fully functional', function() {
    try {
      throw new exceptions.RuntimeError('Error message!');
    } catch (e) {
      assert.equal(typeof e, 'object');
      assert.strictEqual(_.size(e), 3);
      assert.strictEqual(e.message, 'Error message!');
      assert.strictEqual(e.name, 'RuntimeError');
      assert.strictEqual(e.toString(), 'RuntimeError: Error message!');
      assert.ok(typeof e.stack === 'string');
      assert.ok(e instanceof exceptions.RuntimeError);
      assert.ok(e instanceof Error);
    }
    try {
      throw new TypeError('Error message!');
    } catch (e) {
      assert.equal(typeof e, 'object');
      assert.strictEqual(_.size(e), 0); // this is weird
      assert.strictEqual(e.message, 'Error message!');
      assert.strictEqual(e.name, 'TypeError');
      assert.strictEqual(e.toString(), 'TypeError: Error message!');
      assert.ok(typeof e.stack === 'string');
      assert.ok(e instanceof TypeError);
      assert.ok(e instanceof Error);
    }
  });
});

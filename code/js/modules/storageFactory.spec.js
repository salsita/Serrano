/**
 * Created by tomasnovella on 5/12/14.
 */
/**
 * Created by tomasnovella on 5/12/14.
 */

var assert = require('assert');
var exceptions = require('./exceptions');
var storageFactory = require('./storageFactory');

// tests:
describe('module for storing temporary variables', function() {
  it('should verify whether storage getters and setters work in a way they should', function() {
    var storage = storageFactory.createStorage();
    assert.equal(storage.size(), 0);
    storage.setVal('key1', 'val1');
    assert.equal(storage.size(), 1);

    storage.clear();
    assert.equal(storage.size(), 0);
    assert.throws(function() {storage.getVal('key1');}, exceptions.RuntimeError);

    storage.setVal('key2', 'val2');
    assert.equal(storage.size(), 1);

    storage.setVal('key3', 'val3');
    assert.equal(storage.size(), 2);

    storage.setVal('key3', 'val33333');
    assert.equal(storage.size(), 2);
  });
});


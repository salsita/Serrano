/**
 * Created by tomasnovella on 7/17/14.
 */
var assert = require('assert');
var versionComparer = require('./versionComparer');

describe('module for comparing versions', function () {
  it('should test if the newer version is correctly identified', function() {
    assert(versionComparer.isNewer('0.0.0', '0.0.1'));
    assert(versionComparer.isNewer('0.1.0', '0.2.0'));
    assert(versionComparer.isNewer('0.99.99', '1.0.0'));
    assert(versionComparer.isNewer('0.9.0', '0.10.0'));
    assert(versionComparer.isNewer('0.10.0', '0.10.1'));


    assert.ifError(versionComparer.isNewer('0.10.0', '0.10.0'));
    assert.ifError(versionComparer.isNewer('0.10.0', '0.9.0'));
    assert.ifError(versionComparer.isNewer('0.0.0', '0.0.0'));
    assert.ifError(versionComparer.isNewer('0.1.2', '0.1.1'));

  });
});

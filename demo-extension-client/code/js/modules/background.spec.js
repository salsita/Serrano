/**
 * Created by tomasnovella on 7/12/14.
 */
var assert = require('assert');

describe('background', function() {
  it('should check if it can recognize newer version', function () {
    assert('1' > '0');
    assert('0' > '.'); // thanks to this we can directly compare versions
    assert('0.0.1' > '0.0.0');
    assert('0.1.0' > '0.0.1');
    assert('0.1.1' > '0.1.0');
    //assert('0.10.0' > '0.9.0'); // todo
    assert('0.10.1' > '0.10.0');
  });
});

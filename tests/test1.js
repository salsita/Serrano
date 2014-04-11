describe('main module', function() {

  var mod = window.serrano.engine;

  it('should verify the exported test function', function() {
    assert.equal('object', typeof(mod));
    var keys = Object.keys(mod);
    assert.equal(1, keys.length);
    assert.equal(keys[0], 'test');
    assert.equal('string', typeof(mod.test()));
    console.log(mod.test());
    console.log(window.$().jquery);
  });
});

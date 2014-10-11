var assert = require('assert');

var renderer = require('./instructionTemplateRenderer');

describe('module for template rendering before evaluation/execution', function () {
  it('should verify string replacement', function () {
    assert.deepEqual(
      renderer.render(['!hello', '.{{name}}.'], {name: 'Tomy'}),
      ['!hello', '.Tomy.']
    );
  });

  it('should check non-string elements are unmodified', function() {
    assert.deepEqual(
      renderer.render(['!hello', 1], {name:'Tomy'}),
      ['!hello', 1]
    );
  });

  it('should verify object replacement', function() {
    assert.deepEqual(
      renderer.render(['!hello',  {a:2, b: '{{name}}'}], {name: 'Tomy'}),
      ['!hello', {a:2, b:'Tomy'}]
    );
  });

  it('should verify recursive replacement', function() {
    assert.deepEqual(
      renderer.render(['{{name}}', ['another', '{{name}}', {a:'{{name}}', b:42}]], {name: 'A'}),
      ['A', ['another', 'A', {a:'A', b:42}]]
    );
  });
});

/**
 * Created by tomasnovella on 4/25/14.
 */
var assert = require('assert');

var jQueryMock = require('../libs/jquery-mock');

var core = require('./core');
core.testInit(jQueryMock);


describe('interpreter core', function() {
  it('should verify whether the core interprets scraping directives right', function() {
    var ei = core.evalInstruction;

    // 1. chaining & implicit argument passing
    var explicit = [['!replace', 'Hello world!', 'world', 'Roman']],
      implicit = [['!constant', 'Hello world!'], ['!replace', 'world', 'Roman']],
      custom = [['!replace', 'world', 'Roman']];

    assert.equal(ei(explicit), 'Hello Roman!');
    assert.equal(ei(implicit), 'Hello Roman!');
    assert.equal(ei(custom, 'Hello world!'), 'Hello Roman!');

    // 2. implicit foreach
    var implicitForeach = [ ['!constant', ['Hello world!', 'Goodbye world!']],
      ['!replace', 'world', 'Roman'] ];
    assert.deepEqual(ei(implicitForeach), ['Hello Roman!', 'Goodbye Roman!']);

    var noForeach = [['!constant', ['Hello world!', 'Goodbye world!']],['!nonForeachable']];
    assert.deepEqual(ei(noForeach), ['Hello world!', 'Goodbye world!']);

    var foreachRawImplicit = [ ['!constant', ['Hello world!', 'Goodbye world!']],
      ['!foreachableImplicitRawArgument'] ];
    assert.deepEqual(ei(foreachRawImplicit), ['Hello world!', 'Goodbye world!']);

    // 3. raw vs processed arguments
    var raw = [ ['!constant', 'whatever'],
      ['!stringifyRawFirstArgument', [['!jQuery', 'h2'], ['!arr'], ['!len']] ] ];
    assert.strictEqual(ei(raw), '[["!jQuery","h2"],["!arr"],["!len"]]');


    var processed = [ ['!constant', 'whatever'],
      ['!stringifyFirstArgument', [['!jQuery', 'h2'], ['!arr'], ['!len']] ] ];
    assert.strictEqual(ei(processed), '2');

    // 4. mock jQuery
    var mock = [['!jQuery', 'h2'], ['!arr'], ['!len']];
    assert.strictEqual(ei(mock), 2);

  });
});

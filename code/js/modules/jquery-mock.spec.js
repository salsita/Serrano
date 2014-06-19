/**
 * Created by tomasnovella on 5/14/14.
 */
/**
 * Created by tomasnovella on 5/10/14.
 */

var assert = require('assert');
var _ = require('../libs/lodash');

var $ = require('../libs/jquery-mock');

describe('module with mock jQuery library', function() {
  beforeEach(function(){
    $.init();
  });

  assert.equal(typeof $, 'function');
  var singleSelector = $('h2'),
    doubleSelector = $('p', '#news'),
    defaultSelector = $('whatever'),
    defaultSelector2 = $('whatever', 'else');

  it('should check the lengths of the elements', function() {
    // check for length
    assert.equal(singleSelector.length, 2);
    assert.equal(doubleSelector.length, 1);
    assert.equal(defaultSelector.length, 0);
  });


  it('should check whether each selector with not preset argument(s) is evaled as default selector',
    function(){
    assert.deepEqual(defaultSelector, defaultSelector2);
    });

  it('should check the innerHTML property', function(){
    assert.equal(singleSelector[0].innerHTML, 'This is the first h2 heading');
    assert.equal(singleSelector[1].innerHTML, 'Followed by another h2 heading');
    assert.equal(doubleSelector[0].innerHTML, 'Double filtered paragraph');
    assert.throws(function() { return defaultSelector[0].innerHTML; }, TypeError);
  });

  it('should check the outerHTML property', function(){
    assert.equal(singleSelector[0].outerHTML, '<h2>This is the first h2 heading</h2>');
    assert.equal(singleSelector[1].outerHTML, '<h2>Followed by another h2 heading</h2>');
    assert.equal(doubleSelector[0].outerHTML, '<p>Double filtered paragraph</p>');
    assert.throws(function() { return defaultSelector[0].outerHTML; }, TypeError);
  });

  it('should check the children() method', function(){
    assert.equal(singleSelector[0].children().length, 1);
    assert.equal(defaultSelector.children().length, 0);
  });

  it('should check the secondCall selector and the $.init() function', function() {
    var secondCall = $('secondCall');
    assert.deepEqual(secondCall, defaultSelector);
    secondCall = $('secondCall');
    assert.deepEqual(secondCall, singleSelector);

    $.init();
    secondCall = $('secondCall');
    assert.deepEqual(secondCall, defaultSelector);
    secondCall = $('secondCall');
    assert.deepEqual(secondCall, singleSelector);
  });

  it('should test the $.makeArray() method', function(){
    assert.ifError(_.isArray(singleSelector));
    var arrSingleSelector = $.makeArray(singleSelector);
    assert.ok(_.isArray(arrSingleSelector));
    assert.deepEqual(arrSingleSelector[0], singleSelector[0]);
    assert.deepEqual(arrSingleSelector[1], singleSelector[1]);
  });
});

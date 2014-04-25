/**
 * Created by tomasnovella on 4/25/14.
 */
var assert = require('assert');

var jQueryMock = require('../libs/jquery-mock');

var exceptions = require('./exceptions');
var core = require('./core');

core.testInit(jQueryMock);


describe('interpreter core', function() {
  it('should verify whether the core interprets scraping directives', function() {
    var rep1 = [['!replace']]

  });
});

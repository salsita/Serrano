/**
 * Created by tomasnovella on 5/12/14.
 */

//var assert = require('assert');
//
//var commands = require('./commands');
//
//
//var core = require('./core');
//
//// tests:
//describe('module for testing Serrano core', function() {
//  it('should verify whether the core works well with the storage when executing commands'+
//    ' and everything is put together well', function() {
//    commands.__setJQuery(require('../libs/jquery-mock'));
//
//    commands.addCommands({
//      constant: {
//        argumentCount: '1',
//        implicitForeach: false,
//        code: function(c) { return c; }
//      }
//    });
//    var json = { // todo we need to discuss scraping unit first
//      _tmp: {
//        tmp1: ['!setVal', "Tomas Novella", 'myname']
//      },
//      name : ['!replace', 'Hello Roman!', 'Roman', ['!getVal', 'myname']]
//    };
//    assert.deepEqual(core.runJson(json), {name: 'Hello Tomas Novella!'});

    //assert.equal(core.interpretScrapingDirective(json.name), 'Hello world!');
    //assert.equal(core.interpretScrapingDirective([]), 'myValue');
//
//  });
//});
//

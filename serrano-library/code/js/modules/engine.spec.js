/**
 * Created by tomasnovella on 8/7/14.
 */

var assert = require('assert');

var commands = require('./commands');
var engine = require('./engine');

describe('module providing engine functionality', function() {
  before(function() {
    commands.addCommands({
      templateConstant: {
        argumentCount: '1',
        code: function(context, arg1) {
          return [arg1, context.template];
        }
      }
    });
  });

  after(function() {
    commands.init();
  });

  it('should check the engine.exec functionality', function() {
    var templateContext = { name: 'Fry' };

    engine.setRules({ // single `actions` rules
      scraping: 'whatever',
      actions: ['!templateConstant', 'action']
    });

    // correct input
    assert.deepEqual(engine.exec(), ["action",{}]);
    assert.deepEqual(engine.exec(templateContext), ["action", templateContext]);

    // incorrect input
    assert.throws(function() {engine.exec('nonExistingValue');}, Error);
    assert.throws(function() {engine.exec('nonExistingValue', templateContext);}, Error);


    engine.setRules({ // multiple `actions` rules
      scraping: 'whatever',
      actions: {
        first: ['!templateConstant', 'firstAction'],
        second: ['!templateConstant', 'secondAction']
      }
    });

    // correct input
    assert.deepEqual(engine.exec('first'), ['firstAction', {}]);
    assert.deepEqual(engine.exec('second'), ['secondAction', {}]);

    assert.deepEqual(engine.exec('first', templateContext), ['firstAction', templateContext]);
    assert.deepEqual(engine.exec('second', templateContext), ['secondAction', templateContext]);


    // incorrect input
    assert.throws(function() { engine.exec(); }, Error);
    assert.throws(function() { engine.exec(templateContext); }, Error);

    assert.throws(function() { engine.exec('notFound'); }, Error);
    assert.throws(function() { engine.exec('notFound', templateContext); }, Error);
  });

  it('should check the engine.scrape functionality', function() {

    engine.setRules({
      scraping: {result: ['!constant', 'const']},
      actions: 'whatever'
    });
    console.log(JSON.stringify(engine.scrape())); // todo returns {}
    //assert.deepEqual(engine.scrape(), 'const');

    engine.setRules({
      scraping: {
        first: {result: ['!constant', 'constFirst']},
        second: {result: ['!constant', 'constSecond']}
      },
      actions: 'whatever'
    });

  });
});

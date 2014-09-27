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
      },
      processedConstant: {
        argumentCount: '1',
        code: function(context, c) {
          return c;
        }
      }
    });
  });

  after(function() {
    commands.init(); // remove my unit-testing commands
  });

  it('should check the engine.exec functionality', function() {
    var templateContext = { name: 'Fry' };

    engine.setRules({ // single `actions` rules
      scraping: 'whatever',
      actions: ['!templateConstant', 'action']
    });

    // correct input
    assert.deepEqual(engine.exec(), ['action',{}]);
    assert.deepEqual(engine.exec(templateContext), ['action', templateContext]);

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

    // empty rules object manipulation
    engine.setRules({});
    assert.throws(function() {engine.exec();}, Error);
    assert.throws(function() {engine.exec('notFound');}, Error);
  });

  // there must be more 'it's because here we are working with promises
  // so we need to use done() statements
  // (I mean the done() statement that is sometimes the parameter of 'it's function,
  // not the one that is a part of promise API)
  describe('engine.scrape, when engine.scrape is scraping unit', function() {
    before(function() {
      engine.setRules({
        scraping: {result: ['!constant', 'const']},
        actions: 'whatever'
      });
    });

    it('should check correct example', function(done) {
      engine.scrape().then(function(res) {
        assert.strictEqual(res, 'const');
        done();
      }).done();
    });

    it('should check if throws error on accessing nonexistent key', function() {
      assert.throws( function() {engine.scrape('notFound').done();}, Error);
    });
  });

  describe('engine.scrape, when engine.scrape is an object', function() {
    beforeEach(function() {
      engine.setRules({
        scraping: {
          first: {result: ['!constant', 'constFirst']},
          second: {result: ['!constant', 'constSecond']},
          townName: {result: ['!processedConstant', 'Is {{town}}']}
        },
        actions: 'whatever'
      });
    });

    it('should check accessing correct key', function(done) {
      engine.scrape('first').then(function(res) {
        assert.strictEqual(res, 'constFirst');
        done();
      }).done();
    });

    it('should check accessing nonexistent key', function() {
      assert.throws(function() {engine.scrape('notFound').done();}, Error);
    });

    it('should check scraping with no arguments', function() {
      assert.throws(function() {engine.scrape().done();}, Error);
    });

    it('should check whether errors are thrown properly if there is no rules.scraping', function() {
      engine.setRules({});
      assert.throws(function() {engine.scrape();}, Error);
      assert.throws(function() {engine.scrape('notFound');}, Error);
    });
    it('should check if templates are correctly rendered', function(done) {
      engine.scrape('townName', {town: 'Goettingen'}).then(function(res) {
        assert.strictEqual(res, 'Is Goettingen');
        done();
      }).done();
    });
  });
});

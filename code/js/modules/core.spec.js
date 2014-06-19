/**
 * Created by tomasnovella on 5/12/14.
 */

var assert = require('assert');

var commands = require('./commands');
var exceptions = require('./exceptions');
var core = require('./core');

describe('module for testing Serrano core', function() {
  beforeEach(function(){
    var mockJQuery = require('../libs/jquery-mock');
    mockJQuery.init();
    commands.__setJQuery(mockJQuery);
    core.__setJQuery(mockJQuery);
  });

  it('should check the `interpretScrapingDirective` function', function() {
    // define instructions
    var context = {storage: {}},
      interpret =  function(directive, implicitArgument) { // shortcut
        return core.interpretScrapingDirective(directive, context, implicitArgument);
      },
      setV = ['!setVal', 'Tomas', 'myname'],
      cmd = ['!replace', 'Hello Roman!', 'Roman', ['!getVal', 'myname']],
      sel = ['$h2'],
      instr = [['$h2'],['>$p'], ['>!prop', 'outerHTML'],['>!replace', 'p>', 're>'], ['>!first']];

    // now run them one after another
    assert.strictEqual(interpret(setV), 'Tomas');
    assert.strictEqual(interpret(cmd), 'Hello Tomas!');
    assert.strictEqual(interpret(['>!len'],interpret(sel)), 2);
    assert.deepEqual(interpret(instr), '<re>Double filtered paragraph</re>');
  });

  it('should verify if `temp` from scraping unit is correctly processed', function() {
    var temp = {
      tmpVar0: ['!constant', 'tmpVal0'],
      tmpVar1: { // ok
        prio: 1,
        code: ['!getVal', 'tmpVar0']
      }
    };
    var context = { storage:{} };
    core.processTemp(temp, context);
    assert.strictEqual(context.storage.tmpVar0, 'tmpVal0');
    assert.strictEqual(context.storage.tmpVar0, 'tmpVal0');

    context = {storage:{}};
    var tempError = {
      tmpVar0: ['!constant', 'tmpVal0'],
      tmpVar1: { // ok
        prio: 1,
        code: ['!getVal', 'tmpVar0']
      },
      tmpVar2: { // problem, needs value from action of lower importance (higher number)
        prio: 2,
        code: ['!getVal', 'tmpVar3']
      },
      tmpVar3: {
        prio: 3,
        code: ['!constant', 'tmpVal3']
      }
    };

    assert.throws(function(){ core.processTemp(tempError, context); }, exceptions.RuntimeError);

    var temp2 = {
      tmpVar0: ['!constant', 'tmpVal0'],
      tmpVar1: { // ok
        prio: 1,
        code: ['!getVal', 'tmpVar0']
      },
      tmpVar2: {
        prio: 2,
        code: ['!getVal', 'tmpVar3']
      },
      tmpVar3: {
        prio: 0,
        code: ['!constant', 'tmpVal3']
      }
    };

    context = { storage:{} };
    core.processTemp(temp2, context);
    assert.strictEqual(context.storage.tmpVar0, 'tmpVal0');
    assert.strictEqual(context.storage.tmpVar1, 'tmpVal0');
    assert.strictEqual(context.storage.tmpVar2, 'tmpVal3');
    assert.strictEqual(context.storage.tmpVar3, 'tmpVal3');
  });

  it('should verify if `result` from scraping unit is correctly processed', function() {
    var result1 = ['!constant', 1],
      result2 = {
        name: ['!constant', 'Tomas'],
        surname: ['!constant', 'Novella']
      },
      result3 = {
        name: ['!constant', 'Tomas'],
        surname: ['!constantttttt', 'Novella']
      };
    assert.deepEqual(core.processResult(result1), 1);
    assert.deepEqual(core.processResult(result2), {name:'Tomas', surname:'Novella'});
    assert.throws(function(){ core.processResult(result3); }, TypeError);
  });

  it('should verify if `waitFor` from scraping unit is correctly processed', function(done) {
    var scrapingUnit1 = {
      waitFor: {
        name: 'secondCall',
        millis: 1000
      },
      result: [['$secondCall'], ['>!first'], ['>!prop', 'innerHTML']]
    };

    core.interpretScrapingUnit(scrapingUnit1,
      function(data){
        assert.strictEqual(data, 'This is the first h2 heading');
        done();
      },
      done // error function
    );
  });

  it('should verify if `waitFor` fails when it should', function(done){
    var scrapingUnit2 = {
      waitFor: {
        name: 'neverCall',
        millis: 700
      },
      result: [['$secondCall'], ['>!first'], ['>!prop', 'innerHTML']]
    };
    core.interpretScrapingUnit(scrapingUnit2,
      done, // error
      function(){
        done();
      }
    );
  });
});


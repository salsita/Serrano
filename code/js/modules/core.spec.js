/**
 * Created by tomasnovella on 5/12/14.
 */

var assert = require('assert');

var commands = require('./commands');
var exceptions = require('./exceptions');
var core = require('./core');

describe('module for testing Serrano core', function() {
  before(function(){
    commands.__setJQuery(require('../libs/jquery-mock'));
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

  it('should verify if `actions` from scraping unit is correctly processed', function() {
  });
  it('should verify if `temp` from scraping unit is correctly processed', function() {
    var ctx = {storage:{}};

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

    assert.throws(function(){core.processTemp(tempError, context)}, exceptions.RuntimeError);
  });

  it('should verify if `result` from scraping unit is correctly processed', function() {

  });
  it('should verify if `waitFor` from scraping unit is correctly processed', function() {

  });
});


/**
 * Created by tomasnovella on 8/7/14.
 */
var assert = require('assert');

var interpreter = require('./interpreter');
var mockJQuery = require('../libs/jquery-mock');

describe('module for the main interpreter', function() {
  function createMockContext() {
    var context = require('./interpreter').createContext();
    context.$ = mockJQuery;
    return context;
  }
  // it is well-tested in commands.spec.js - so just a few quick tests now.
  it('should verify if the directives are correnctly interpreted', function(){
    var context = createMockContext();

    var interpret =  function(directive, implicitArgument) { // shortcut
        return interpreter.interpretScrapingDirective(directive, context, implicitArgument);
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

  it('should check if the context is cloned deeply', function() {
    assert.deepEqual(interpreter.createContext(), interpreter.createContext());

    var ctx1 = interpreter.createContext();
    ctx1.storage.key1 = 5;
    var ctx2 = interpreter.createContext();

    assert.notDeepEqual(ctx1.storage, ctx2.storage);
  });
});

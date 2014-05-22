/**
 * Created by tomasnovella on 5/12/14.
 */

var assert = require('assert');

var commands = require('./commands');

var core = require('./core');

describe('module for testing Serrano core', function() {
  it('should verify whether the core works well with the storage when executing commands'+
    ' and everything is put together well', function() {
    commands.__setJQuery(require('../libs/jquery-mock'));

    commands.addCommands({
      constant: {
        argumentCount: '1',
        implicitForeach: false,
        code: function(c) { return c; }
      }
    });

    // define instructions
    var interpret = core.interpretScrapingDirective,
      setV = ['!setVal', 'Tomas', 'myname'],
      cmd = ['!replace', 'Hello Roman!', 'Roman', ['!getVal', 'myname']],
      sel = ['$h2'],
      instr = [['$h2'],['>$p'], ['>!prop', 'outerHTML'],['>!replace', 'p>', 're>'], ['>!first']];

    // now run them one after another
    assert.strictEqual(interpret(setV), 'Tomas');
    assert.strictEqual(interpret(cmd), 'Hello Tomas!');
    console.log(interpret(instr));
    assert.strictEqual(interpret(['>!len'],interpret(sel)), 2);
    assert.deepEqual(interpret(instr), '<re>Double filtered paragraph</re>');

  });
});


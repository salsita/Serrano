/**
 * Created by tomasnovella on 5/15/14.
 */

var assert = require('assert');
var _ = require('../libs/lodash');
var exceptions = require('./exceptions');
var commands = require('./commands');


describe('module for testing commands module', function() {

    commands.__setJQuery(require('../libs/jquery-mock'));
    commands.__setStorage(require('./storageFactory').createStorage());

    commands.init(); // I want the basic set of commands



    var _cmd = commands.getCommand; // shortcut
    var _cmdCode = function (commandName) {
      return _cmd(commandName).code.bind(commands.getCommands());
    };

    it('should verify if the default signature is set correctly', function() {
      commands.addCommands({
        defaultCommand: {
        }
      });
      var defaultCmd = _cmd('defaultCommand');

      assert.strictEqual(defaultCmd.argumentCount, '');
      assert.strictEqual(defaultCmd.implicitForeach, true);
      assert.deepEqual(defaultCmd.rawArguments, '');
      assert.throws(function(){ defaultCmd.code(); });
    });


    it('jQuery-based element(s) selecting', function(){
      var jq = _cmdCode('jQuery'),
        jqOneArgument = jq('h2'),
        jqTwoArguments = jq('body', 'p'),// [['$body'], ['>$p']] // reverser order
        jqEmpty = jq('whatever');

      // two <h2> elements
      assert.strictEqual(jqOneArgument.length, 2);

      // <p>
      assert.strictEqual(jqTwoArguments.length, 1);

      // nothing
      assert.strictEqual(jqEmpty.length, 0);
    });

});

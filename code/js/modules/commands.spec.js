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

    it('getVal/setVal commands', function(){
      _cmdCode('setVal')('Test storage value', 'mykey');
      assert.strictEqual(_cmdCode('getVal')('mykey'), 'Test storage value');
      assert.throws( function() {_cmdCode('getVal')('undefinedKey');}, exceptions.RuntimeError);
    });

    it('conditions', function(){
      var exists = _cmdCode('exists'),
        nexists = _cmdCode('nexists');

      assert.ifError(exists(null));
      assert.ifError(exists(undefined));
      assert.ifError(!nexists(null));
      assert.ifError(!nexists(undefined));

      assert.ok(exists(''));
      assert.ok(exists({}));
      assert.ok(exists(0));
      assert.ifError(nexists(''));
      assert.ifError(nexists({}));
      assert.ifError(nexists(0));

      var empty = _cmdCode('empty'),
        nempty = _cmdCode('nempty');


      assert.ok(empty([]));
      assert.ok(empty({}));
      assert.ifError(nempty([]));
      assert.ifError(nempty({}));

      assert.ifError(empty([1]));
      assert.ifError(empty({a:1}));
      assert.ok(nempty([1]));
      assert.ok(nempty({a:1}));


      // comparisons
      var lt = _cmdCode('lt'),
        le = _cmdCode('le'),
        gt = _cmdCode('gt'),
        ge = _cmdCode('ge'),
        eq = _cmdCode('eq'),
        neq = _cmdCode('neq');

      assert.ok(lt(4, 5));
      assert.ifError(lt(5, 5));
      assert.ifError(lt(6, 5));

      assert.ok(le(4, 5));
      assert.ok(le(5, 5));
      assert.ifError(le(6, 5));

      assert.ok(gt(5, 4));
      assert.ifError(gt(5, 5));
      assert.ifError(gt(5, 6));

      assert.ok(ge(5, 4));
      assert.ok(ge(5, 5));
      assert.ifError(ge(5, 6));

      assert.ok(eq(42, 42));
      assert.ok(eq(42, '42'));
      assert.ifError(eq(6, 5));

      assert.ifError(neq(47, 47));
      assert.ifError(neq(47,'47'));
      assert.ok(neq(6, 5));

      // and, all, or, any
      // will only test `and` and `or` since `all` and `any` are just synonyms
      var and = _cmdCode('and'),
        or = _cmdCode('or'),
        land = _cmdCode('>and'),
        lor = _cmdCode('>or');

      assert.ok(and(true, true, true));
      assert.ifError(and(true, false, true));
      assert.ok(or(true, false, true));
      assert.ifError(or(false, false, false));

      assert.ok(land(5, ['>!lt', 6], ['>!gt', 4]));
      assert.ifError(land(5, ['>!lt', 6], ['>!gt', 4], ['>!lt', 0]));

      assert.ok(lor(5, ['>!lt', 6], ['>!gt', 4]));
      assert.ok(lor(5, ['>!lt', 6], ['>!gt', 4], ['>!lt', 0]));
      assert.ifError(lor(5, ['>!lt', 0]));
    });

    it('converting argument into true array (arr)', function(){
      var arr = _cmdCode('arr'),
        arrSelector = arr(_cmdCode('jQuery')('h2'));

      assert.ok(_.isArray(arrSelector));
      assert.strictEqual(arrSelector.length, 2);
    });

    it('access object properties (prop)', function() {
      var prop = _cmdCode('prop'),
        obj = {
          0: {pr:1, i:3},
          1: {pr:2, i:4},
          length: 2, // length property is crucial
          pr: 'outer property'
        };

      assert.strictEqual(prop(obj, 'pr'), 'outer property');
      assert.deepEqual(prop(obj, 'pr', 'inner'), [1, 2]);
      assert.deepEqual(prop(obj, 'i'), [3, 4]);
    });

    it('object method invocation (call, apply)', function() {
      var call = _cmdCode('call'),
        apply = _cmdCode('apply');

      assert(call('serrano', 'toUpperCase'), 'SERRANO');
      assert(apply('test?driven development','replace',['?','-']),
        'test-driven development');

      // inner property
      var inn = {
        0: { plus:function(x,y){return (x?x:0) + (y?y:0);}, c:function(x){return (x?x:13);} },
        1: { plus:function(x,y){return (x?x:0) + (y?y:0);}, c:function(x){return (x?x:13);} },
        plus: function(x,y){return 'outer plus='+( (x?x:0) + (y?y:0));},
        length: 2
      };

      // Three test cases for `call` and `apply`:
      // 1. invoke outer method
      // 2. by setting 'inner', invoke inner method
      // 3. invoke inner method because element doesn't have outer function w that name
      assert.strictEqual(call(inn, 'plus'), 'outer plus=0');
      assert.deepEqual(call(inn, 'plus', 'inner'), [0, 0]);
      assert.deepEqual(call(inn, 'c'), [13, 13]);

      assert.strictEqual(apply(inn, 'plus', [1,2]), 'outer plus=3');
      assert.deepEqual(apply(inn, 'plus', [1,2], 'inner'), [3, 3]);
      assert.deepEqual(apply(inn, 'c', [5]), [5, 5]);
    });

    it('code branching (if)', function() {
      var cond = _cmdCode('if');

      commands.addCommands({
        constant: {
          argumentCount: '1',
          rawArguments: '0',
          code: function(x) {return x;}
        }
      });

      assert.strictEqual(cond(true, ['!constant', 'Yes'], ['!constant', 'No']), 'Yes');
      assert.strictEqual(cond(true, ['!constant', 'Yes']), 'Yes');
      assert.strictEqual(cond(false, ['!constant', 'Yes'], ['!constant', 'No']), 'No');
    });

    it('filtering (filter)', function() {
      var filter = _cmdCode('filter'),
        ages = [2,4,6,8,10,1,3,5,7,9];

      assert.deepEqual(filter(ages, ['>!lt', 5]), [2,4,1,3]);
    });
});

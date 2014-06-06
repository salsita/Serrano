/**
 * Created by tomasnovella on 5/15/14.
 */

var assert = require('assert');
var _ = require('../libs/lodash');
var exceptions = require('./exceptions');
var commands = require('./commands');
var core = require('./core');

describe('module for testing commands module', function() {
  commands.__setJQuery(require('../libs/jquery-mock'));
  commands.init(); // I want the basic set of commands

  var _i = core.interpretScrapingDirective; // shortcut

  it('should verify if the default signature is set correctly', function() {
    commands.addCommands({
      defaultCommand: {
      }
    });
    var defaultCmd = commands.getCommand('defaultCommand');

    assert.strictEqual(defaultCmd.argumentCount, '');
    assert.strictEqual(defaultCmd.implicitForeach, true);
    assert.strictEqual(defaultCmd.rawArguments, '');
    assert.throws(function(){ defaultCmd.code(); });
  });


  it('should check the !constant command', function(){
    var arr = [5,3,5,8,9,7,9,3,2,3],
      str = 'test string',
      bool = true;

    assert.deepEqual(_i(['!constant', arr]), arr);
    assert.deepEqual(_i(['!constant', str]), str);
    assert.deepEqual(_i(['!constant', bool]), bool);
  });

  it('jQuery-based element(s) selecting', function() {
    // two <h2> elements
    assert.strictEqual(_i([['$h2'], ['>!len']]), 2);

    // <p>
    assert.strictEqual(_i([['$body'],['>$p'], ['>!len']]), 1);

    // nothing
    assert.strictEqual(_i([['$h16'], ['>!len']]), 0);
  });

  it('getVal/setVal commands', function(){
    _i(['!setVal', 'Test storage value', 'mykey']);
    assert.strictEqual(_i(['!getVal', 'mykey']), 'Test storage value');
    assert.throws(function() {_i(['!getVal', 'undefinedKey']);}, exceptions.RuntimeError);
  });

  describe('conditions', function(){
    it('should verify existence tests', function(){
      assert.ifError(_i(['!exists', null]));
      assert.ifError(_i(['!exists', undefined]));
      assert.ok(_i(['!nexists', null]));
      assert.ok(_i(['!nexists', undefined]));

      assert.ok(_i(['!exists', '']));
      assert.ok(_i(['!exists', {}]));
      assert.ok(_i(['!exists', 0]));
      assert.ifError(_i(['!nexists', '']));
      assert.ifError(_i(['!nexists', {}]));
      assert.ifError(_i(['!nexists', 0]));
    });

    it('should verify empty/nempty commands', function() {
      assert.ok(_i(['!empty', []]));
      assert.ok(_i(['!empty', {}]));

      assert.ifError(_i(['!nempty', []]));
      assert.ifError(_i(['!nempty', {}]));

      assert.ifError(_i(['!empty', [1]]));
      assert.ifError(_i(['!empty', {a:1}]));

      assert.ok(_i(['!nempty', [1]]));
      assert.ok(_i(['!nempty', {a:1}]));
    });

    it('should verify comparison commands', function(){
      assert.ok(_i(['!lt', 4, 5]));
      assert.ifError(_i(['!lt', 5, 5]));
      assert.ifError(_i(['!lt', 6, 5]));

      assert.ok(_i(['!le', 4, 5]));
      assert.ok(_i(['!le', 5, 5]));
      assert.ifError(_i(['!le', 6, 5]));

      assert.ok(_i(['!gt', 5, 4]));
      assert.ifError(_i(['!gt', 5, 5]));
      assert.ifError(_i(['!gt', 5, 6]));

      assert.ok(_i(['!ge', 5, 4]));
      assert.ok(_i(['!ge', 5, 5]));
      assert.ifError(_i(['!ge', 5, 6]));

      assert.ok(_i(['!eq', 42, 42]));
      assert.ok(_i(['!eq', 42, '42']));
      assert.ifError(_i(['!eq', 6, 5]));

      assert.ifError(_i(['!neq', 47, 47]));
      assert.ifError(_i(['!neq', 47,'47']));
      assert.ok(_i(['!neq', 6, 5]));
    });

    it('should verify logical and, or, >and, >or', function() {
      // and, all, or, any
      // will only test `and` and `or` since `all` and `any` are just synonyms

      assert.ok(_i(['!and', true, true, true]));
      assert.ifError(_i(['!and', true, false, true]));
      assert.ok(_i(['!or', true, false, true]));
      assert.ifError(_i(['!or', false, false, false]));

      assert.ok(_i([['!constant', 5],['>!and', ['>!lt', 6], ['>!gt', 4]]]));
      assert.ifError(_i([  ['!constant', 5], ['>!and', ['>!lt', 6], ['>!gt', 4], ['>!lt', 0]]  ]));

      assert.ok(_i([['!constant', 5], ['>!or', ['>!lt', 6], ['>!gt', 4]] ]));
      assert.ok(_i([['!constant', 5], ['>!or', ['>!lt', 6], ['>!gt', 4], ['>!lt', 0]] ]));
      assert.ifError(_i( [['!constant', 5], ['>!or', ['>!lt', 0]]] ));
    });
  });

  // ---
  // note: '!arr' is not tested, since I'd be only testing my mock $.makeArray function...
  // the real $.makeArray cannot be tested since jQuery cannot be loaded with the absence of DOM
  // ---

  it('access object properties (prop)', function() {
    var obj = {
        0: {pr:1, i:3},
        1: {pr:2, i:4},
        length: 2, // length property is crucial
        pr: 'outer property'
      };

    assert.strictEqual(_i(['!prop', obj, 'pr']), 'outer property');
    assert.deepEqual(_i(['!prop', obj, 'pr', 'inner']), [1, 2]);
    assert.deepEqual(_i(['!prop', obj, 'i']), [3, 4]);

    assert.deepEqual(_i(['!prop', undefined, 'prop']), []);
    assert.deepEqual(_i(['!prop', null, 'prop']), []);
    assert.deepEqual(_i(['!prop', 1, 'prop']), []);

    //first tries access hello['prop'], fails and tries on every element of the object
    assert.deepEqual(_i(['!prop', 'hello', 'prop']), [undefined,undefined,undefined,undefined, undefined]);
    assert.deepEqual(_i(['!prop', [0,1,2], 'prop']), [undefined, undefined, undefined]);

    assert.deepEqual(_i(['!prop', 'hello', 'length']), 5);
    assert.deepEqual(_i(['!prop', [0,1,2], 'length']), 3);
  });

  it('object method invocation (call, apply)', function() {
    assert.strictEqual(_i(['!call', 'serrano', 'toUpperCase']), 'SERRANO');
    assert.strictEqual(_i(['!apply', 'test?driven development', 'replace', ['?','-'] ]),
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

    assert.strictEqual(_i(['!call', inn, 'plus']), 'outer plus=0');
    assert.deepEqual(_i(['!call', inn, 'plus', 'inner']), [0, 0]);
    assert.deepEqual(_i(['!call', inn, 'c']), [13, 13]);

    assert.strictEqual(_i(['!apply', inn, 'plus', [1, 2] ]), 'outer plus=3');
    assert.deepEqual(_i(['!apply', inn, 'plus', [1, 2], 'inner' ]), [3, 3]);
    assert.deepEqual(_i(['!apply', inn, 'c', [5]]), [5, 5]);
  });

  it('code branching (if)', function() {
    assert.strictEqual(_i(['!if', true, ['!constant', 'Yes'], ['!constant', 'No']]), 'Yes');
    assert.strictEqual(_i(['!if', ['!eq', 1, 1], ['!constant', 'Yes']]), 'Yes');
    assert.strictEqual(_i(['!if', false, ['!constant', 'Yes'], ['!constant', 'No']]), 'No');
    assert.strictEqual(_i(['!if', false, ['!constant', 'Yes']]), undefined);
  });

  it('filtering (filter)', function() {
    var ages = [2,4,6,8,10,1,3,5,7,9];
    var instr = _i(  [['!constant', ages], ['>!filter',['>!lt', 5]]]  );
    assert.deepEqual(instr, [2,4,1,3]);

    assert.strictEqual(_i( ['!filter', undefined, ['>!lt', 5]]  ), undefined);

    // null < 5 == true (sic!)
    assert.strictEqual(_i( ['!filter', null, ['>!lt', 5]]  ), null);

    assert.strictEqual(_i( ['!filter', 'hello', ['>!eq', 'hello']]  ), 'hello');
    assert.strictEqual(_i( ['!filter', 'hello', ['>!eq', 'world']]  ), undefined);

    // this finds out, which values are `true`
    assert.deepEqual(
      _i( ['!filter',[0, 1, true, null, undefined, false, '', 'he', 5,[]], ['>!eq', true]] ),
      [1,true]);
  });

  it('array reduction (len/at/first/last)', function() {
    var arr = [10,20,30,40,50];

    assert.strictEqual(_i([['!constant', arr], ['>!len']]), 5);
    assert.strictEqual(_i([['!constant', []], ['>!len']]), 0);
    assert.strictEqual(_i([ ['$h2'] , ['>!len']]), 2);
    assert.strictEqual(_i([['!constant', {}], ['>!len']]), 0);
    assert.strictEqual(_i([['!constant', {a:42, b:47}], ['>!len']]), 2);
    assert.strictEqual(_i([['!constant', null], ['>!len']]), 0);
    assert.strictEqual(_i([['!constant', undefined], ['>!len']]), 0);
    assert.strictEqual(_i([['!constant', 'hello'], ['>!len']]), 5);


    assert.strictEqual(_i([['!constant', arr], ['>!at', 0]]), 10);
    assert.strictEqual(_i([['!constant', arr], ['>!at', -2]]), 40);
    assert.deepEqual(_i([['!constant', arr], ['>!at', [0, -2,-6, 5]]]),
      [10, 40, undefined, undefined]);
    assert.deepEqual(_i([['!constant', arr], ['>!at', ['hh', null, undefined]]]),
      [undefined, undefined, undefined]);


    assert.strictEqual(_i(['!first', arr]), 10);
    assert.strictEqual(_i(['!first', [] ]), undefined);
    assert.strictEqual(_i(['!first', {a:42, b:47} ]), undefined);
    assert.strictEqual(_i(['!first', 'hello' ]), 'h');

    assert.strictEqual(_i(['!last', arr ]), 50);
    assert.strictEqual(_i(['!last', [] ]), undefined);
    assert.strictEqual(_i(['!last', {a:42, b:47} ]), undefined);
    assert.strictEqual(_i(['!last', 'hello' ]), 'o');
  });

  describe('arithmetic unit', function(){
    var data = [ 1, -1, 2, 5, 3, 7],
      TOLERANCE = 0.0001;

    it('should check if operations work well on scalar arguments', function(){
      // scalars
      assert.strictEqual(_i(['!+', 3, 5]), 8);
      assert.strictEqual(_i([['!constant', 3], ['!+', 3, 5]]), 8);
      assert.strictEqual(_i(['!-', 3, 5]), -2);
      assert.strictEqual(_i(['!*', 3, 5]), 15);
      assert.strictEqual(_i(['!/', 3, 5]), 0.6);

      // parsing number (parseFloat inside)
      assert.strictEqual(_i(['!+', '3', '5']), 8);
      assert.strictEqual(_i(['!+', '3haha', '5']), 8);
      assert.ok(_.isNaN(_i(['!+', 'haha3haha', '5'])));
    });

    it('should check operations on array + scalar', function() {
      // array + scalar
      assert.deepEqual(_i(['!+', data, 5]), [ 6, 4, 7, 10, 8, 12 ]);
      assert.deepEqual(_i([['!constant', data],['>!+', 5]]), [ 6, 4, 7, 10, 8, 12 ]);
      assert.deepEqual(_i(['!-', 5, data]), [ 4, 6, 3, 0, 2, -2 ]);
      assert.deepEqual(_i(['!*', data, 5]),[ 5, -5, 10, 25, 15, 35 ]);

      var divResults = [ 5, -5, 2.5, 1, 1.6667, 0.7143 ];

      assert.ok(_.all(_i(['!/', 5, data]), function(val, index){
        return Math.abs(val - divResults[index]) < TOLERANCE;
      }));

      assert.deepEqual(_i(['!+', 5, [0, 1, '2', '3three']]), [ 5, 6, 7, 8 ]);
      assert.ok(_.all(_i(['!+', 5, [null, undefined, NaN, 'gg']]), function(val){
        return _.isNaN(val);
      }));
    });

    it('should check operations on array + array', function(){
      // array + array
      assert.deepEqual(_i(['!+', data, data]), [ 2, -2, 4, 10, 6, 14 ]);
      assert.deepEqual(_i(['!-', data, data]), [ 0, 0, 0, 0, 0, 0 ]);
      assert.deepEqual(_i(['!*', data, data]), [ 1, 1, 4, 25, 9, 49 ]);
      assert.deepEqual(_i(['!/', data, data]), [ 1, 1, 1, 1, 1, 1 ]);

      var tmp = [0, 1];
      assert.ok(_.isNaN(_i(['!+', tmp, data])));
    });

    it('should check avg and sum commands', function() {
      // sum
      assert.strictEqual(_i(['!sum', data]), 17);
      assert.strictEqual(_i(['!sum', [1,2,3,'4four']]), 10);
      assert.ok(_.isNaN(_i(['!sum', [1,2,3,'4four', 'five']])));

      // should be an array, not a single value
      assert.throws(function(){ _i(['!sum', 10]); }, exceptions.RuntimeError);
      assert.throws(function(){ _i(['!sum', '10hello']); }, exceptions.RuntimeError);

      // avg
      assert.ok(Math.abs(_i(['!avg', data]) - 2.8333) < TOLERANCE);
      assert.strictEqual(_i(['!avg', [1,2,3]]), 2);
      assert.ok(_.isNaN(_i(['!avg', [1,2,'3three','four']])))
    });
  });


  it('convenience commands (concat, union, splice, join', function() {
    assert.deepEqual(_i(['!concat', [1, 2, 3], [2, 3, 4], [5]]), [1, 2, 3, 2, 3, 4, 5]);
    assert.deepEqual(_i(['!concat', [1, false, 2],['s'], 3, undefined, 4, null,['hello']]),
      [1, false, 2, 's', 3, undefined, 4, null, 'hello']);


    assert.deepEqual(_i(['!union', [1,2,3], [2,3,4],[5]]), [1,2,3,4,5]);
    assert.deepEqual(_i(['!union', [1,2,3], 's', 5, ['hello'], 3, ['s']]),
      [1, 2, 3, 's', 5, 'hello']);

    assert.deepEqual(_i(['!splice', [10,20,30,40,50], 1, 3]), [10,50]);
    assert.deepEqual(_i(['!splice', [10,20,30,40,50], -4, 3]), [10,50]);

    //out of range in the positive direction - return whole array
    assert.deepEqual(_i(['!splice', [10,20,30,40,50], 5, 1]), [10, 20, 30, 40, 50]);
    //out of range in the negative direction - return whole array - weird behavior
    assert.deepEqual(_i(['!splice', [10,20,30,40,50], -7, 2]), [10, 20, 30]);


    assert.strictEqual(_i(['!join', ['A','P','W','B', 'Dumbledore'], '. ']),
      'A. P. W. B. Dumbledore');
    assert.strictEqual(_i(['!join', [1, 'ser', 2, 'rano'], '.']), '1.ser.2.rano');
    assert.strictEqual(_i(['!join', ['ser', 'rano', undefined, null, false], '.']),
      'ser.rano...false');
    assert.strictEqual(_i(['!join', [1, 'ser', 2, 'rano'], 5]), '15ser525rano');
    assert.strictEqual(_i(['!join', ['ser', 'rano'], 5]), 'ser5rano');
    assert.strictEqual(_i(['!join', ['.', '.'], [1,3]]), '.1,3.');
    assert.strictEqual(_i(['!join', [], [1,3]]), '');
  });

  it('more convenience commands (lower/upper, trim, split, substr, replace)', function(){
    assert.strictEqual(_i(['!upper', 'serrano']), 'SERRANO');
    assert.strictEqual(_i(['!lower', 'SERRANO']), 'serrano');

    assert.deepEqual(_i([['!constant', ['hello', 'world']], ['>!upper']]), ['HELLO', 'WORLD']);
    assert.deepEqual(_i([['!constant', ['HELLO', 'WORLD']], ['>!lower']]), ['hello', 'world']);

    assert.throws(function() {_i([['!constant', ['HELLO', 'WORLD', 5]], ['>!lower']])},
      TypeError);

    assert.throws(function() { _i(['!lower', 5]); }, TypeError);
    assert.throws(function() { _i(['!lower', {}]); }, TypeError);
    assert.throws(function() { _i(['!lower', undefined]); }, TypeError);
    assert.throws(function() { _i(['!lower', null]); }, TypeError);

    assert.throws(function() { _i(['!upper', 5]); }, TypeError);
    assert.throws(function() { _i(['!upper', {}]); }, TypeError);
    assert.throws(function() { _i(['!upper', undefined]); }, TypeError);
    assert.throws(function() { _i(['!upper', null]); }, TypeError);


    assert.strictEqual(_i(['!trim', '\t\ntrimmed   \t  ']), 'trimmed');
    assert.throws(function() {_i(['!trim', 5]);}, TypeError);


    assert.deepEqual(_i(['!split', '24.12.2014', '.']), ['24','12','2014']);

    assert.deepEqual(_i(['!split', '24.12.2014', '.,']), ['24.12.2014']);
    assert.deepEqual(_i(['!split', '24.12.2014', 'haha']), ['24.12.2014']);
    assert.deepEqual(_i(['!split', '24.12.2014', 5]), ['24.12.2014']);
    assert.deepEqual(_i(['!split', '24.12.2014', undefined]), ['24.12.2014']);
    assert.deepEqual(_i(['!split', '24.12.2014', null]), ['24.12.2014']);

    assert.strictEqual(_i(['!substr', 'serrano', 4]), 'ano');
    assert.strictEqual(_i(['!substr', 'serrano', 1, 3]), 'err');
    assert.throws(function() { _i(['!substr', ['serrano'], 1, 3]); }, TypeError);
    assert.throws(function() { _i(['!substr', null, 1, 3]); }, TypeError);


    assert.strictEqual(_i(['!replace', 'Hello Hello world', 'Hello', 'Goodbye']),
      'Goodbye Goodbye world');

    assert.strictEqual(_i(['!replace', 'Hello Hello world', 'pHello', 'Goodbye']),
      'Hello Hello world');

    assert.strictEqual(_i(['!replace', 'Hello Hello world', 'Hello', 5]),
      '5 5 world');

    assert.strictEqual(_i(['!replace', 'Hello Hello world', 'Hello', 5]),
      '5 5 world');

    // 1337 5p34k
    assert.strictEqual(_i([['!replace', 'hello', 'e','3'], ['>!replace', 'l', 1],
      ['>!replace', 'o', 0]]), 'h3110');
  });
});

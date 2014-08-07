/**
 * Created by tomasnovella on 5/12/14.
 */

var assert = require('assert');
var Q = require('../libs/q');
var mockJQuery = require('../libs/jquery-mock');
var core = require('./scrapingUnit');

describe('module for testing Serrano core', function() {
  function createMockContext() {
    var context = require('./interpreter').createContext();
    context.$ = mockJQuery;
    return context;
  }

  it('should verify if `temp` from scraping unit is correctly processed', function() {
    var temp = {
      tmpVar0: ['!constant', 'tmpVal0'],
      tmpVar1: ['!getVal', 'tmpVar0']
    };

    var context = createMockContext();
    core.processTemp(temp, context);
    assert.strictEqual(context.storage.tmpVar0, 'tmpVal0');
    assert.strictEqual(context.storage.tmpVar0, 'tmpVal0');

    context = createMockContext();
    var tempError = {
      tmpVar0: ['!constant', 'tmpVal0'],
      tmpVar1:  ['!getVal', 'tmpVar0'],
      tmpVar2: ['!getVal', 'tmpVar3'], // this is undefined because of the order of execution...
      tmpVar3: ['!constant', 'tmpVal3']
    };
    core.processTemp(tempError, context);
    assert.strictEqual(context.storage.tmpVar0, 'tmpVal0');
    assert.strictEqual(context.storage.tmpVar1, 'tmpVal0');
    assert.strictEqual(context.storage.tmpVar2, undefined);
    assert.strictEqual(context.storage.tmpVar3, 'tmpVal3');

    var temp2 = {
      tmpVar0: ['!constant', 'tmpVal0'],
      tmpVar1: ['!getVal', 'tmpVar0'],
      tmpVar3: ['!constant', 'tmpVal3'],
      tmpVar2: ['!getVal', 'tmpVar3']
    };

    context = createMockContext();
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
    assert.deepEqual(core.processResult(result1, createMockContext()), 1);
    assert.deepEqual(core.processResult(result2, createMockContext()), {name:'Tomas', surname:'Novella'});
    assert.deepEqual(core.processResult(result3, createMockContext()), {name:'Tomas', surname: undefined});

    var nested1 = {
      age: ['!constant', 29],
      name: {
        first: ['!constant', 'Bastian'],
        last: ['!constant', 'Schweinsteiger'],
        nick: {
          old: ['!constant', 'Schweini'],
          new: ['!constant', 'Basti']
        }
      }
    };

    assert.deepEqual(core.processResult(nested1, createMockContext()), {
      age: 29,
      name: {
        first: 'Bastian',
        last: 'Schweinsteiger',
        nick: {
          old: 'Schweini',
          new: 'Basti'
        }
      }
    });
  });

  describe('`waitActionsLoop`', function(){
    beforeEach(function() {
      mockJQuery.init();
    });
    it('should check nonexistent element', function(done) {
      var promise = Q.Promise.resolve('initial promise');
      var waitActionsLoop = [
        [
          ['!constant', 444] // let's just assume I just clicked on something
        ],
        {
          name: '$nonExistingID',
          millis: 40
        }
      ];
      core.processWaitActionsLoop(waitActionsLoop, promise, createMockContext()).catch(
        function(e) {
          // stack: 'RuntimeError: Element with selector $nonExistingID never appeared.\n ...
          assert.strictEqual(e.name, 'RuntimeError');
          done();
        }
      ).done();
    });

    it('should check longer loop with both waits and actions', function(done) {
      var promise = Q.Promise.resolve('initial promise');
      var waitActionsLoop = [
        [
          ['!constant', 444] // let's just assume I just clicked on something
        ],
        {
          name: 'secondCall',
          millis: 120
        },
        [
          ['!constant', 445] // another click
        ],
        {
          name: 'h2',
          millis: 60
        }
      ];
      core.processWaitActionsLoop(waitActionsLoop, promise, createMockContext()).then(
        function() {
          done();
        }
      ).done();
    });
  });

  describe('`interpretScrapingUnit` ', function() {
    beforeEach(function() {
      mockJQuery.init();
    });
    it('should check correct promise flow in case of success', function(done) {
      var scrapingUnit1 = {
        waitFor: {
          name: 'secondCall',
          millis: 1000
        },
        result: [['$secondCall'], ['>!first'], ['>!prop', 'innerHTML']]
      };

      core.interpretScrapingUnit(scrapingUnit1, createMockContext())
        .then(function(data) {
          assert.strictEqual(data, 'This is the first h2 heading');
          done();
        }
      ).done();
    });

    it('should verify failure (element never appears)', function(done){
      var scrapingUnit2 = {
        waitFor: {
          name: '$nonExistingID', // nonexistent element
          millis: 40
        },
        result: [['$h2'], ['>!first'], ['>!prop', 'innerHTML']]
      };
      core.interpretScrapingUnit(scrapingUnit2, createMockContext())
        .catch(function(err) {
          assert.strictEqual(err.name, 'RuntimeError');
          done();
        }
      ).done();
    });

    it('should verify failure (invalid instruction fetching temporary variable)', function(done) {
      var scrapingUnit3 = {
        temp: {
          four: ['!invalidCommand', 4]
        },
        result: [['$h2'], ['>!first'], ['>!prop', 'innerHTML']]
      };

      core.interpretScrapingUnit(scrapingUnit3, createMockContext())
        .catch(function(err) {
          // TypeError: (simplifier) selector/command/instruction expected
          assert.strictEqual(err.name, 'TypeError');
          done();
      }).done();
    });
  });
});

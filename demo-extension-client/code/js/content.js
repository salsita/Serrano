;(function() {
  console.log('CONTENT SCRIPT WORKS!...');

  var $ = require('./libs/jquery');
  var _ = require('../../../serrano-library/code/js/libs/lodash'); // todo
  var serrano;

  function loadOnceSerrano() {
    if(!serrano) {
      serrano = require('../../../serrano-library/build/serrano');
      serrano.logging.setOptions({'environment': 'testing', 'console': true});
    }
  }

  var msg = require('./modules/msg').init('ct', {
    echo: function(res, done) {
      console.log(res);
      done();
    },

    updateScrapingDocument: function(doc, done) {
      loadOnceSerrano();

      serrano.document.load(doc);
      done(_.isPlainObject(serrano.document.getHashTable())? "yep, plain" : "nope");
      return;
      // returns a HashTable so that I can at least check if domain name matches before
      // loading serrano into every page
      //done(serrano.document.getHashTable());
    },

    runScrapingUnit: function(scrapingUnit, done) {
      // test if needs loading serrano

      loadOnceSerrano();
      console.log('content processing');
      serrano.engine.scrapeUnit(scrapingUnit).then(function(res) {
        done(res);
      });
    }
  });
})();

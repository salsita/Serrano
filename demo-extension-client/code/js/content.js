;(function() {
  console.log('CONTENT SCRIPT WORKS!...');

  var $ = require('./libs/jquery');
  //var _ = require('../../../serrano-library/code/js/libs/lodash'); // todo
  var ht;
  var dc;

  var serrano;

  function loadOnceSerrano() {
    if(!serrano) {
      serrano = require('../../../serrano-library/build/serrano');
      serrano.logging.setOptions({'environment': 'testing', 'console': true});
    }
  }
  var handlers;
  var msg = require('./modules/msg').init('ct', handlers);

  handlers = {
    echo: function(res, done) {
      console.log(res);
      done(res);
    },

    updateScrapingDocument: function(doc, done) {
      loadOnceSerrano();

      try{
        serrano.document.load(doc);
      } catch(e) {
        alert("Scraping doc was incorrect!" + e);
      }

      done(serrano.document.getHashTable());
    },

    runScrapingUnit: function(scrapingUnit, done) {
      // test if needs loading serrano

      loadOnceSerrano();
      console.log('content processing');
      serrano.engine.scrapeUnit(scrapingUnit).then(function(res) {
        done(res);
      });
    }
  }

})();

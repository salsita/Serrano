;(function() {
  console.log('CONTENT SCRIPT for serrano command line extension loaded!');

  var serrano;
  require('./modules/msg').init('contentScript', {
    runScrapingUnit: function(scrapingUnit, done) {
      if(!serrano) {
        // quick fix: grunt-browserify can't resolve requires from serrano.js, but 
        // it can from serrano.min.js
        serrano = require('../../../serrano-library/build/serrano.min');
        serrano.logging.config({'environment': 'testing', 'console': true});
        /*global window*/
        window.serranoConsoleExtension.serrano = serrano;
      }
      console.log('content processing');
      serrano.utils.scrapeUnit(scrapingUnit).then(function(res) {
        done(res);
      }).catch(function(reason) {
        done(reason);
      });
    }
  });
})();

;(function() {
  console.log('CONTENT SCRIPT for serrano command line extension loaded!');

  var serrano;
  require('./modules/msg').init('contentScript', {
    runScrapingUnit: function(scrapingUnit, done) {
      if(!serrano) {
        serrano = require('../../../serrano-library/build/serrano');
        serrano.logging.setOptions({'environment': 'testing', 'console': true});
      }
      console.log('content processing');
      serrano.engine.scrapeUnit(scrapingUnit).then(function(res) {
        done(res);
        return;
      });
    }
  });
})();

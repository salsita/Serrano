;(function() {
  console.log('CONTENT SCRIPT for serrano command line extension loaded!');

  var serrano;
  require('./modules/msg').init('contentScript', {
    runScrapingUnit: function(scrapingUnit, done) {
      if(!serrano) {
        serrano = require('../../../serrano-library/build/serrano');
        serrano.logging.config({'environment': 'testing', 'console': true});
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

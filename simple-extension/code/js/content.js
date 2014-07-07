;(function() {
  console.log('CONTENT SCRIPT for serrano command line extension loaded!');

  require('./modules/msg').init('contentScript', {
    runScrapingUnit: function(scrapingUnit, done) {
      var serrano = require('./libs/serrano');
      console.log('content processing');
      serrano.scrapeUnit(scrapingUnit, function(res) {
        done(res);
      });
    }
  });
})();

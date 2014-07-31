;(function() {
  var msg = require('./modules/msg').init('ct', {
    echo: function(res, done) {
      console.log(res);
      done(res);
    }
  });

  msg.bg('getScrapingUnit', document.location.href, function(scrapUnit) {
    if (scrapUnit) {
      var serrano = require('../../../serrano-library/build/serrano');
      serrano.logging.config({'environment': 'testing', 'console': true});

      serrano.engine.scrapeUnit(scrapUnit).then(function(res) {
        console.log('Found scraping unit. The result is below: ');
        console.log(JSON.stringify(res, null, 4));
      });
    } else {
      console.log('No scraping unit found for this URI.');
    }
  });

})();

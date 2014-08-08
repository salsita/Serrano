;(function() {
  var $ = require('./libs/jquery');

  // uri of the JSON page from which scraping document is loaded
  var dataUri = "http://localhost:3000/doc/y9245ebj/data";

  // uri used for polling whether new version of scraping doc is available
  var versionUri = "http://localhost:3000/doc/y9245ebj/version";

  // current version of a scraping doc
  var currentVersion = "0.0.0";

  // if server does not respond (correctly, or at all), this is the time (in seconds)
  // that specifies when to ping the server next.
  var defaultTtl = 5;

  var serrano = require('../../../serrano-library/build/serrano');
  serrano.config({console:true});

  // background provides the content script with a service called "getRules"
  // when the content script sends its uri, the background script looks for
  // a matching scraping unit and sends it. If no scraping unit is found,
  // background sends 'undefined'.
  require('./modules/msg').init('bg', {
    'getScrapingUnit': function(uri, done) {
      var unit = serrano.document.getUnit(uri);
      done(unit);
    }
  });

  /**
   * Updates the scraping document.
   */
  function updateScrapingDoc() {
    $.ajax({
      url: dataUri,
      method: 'get',
      dataType: 'json',
      crossDomain: true
    }).done(function(res) {
        currentVersion = res.version;
        serrano.document.load(res.scrapingDocument);
    }).fail(function(reason) {
      console.log('Failed to load scraping document. '+JSON.stringify(reason, null, 4));
    });
  }

  /**
   * Main loop. Checks if there is a new version of scraping doc available.
   * If so, updates the scraping doc.
   */
  var ttl;
  function mainLoop() {
    $.ajax({
      url: versionUri,
      method: 'get',
      dataType: 'json',
      crossDomain: true//,
    }).done(function(res) {
      ttl = res.ttl;

      if (require('./modules/versionComparer').isNewer(currentVersion, res.version)) {
        currentVersion = res.version;
        updateScrapingDoc();
      }
    }).fail(function(res) {
      ttl = defaultTtl;
      console.log('Unable to poll for the version of scraping doc. ' + JSON.stringify(res));
    }).complete(function() {
      setTimeout(mainLoop, ttl * 1000);
    });
  }

  // run mainloop
  mainLoop();


})();

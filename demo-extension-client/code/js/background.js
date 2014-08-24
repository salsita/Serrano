;(function() {
  var $ = require('./libs/jquery');

  // uri of the JSON page from which global document is loaded
  var dataUri = "http://localhost:3000/doc/y9245ebj/data";

  // uri used for polling whether new version of global doc is available
  var versionUri = "http://localhost:3000/doc/y9245ebj/version";

  // current version of a global doc
  var currentVersion = "0.0.0";

  // if server does not respond (correctly, or at all), this is the time (in seconds)
  // that specifies when to ping the server next.
  var defaultTtl = 5;

  var serrano = require('../../../serrano-library/build/serrano');
  serrano.logging.config({console:true});

  // background provides the content script with a service called "getRules"
  // when the content script sends its uri, the background script looks for
  // a matching rules object and sends it. If no rules object is found,
  // background sends 'undefined'.
  require('./modules/msg').init('bg', {
    'getRules': function(uri, done) {
      var rules = serrano.document.getRules(uri);
      console.log('Rules for URI' + uri +': ');
      if (rules) {
        var desc = require('./modules/RulesDescription').describe(rules);
        console.log(desc);
      } else {
        console.log('No rules found.');
      }
      done(rules);
    }
  });

  /**
   * Updates the global document.
   */
  function updateGlobalDocument() {
    $.ajax({
      url: dataUri,
      method: 'get',
      dataType: 'json',
      crossDomain: true
    }).done(function(res) {
        currentVersion = res.version;
        serrano.document.load(res.globalDocument);
    }).fail(function(reason) {
      console.log('Failed to load global document. '+JSON.stringify(reason, null, 4));
    });
  }

  /**
   * Main loop. Checks if there is a new version of global doc available.
   * If so, updates the global doc.
   */
  var ttl;
  function mainLoop() {
    $.ajax({
      url: versionUri,
      method: 'get',
      dataType: 'json',
      crossDomain: true
    }).done(function(res) {
      ttl = res.ttl;

      if (require('./modules/versionComparer').isNewer(currentVersion, res.version)) {
        currentVersion = res.version;
        updateGlobalDocument();
      }
    }).fail(function(res) {
      ttl = defaultTtl;
      console.log('Unable to poll for the version of global document. ' + JSON.stringify(res));
    }).complete(function() {
      setTimeout(mainLoop, ttl * 1000);
    });
  }

  // run mainloop
  mainLoop();


})();

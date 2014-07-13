;(function() {
  var $ = require('./libs/jquery');
  var dataUrl = "http://localhost:3000/doc/y9245ebj/data";
  var versionUrl = "http://localhost:3000/doc/y9245ebj/version";
  var currentVersion = "0.0.0";
  var ttl = 5;

  var scrapingDocumentHashTable;
  var pica = 456;

  var msg = require('./modules/msg').init('bg', {
    'isPotentialDomain': function(domain, done) {
      done(scrapingDocumentHashTable[domain] !== undefined);
    }
  });

  function updateScrapingDoc() {
    $.ajax({
      url: dataUrl,
      method: 'get',
      dataType: 'json',
      crossDomain: true
    }).done(function(res) {
        // todo bcast to the first tab active...
        //alert('result'+JSON.stringify(res.scrapingDocument));
        msg.bcast(['ct'], 'updateScrapingDocument', res.scrapingDocument, function(ret) {
          //alert('rettt' + ret);
          //scrapingDocumentHashTable = ret;
          alert('scrDoc' + JSON.stringify(ret) );
        });
    }).fail(function(reason) {
      alert('failed'+reason);
    });
  }

  /**
   * Main loop. Checks if there is a new version of scraping doc available.
   * If so, updates the scraping doc.
   */
  function mainLoop() {
    $.ajax({
      url: versionUrl,
      method: 'get',
      dataType: 'json',
      crossDomain: true//,
      //timeout: ttl * 1000
    }).done(function(res) {
      ttl = res.ttl;
      msg.bcast('echo', ttl);

      if (res.version > currentVersion) {
        currentVersion = res.version;
        updateScrapingDoc();
      }
    }).fail(function(res) {
      ttl = 5;
      msg.bcast("echo", "fail" + JSON.stringify(res));
    }).complete(function() {
      if (!scrapingDocumentHashTable) {
        updateScrapingDoc();
      }
      setTimeout(mainLoop, ttl * 1000/2); // todo
    });
  }

  // timeout set because after refreshing the extension
  // it immediately posts scraping doc to any active page but no page has active new content scritp
  // so they have to be reloaded first
  setTimeout(function(){
    mainLoop();
  }, 5000)

})();

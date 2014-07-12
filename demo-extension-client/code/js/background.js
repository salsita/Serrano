;(function() {
  var $ = require('./libs/jquery');
  var dataUrl = "http://localhost:3000/doc/y9245ebj/data";
  var versionUrl = "http://localhost:3000/doc/y9245ebj/version";
  var currentVersion = "0.0.0";
  var ttl = 5;

  var scrapingDocumentHashTable;

  var msg = require('./modules/msg').init('bg', {});

  function updateScrapingDoc() {
    $.ajax({
      url: dataUrl,
      method: 'get',
      dataType: 'json',
      crossDomain: true
    }).done(function(res) {
        // todo bcast to the first tab active...
        msg.bcast('updateScrapingDocument', res.scrapingDocument, function(ret) {
          scrapingDocumentHashTable = ret;
          alert('scrDoc' + scrapingDocumentHashTable );
        });
    });
  }

  /**
   * Mainloop. Checks if there is a new version of scraping doc available.
   * If so, updates the scraping doc.
   */
  function mainLoop() {
    $.ajax({
      url: versionUrl,
      method: 'get',
      dataType: 'json',
      crossDomain: true,
      timeout: ttl * 1000
    }).done(function(res) {
      ttl = res.ttl;
      msg.bcast('updated', ttl);

      if (res.version > currentVersion) {
        currentVersion = res.version;
        updateScrapingDoc();
      }
    }).fail(function(res){
      msg.bcast("updated", "fail" + JSON.stringify(res));
    }).complete(function() {
      setTimeout(mainLoop, ttl * 1000);
    });
  }

  // update
  mainLoop();

})();

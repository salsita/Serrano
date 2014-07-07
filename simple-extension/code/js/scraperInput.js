/**
 * Created by tomasnovella on 7/4/14.
 */
;(function() {
  var $ = require('./libs/jquery');
  var msg = require('./modules/msg').init('scraperUnit', {});

  var inputSelector = '#scr_unit_input';
  var outputSelector = '#scr_unit_output';

  function printOutput(output) {
    $(outputSelector).val(JSON.stringify(output));
    console.log('result: ' + JSON.stringify(output));
  }

  $(function() {
    $('#submit').click(function() {
      var jsoned;
      try {
        jsoned = JSON.parse($(inputSelector).val());
      } catch (e) {
        /*global alert*/
        alert('You are sending an invalid JSON. Please correct it. ' +
          'Often the problem is that you use single instead of double quotes');
        return;
      }

      /*global chrome*/
      chrome.tabs.query({active: true, currentWindow: false}, function(tabs) {
        for (var i = 0; i < tabs.length; ++i) {
          msg.cmd(tabs[i].id, ['contentScript'], 'runScrapingUnit', jsoned, printOutput);
        }
      });
    });
  });
})();

;(function() {
  var msg = require('./modules/msg').init('ct', {
    echo: function(res, done) {
      console.log(res);
      done(res);
    }
  });

  var uri = document.location.href;
  msg.bg('getRules', uri, function(rules) {
    if (rules) {
      var serrano = require('../../../serrano-library/build/serrano');
      serrano.logging.config({'environment': 'testing', 'console': true});

      var desc = require('./modules/RulesDescription').describe(rules);
      console.log(desc);
    } else {
      console.log('No rules found for URI ' + uri);
    }
  });

})();

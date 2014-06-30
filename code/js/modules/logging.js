/**
 * Created by tomasnovella on 6/26/14.
 */

var $ = require('../libs/jquery');

/**
 * Options object for logging.
 * Possible values:
 * environment: {string} either 'production' or 'testing'
 * console: {bool} whether should output logs to console
 * logglyToken: {string|null}  loggly authentification token
 *
 * environment=production means there would be much less logging to the console
 *
 */
var options = {
  environment: 'production',
  console: false,
  logglyToken: null
};

/**
 * Uploads the message into the loggly server.
 *
 * @param token
 * @param json
 */
// 34d8ad21-9eb6-4737-8a47-e0e1657d3c57
function logglyLog(token, json) {
  $.ajax({
    url: 'http://logs-01.loggly.com/inputs/'+ token +'/tag/http/',
    method: 'post',
    dataType: 'json',
    data: json,
    crossDomain: true
  }).done(function(ret){
      alert(ret);
  });
}

/**
 * Logs messages according to the options that were set.
 * @param error Exception to be logged
 */
function log(error) {
  console.log("log error:"+ error);

  if (error instanceof Error) {
    var jsoned = error.toJSON();


    //if (_.isUndefined(document) && document.location && document.location.href) {
    //  jsoned.url = document.location.href;
    // }
    jsoned.description = jsoned.toString();

    if (options.console) {
      if (options.environment === 'production') {
        delete jsoned.stack; // todo fixme -> deletes stack even for further use (in loggly)
      }
      console.log('Serrano log:' + JSON.stringify(jsoned) );
    }

    if (options.logglyToken) {
      logglyLog(options.logglyToken, jsoned);
    }
  } else {
    if (options.console) {
      console.log(error);
    }
  }
}

module.exports = {
  setOptions: function(opt) {options = opt;},
  getOptions: function() {return options;},
  log: log
};

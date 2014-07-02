/**
 * Created by tomasnovella on 6/26/14.
 */

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
  logglyToken: '34d8ad21-9eb6-4737-8a47-e0e1657d3c57' // todo testaccount...
};

/**
 * Uploads the message into the loggly server.
 *
 * @param token
 * @param json
 */
function logglyLog(token, json) {
  return; $ = {ajax:function(){}}; // todo later on solve cyclic dependency logging<->core
  $.ajax({
    url: 'http://logs-01.loggly.com/inputs/'+ token +'/tag/serrano/',
    method: 'post',
    dataType: 'json',
    data: json,
    crossDomain: true
  });

  // Since they send no Access-Control-Allow-Origin header, this is not going to work...
  //    .done(function(ret){
  //      alert(ret);
  //  });
}

/**
 * Logs messages according to the options that were set.
 * @param error Exception to be logged
 * @returns log object
 */
function log(error) {
  if (! error instanceof Error) {
    error = { message: error };
  } else {
    error = error.toJSON();
  }

  var doc;
  try {
    /*global document*/
    doc = document;
  } catch (e) { // reference error
    doc = false;
  }
  if (doc && doc.location && doc.location.href) {
      error.url = doc.location.href;
  }

  error.description = error.toString();

  if (options.logglyToken) {
    logglyLog(options.logglyToken, error);
  }

  if (options.console) {
    if (options.environment === 'production') {
      delete error.stack; // todo fixme -> deletes stack even for further use
    }
    console.log('Serrano log:' + JSON.stringify(error) );
  }

  return error;
}

module.exports = {
  setOptions: function(opt) {options = opt;},
  getOptions: function() {return options;},
  log: log
};

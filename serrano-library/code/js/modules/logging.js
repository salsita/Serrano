/**
 * Created by tomasnovella on 6/26/14.
 */

var _ = require('../libs/lodash');
var $ = require('../libs/jquery');

/**
 * Options object for logging.
 * Possible values:
 * environment: {string} ['production'] either 'production' or 'testing'
 * logEmptyElements: {bool} [true] whether should log in case selector returned 0 elements
 * console: {bool}[false] whether should output logs to console
 * logglyToken: {string}[false]  loggly authentification token
 *
 * environment='production' means there will be much less logging to the console
 */
var options = {
  environment: 'production',
  logEmptyElements: true,

  console: false,
  logglyToken: false
};

function config(different) {
  if (!different) {
    return options;
  }

  _.forEach(different, function(value, key) {
    options[key] = value;
  });
}

/**
 * Uploads the message into the loggly server.
 *
 * @param token
 * @param json
 */
function logglyLog(token, json) {
  return $.ajax({
    url: 'http://logs-01.loggly.com/inputs/'+ token +'/tag/serrano/',
    method: 'post',
    dataType: 'json',
    data: json,
    crossDomain: true
  });

  // todo Since they send no Access-Control-Allow-Origin header, this is not going to work...
  // having some discussion with Loggly support about it. I'll leave it there for now.
  //    .done(function(ret){
  //      alert(ret);
  //  });
}

/**
 * Takes an error, adds more information based on *options* and available data
 * and returns a more standardized error.
 * @param {Error|*} error Message to be logged.
 * @returns Standardized error.
 */
function standardizeError(error) {
  // tries to stringify whatever I got...
  var description = error.toString();

  if (error instanceof Error) {
    error = error.toJSON();
  } else {
    error = { message: error };
  }

  error.description = description;

  var url;
  try {
    /*global document*/
    url = document.location.href;
  } catch (e) { // reference error
    url = false;
  } finally {
    error.url = url;
  }

  var manifest;
  try {
    /*global chrome*/
    manifest = chrome.runtime.getManifest();
  } catch (e) {
    manifest = false;
  } finally {
    error.manifest = manifest;
  }

  return error;
}

/**
 * Standardizes the error and logs the message to the resources specified in *options*.
 * @param {Error|*} error Information to be logged.
 */
function log(error) {
  error = standardizeError(error);

  if (options.logglyToken) {
    logglyLog(options.logglyToken, error);
  }

  if (options.console) {
    if (options.environment === 'production') {
      delete error.stack;
    }
    console.log('Serrano log:' + JSON.stringify(error) );
  }
}

module.exports = {
  __setJQuery: function(different) {$ = different;},
  config: config,
  standardizeError: standardizeError,
  logglyLog: logglyLog,
  log: log
};

/**
 * Created by tomasnovella on 6/27/14.
 */
var assert = require('assert');

var logging = require('./logging');

// for checking the stack propertyetc..
function startsWith(str, substr) {
  return str.indexOf(substr) === 0;
}

describe('logging module ', function() {
  var tmpOptions;

  /*global before*/
  before(function() {
    logging.__setJQuery(require('../libs/jquery-mock'));
    tmpOptions = logging.getOptions();
  });

  /*global after*/
  after(function(){
    logging.setOptions(tmpOptions);
  });

  it('should check option set-up', function(){
    var options = {
      console: true,
      logglyToken: 'hello-world-123'
    };

    logging.setOptions(options);

    var gotten = logging.getOptions();
    assert.strictEqual(gotten.console, true);
    assert.strictEqual(gotten.logglyToken, 'hello-world-123');
    assert.strictEqual(gotten.environment, 'production');

  });

  it('should check if the error is filled with additional information correctly', function() {
    var stdError = logging.standardizeError(new TypeError('Error!!!'));
    assert.strictEqual(stdError.message, 'Error!!!');
    assert.ok(startsWith(stdError.stack, 'TypeError: Error!!!\n'));
    assert.strictEqual(stdError.message, 'Error!!!');
    assert.strictEqual(stdError.description, 'TypeError: Error!!!');
    assert.strictEqual(stdError.manifest, false);
    assert.strictEqual(stdError.url, false);

    var stdError2 = logging.standardizeError('Simple text error!');
    var res = {
      message: 'Simple text error!',
      description: 'Simple text error!',
      url: false,
      manifest: false
    };
    assert.deepEqual(stdError2, res);
  });

  it('should check if the error is sent to the server correctly', function() {
    var log = logging.logglyLog('TOKEN123', {"key": "val"});
    assert.deepEqual(log, {
      url: 'http://logs-01.loggly.com/inputs/TOKEN123/tag/serrano/',
      method: 'post',
      dataType: 'json',
      data: {"key":"val"},
      crossDomain: true
    });
  });
});

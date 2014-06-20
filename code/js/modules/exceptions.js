/**
 * Created by tomasnovella on 4/3/14.
 */

// http://stackoverflow.com/questions/783818/how-do-i-create-a-custom-error-in-javascript
function RuntimeError() {
  var tmp = Error.apply(this, arguments);
  tmp.name = this.name = 'RuntimeError';

  this.stack = tmp.stack;
  this.message = tmp.message;
}
RuntimeError.prototype = Error.prototype;

module.exports.RuntimeError = RuntimeError;

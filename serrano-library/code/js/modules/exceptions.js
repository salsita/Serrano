/**
 * Created by tomasnovella on 4/3/14.
 */

/**
 * Defines a toJSON property to Error objects. Very handy.
 * http://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
 * @example
 *   try {
 *     throw new TypeError('error!');
 *   } catch (e) {
 *     // now I can work with the 'message' and 'stack' property
 *     console.log(JSON.stringify(e.toJSON()));
 *   }
 *
 */
Object.defineProperty(Error.prototype, 'toJSON', {
  value: function () {
    var alt = {};

    Object.getOwnPropertyNames(this).forEach(function (key) {
      alt[key] = this[key];
    }, this);

    return alt;
  },
  configurable: true
});

// http://stackoverflow.com/questions/783818/how-do-i-create-a-custom-error-in-javascript
function RuntimeError() {
  var tmp = Error.apply(this, arguments);
  tmp.name = this.name = 'RuntimeError';

  this.stack = tmp.stack;
  this.message = tmp.message;
}
RuntimeError.prototype = Error.prototype;

module.exports.RuntimeError = RuntimeError;

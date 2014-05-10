/**
 * Created by tomasnovella on 4/3/14.
 */

var excTypes = ['InvalidJSON', 'NotImplemented', 'WrongArgument', 'Runtime'];

function excFactory(name) {
  var ctor = function(msg) {
    this.msg = msg;
    this.type = name;
  };
  ctor.prototype.toString = function() {
    return this.type + 'Error: ' + this.msg;
  };
  return ctor;
}

var modExports = {};

for (var i = 0; i < excTypes.length; i++) {
  var type = excTypes[i];
  modExports[type + 'Error'] = excFactory(type);
}

module.exports = modExports;

// entry point of the library

/*exported simplifier */
var simplifier = require('./modules/simplifier');
var core = require('./modules/simplifier');
module.exports = {
  simplifier: simplifier,
  core: core
}

var _ = require('../libs/lodash');
var template = require('./template');

/**
 * Considers all strings within instruction to be renderable and renders them
 * on a text level i.e. doesnot take semantics into consideration,
 * just does a recursive rendering.
 * @param {Array} instruction
 * @param templateContext
 */
function render(instruction, templateContext) {
  if (_.isPlainObject(instruction)) {
    return _.mapValues(instruction, function(el) {
      return render(el, templateContext);
    });
  } else if(_.isArray(instruction)) {
    return _.map(instruction, function(el) {
      return render(el, templateContext);
    });
  } else if(typeof (instruction) === 'string') {
    return template.render(instruction, templateContext);
  } else {
    return instruction;
  }
}

module.exports.render = render;

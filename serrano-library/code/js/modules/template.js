/**
 * Created by tomasnovella on 8/5/14.
 */
var _ = require('../libs/lodash');
var logging = require('./logging');

/**
 * A microtemplating function. For now it only supports replacing {{var}}.
 * Also supports dot (.) notation when the context is a complex object.
 * When the variable is not found, is it neither replaced nor changed in the original template,
 * but it can be logged based on the logger configuration.
 * @param {string} template A template.
 * @param {Object} context
 * @returns {string} Returns the the rendered template.
 * @example
 *
 * cartoonContext = {name: 'Futurama', cast: {robot: 'Bender'}}
 * template.render('{{cast.robot}} is a character in {{name}} {{fullstop}}', cartoonContext);
 * // => 'Bender is a character in Futurama {{fullstop}}'
 */
function render(template, context) {
  // two things to notice:
  // 1. { and { must not be separated be anything. Same for }}
  // 2. inside there must be a word -> no whitespace separation allowed todo?
  var rVariable = new RegExp("{{\\s*([\\w.]*)\\s*}}", "g");


  return template.replace(rVariable, function(full_match, p1) {
    // 1. obtain the variable
    var parts = p1.split('.');
    var res = _.foldl(parts, function(acc, part){
      if (_.isUndefined(acc)) {
        return acc;
      }
      return acc[part];
    }, context);

    // 2. replace if possible
    if (res) {
      return res;
    } else {
      if (logging.config().logUnresolvedTemplateVariables) {
        logging.log('Variable ' + p1 + ' unresolved in context +' + JSON.stringify(context));
      }
      return full_match;
    }

  });
}

module.exports = {
  render: render
};

/**
 * Created by tomasnovella on 8/5/14.
 */
var assert = require('assert');
var template = require('./template');

describe('templating module', function() {
  it('should test if templates are rendered properly', function() {
    var cartoonContext = {
      name: 'Futurama',
      cast: {
        robot: 'Bender Rodriguez'
      }
    };

    // default use, everything filled like it should
    assert.strictEqual(
      template.render('{{name}} is one of the best cartoons ever and {{cast.robot}} '+
        'is an awesome character', cartoonContext),
      'Futurama is one of the best cartoons ever and Bender Rodriguez is an awesome character'
    );

    // not replaced when not found, no errors thrown
    var tpl = '{{cast.richGirl}} is an {{cast.richGirl.occupation}} student '+
      '{{preposition}} a rich family';
    assert.strictEqual(template.render(tpl, cartoonContext), tpl);


    // playing with some tabs & newlines & spaces.
    assert.strictEqual(template.render('It is {{ name  \n }}.', cartoonContext),
      'It is Futurama.');

    // there must not be a separator between { and {
    assert.strictEqual(template.render('{ {name}} {{name} } {{name}}', cartoonContext),
      '{ {name}} {{name} } Futurama');
  });
});

/**
 * Created by tomasnovella on 8/5/14.
 */
var assert = require('assert');
var template = require('./template');

var logging = require('./logging');

describe('templating module', function() {
  var logconfig;
  before(function() {
    logconfig = logging.config();
    // I don't want any logging going on during unittests
    logging.config({logUnresolvedTemplateVariables:false});
  });

  after(function() {
    logging.config(logconfig);
  });

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

  it ('should check undefined template context', function() {
    assert.strictEqual(template.render('{{name}}', undefined), '{{name}}');
  });

  it('should check if the template renderer works only with a copy of a string', function() {
    var ctx = {name: 'John'};
    var a1 = 'I am {{name}}',
        a2 = 'I am {{name}}',
        b = 'I am John';

    assert.strictEqual(a1, a2);

    assert.strictEqual(template.render(a1, ctx), b);

    assert.strictEqual(a1, a2);
    assert.notStrictEqual(a1, b);

  });
});

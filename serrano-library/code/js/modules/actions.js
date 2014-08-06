/**
 * Created by tomasnovella on 8/6/14.
 */

var template = require('./template');

// todo cannot be unittested properly, since we do not have the DOM
// via !call and !apply this functionality is also available in commands, so I think
// there is no problem integrading them among commands.js (as one file)
var actionCommands = {
  remove: {
    argumentCount: '1',
    code: function(context, selector) {
      return selector.remove();
    }
  },

  insert: {
    argumentCount: '2-3',
    code: function(context, selector, where, template) {
      var insertedContent = template.render(template, context.template);
      if (where === 'before') {
        return selector.before(insertedContent);
      } else {
        return selector.after(insertedContent);
      }
    }
  },

  replace: {
    argumentCount: '2',
    code: function(context, selector, template) {
      var newContent = template.render(template, context.template);
      return selector.replaceWith(newContent);
    }
  }
};


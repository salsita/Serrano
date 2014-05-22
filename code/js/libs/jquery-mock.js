/**
 * A node.js mock for jQuery library. Used in unit tests.
 *
 * DOM to be roughly simulated:
 * <h2><span>Child1</span>This is the first h2 heading</h2>
 * <h2><span>Child1</span>Followed by another h2 heading</h2>
 *
 * <_anytag_>
 *   <p>Double filtered paragraph</p>
 * <_anytag_>
 */


// http://krook.org/jsdom/HTMLElement.html
function HTMLElement(text, tagname)
{
  this.innerHTML = text; // this should be an html representation I guess,...
  this.outerHTML = '<'+ tagname +'>' + text + '</' + tagname + '>';
  this.tagName = tagname; // should be one level higher, but who cares...

  this.children = function() {
    if(tagname === 'h2') {
      return [new HTMLElement('Child1', 'span')];
    }  else {
      return [];
    }
  };

}

var fixtures = {
  'h2': {
    0: new HTMLElement('This is the first h2 heading', 'h2'),
    1: new HTMLElement('Followed by another h2 heading', 'h2'),
    'html': function(){return this[0].innerHTML;},
    'text': function(){return this[0].innerHTML + this[1].innerHTML;},
    'length': 2,
    'jquery': 'nodeJS mock jQuery'
  },

  'double' : {
    0: new HTMLElement('Double filtered paragraph', 'p'),
    'html': function(){return this[0].innerHTML;},
    'text': function(){return this[0].innerHTML + this[1].innerHTML;},
    'length': 1,
    'jquery': 'nodeJS mock jQuery'
  },

  '_default': {
    'length': 0,
    'children': function() {return [];},
    'jquery': 'nodeJS mock jQuery'
  }
};

/**
 * Mock jQuery object.
 *
 * @example
 *
 * $('h2'); // returns 2 <h2> headings
 *
 * $('p', <any_arg>); // returns one <p> paragraph
 *
 * $(<anything_else>); // returns empty selection - object with
 *   //only `jquery` and `length` properties
 *
 */
var $ = function(sel) {
  if (arguments.length === 2 && arguments[0] === 'p') {
    return fixtures.double;
  }

  if (sel in fixtures) {
    return fixtures[sel];
  } else {
    return fixtures._default;
  }
};

/**
 * Mock for jQuery makeArray() function.
 *
 * @param obj
 * @returns {Array}
 */
$.makeArray = function(obj) {
  var array = [];
  var i = 0;
  while (obj.hasOwnProperty(i)) {
    array.push(obj[i]);
    ++i;
  }
  return array;
};

module.exports = $;

// node.js mock for jQuery library  (in node.js there is no window / DOM)

// simulate so that $('h2') returns two headings

// http://krook.org/jsdom/HTMLElement.html
function HTMLElement(text, tagname)
{
  this.innerHTML = text; // this should be a html representation I guess,...
  this.outerHTML = '<'+ tagname +'>' + text + '</' + tagname + '>';
  this.tagName = tagname; // should be one level higher, but who cares...
}

// TODO ask about this...
//function H2Heading(text)
//{
//  HTMLElement.call(this, text, 'h2');
//}

// no idea why it works (setting H2Heading prototype to the same this as htmlelement
// prototype, but at least it works... would be grateful for some explanation...
//H2Heading.prototype = Object.create(HTMLElement.prototype);

var fixtures = {
  'h2': {
    0: new HTMLElement('This is the first H2 heading', 'h2'),
    1: new HTMLElement('Followed by another h2 heading', 'h2'),
    'html': function(){return this[0].innerHTML;},
    'text': function(){return this[0].innerHTML + this[1].innerHTML;},
    'length': 2,
    'jquery': 'nodeJS mock jQuery'
  },

  'double' : {
    0: new HTMLElement('Double filtrated paragraph', 'p'),
    'html': function(){return this[0].innerHTML;},
    'text': function(){return this[0].innerHTML + this[1].innerHTML;},
    'length': 2,
    'jquery': 'nodeJS mock jQuery'
  },

  '_default': {
    'length': 0,
    'jQuery': 'nodeJS mock jQuery'
  }
};

var $ = function(sel) {
  if (arguments.length == 2) {
    return fixtures['double'];
  }

  if (sel in fixtures) {
    return fixtures[sel];
  } else {
    return fixtures['_default'];
  }
};

$.makeArray = function(obj) {
  var array = [];
  var i = 0;
  while (obj.hasOwnProperty(i)) {
    array.push(obj[i]);
    ++i;
  }
  return array;
}

module.exports = $;

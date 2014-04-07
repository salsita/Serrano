storage = {};

/**
 * Contains all the available functions in the following format:
 * "function name": {
 *   implicitForeach : (default) true // if the return value of the previous function is array ->
 *     decides whether pass it as it is, or run an implicit foreach
 *   rawArguments: (default)[] // array of argument positions that should be passed raw (without preprocessing) ->
 *     those at that positions there are ARRAYS that we do not want to preprocess
 *   code : Function (the code of the function itself)
 * }
 */
commands = {
  'getVal': {
    'argumentCount': '2',
    'implicitForeach': true,
    'rawArguments': [],
    'code': function(key) {
      if (storage.hasOwnProperty(key)) {
        return storage[key];
      } else {
        throw new WrongArgumentError('getVal '+ key +' no value found');
      }
    }
  },

  'setVal': {
    'argumentCount': '3',
    'implicitForeach': true,
    'rawArguments': [],
    'code': function(key, value) {
      storage[key] = evaluateExpression(value);
      return storage[key];
    }
  },

  'jQuery': {
    'argumentCount': '1',
    'implicitForeach': true,
    'rawArguments': [],
    'code': function(obj) {
      return $(obj);
    }
  },

  'lt': {
    argumentCount:"2,3",
    implicitForeach: true,
    rawArguments:[1],
    'code': function(){
      // ...
    }
  },

  // converts a jQuery object into an array - https://api.jquery.com/jQuery.makeArray/
  'makeArray': {
    'code':function(obj) {
      return jQuery.makeArray(obj);
    }
  },
  'a': {
    'code': function(obj) {
      return this.makeArray(obj);
    }
  },

  // TODO: maybe extend - so that I can get an array of indexes too... (nonEvaluation of an expression)
  'at': {
    'implicitForeach': false,
    'rawArguments': [1],
    'code': function(array, index) {
      //if (jQuery.isArray(index));
      return array[index];
    }
  },

  'concat': {
    'implicitForeach': false,
    'rawArguments': [0], // maybe a stupid thing since argument [0] si never raw (think about it!)
    'code': function(pieces, glue) {
      glue = typeof glue !== 'undefined' ? glue : ' '; // default glue is ' '
      return pieces.join(glue);
    }
  },

  'replace': {
    'code': function (str, old, n) {
      return str.replace(old, n);
    }
  },

  // note 1: thing I cannot compute - return only those people whose age is below 50.
  // example: <people><person name="tomas" age="22"/><person name="peter" age="55"></people>
  // [[".person", "!toArray"], ["!filter", ["!gt",["attr", "age"], 50]]]
  //

  // ["=li .age", ["!filter", ["!gt", 50]]
  // loops through all ages and returns an array of ages that meet the condition
  // takes an argument. If satisfies a condition - returns it. Otherwise returns undefined.
  'filter': {
    'implicitForeach': false,
    'rawArguments': [1],
    'code': function(obj, condition) {
      return evaluateExpression([obj, condition]);
    }
  },

  'gt': {
    'code': function(left, right) {

    }
  }

};

jqChains = {
  'lowercase':'buhulowercase',
  'attr': 'buhuattr'
};


/*

function replace()
{
  var args = arguments;

}


funs = {
  "!text": {
     implicitLoop: true,  //?
     code: function(obj) { return obj.text(); }
  },
  "!trim": {
    ...
  }
}

signatura = {
  name: "replace",
};


$('.myClass').bar(1,2,3).boo($('.myOtherClass').upper(), 'b').get();

[".myClass", "!bar", 1, 2, 3, "!boo", [".myOtherClass", "!upper"], "b", "!get"]
[".myClass", ["!bar",1, 2, 3], ["!boo", [".myOtherClass", "!upper"], "b"], "!get"]


Problem 1.
[".myClass", ["!replace", "a", "b"]]


["!replace", ".myClass", "Class", "Klas"] --> should return ".myKlas"
["!replace", [".myClass"], "<b>", "&lt;b&gt;"] --> replaces all <b> elements with their entitied notation.

Problem 2.
["$.myClass", ["!replace, "a","b"], ["!replace", "c", "d"]]
And now!!!!
[["!replace", [".myClass"], "a", "b"], ["!replace","c","d"]]

[ ... -> "ahoj", [ "!getVal",


Q: How to make it the same???
Easy! Every function takes as a first argument the return value of the previous item -
compiler


Note: "$.myClass" is a syntactic sugar for ["!getjQuerySelector", ".myClass"]
[["!setval" "myval"], [".myClass"]]



Problem 3(pointed out by Roman):
what if I have a chain and one of the commands doesnt return a value? PROBLEM SOLVED!!!! returns undefined,
as if the following command were the first item in the chain!!!!!!!!!

PLUS - solves even the infix notation of the case  [0, ["!lt", 5]] it's not so pretty though.

(can add !NOP (NoOPeration) command for that rare cases - takes argument from the chain, returns undefined.

Algorithm:
1) take the following argument in the array
2) if a number, return number
3) if  a string (jQuery string) -> replace with a ["jQuery", that string] function
4) if a no-arg function(e.g. string "!tolower") -> replace with a ["!tolower", prevArg]
supplying with the return value of the previous function + arguments given
5) if array -> call yourself recursively

Problem 4:
$("h1") doesnt return the content of the element, it returns the whole html of it "<h1>Blah blah blah</h1>"
You need to call .text() on it explicitly. Q: should I make another shortcut for obtaining text only?
[alternatively - make a shortcut-function for it..., %, =,&]

[""] $,

"div .age"

 ["div .age", "!a", ["!call", "text"]],
 ["=div.age"]



 ["div .age", "!text"]

 [ ..., ["!apply", "substr", ["!getVal", "val"] ] ]


Note:
-- no call() no apply()
// ---------------------------------------
koukni na ty conditions (<, >, ==, !=, ...; and, or; exists, ...)  a rozmysli to

condition always returns a value
["!lt", "#age", 40, ["!getVal", "youngVal"], ["!getVal", "oldVal"]]
vs
["!if", ["!lt", "=#age", 40], ["!getVal", "youngVal"], ["!getVal", "oldVal"]]


["=li .age", ["!filter", ["!gt", 50]]


// ---------------------------------------
function replace(str, a, b)
{
  return str.replace(a, b);
}

 jednoduche riesenie k tomu foreachovaniu.
  Totizto ked mas jQuery objekt a na neho volas metodu,
   tak stale predsa chces, aby sa volala rovnako, ako ked to volas
   v jQuery (to znamena, ze NEforeachujes ale volas to klasicky na samotny
   objekt). Ked mas pole (typ Array), tak to chces predsa foreachovat
   (lebo samotna array nema ZIADNE dolezite metody. pripadne mozno ma
   .length, ale to mozes simulovat explicitne metodou getLength ktoru
   napiseme). Ziaden iny pripad nastat nemoze. Takze znacit v signature
   foreachovatelnost je zrejme zbytocne (mozno sa mylim, ale tak dava mi to
   zmysel).


*/

// OUTDATED- will be completely rewritten - please ignore!!!

// This is a library of all the functions
//
//// HELPER FUNCTIONS
//function _debug(text)
//{
//   return _debugAdd(text);
//
//  //document.getElementById("debugarea").innerHTML = text;
//  //console.log(text);
//}
//function _debugAdd(text)
//{
//  document.getElementById("debugarea").innerHTML += text + "<br />";
//  console.log(text);
//}
//
//// returns JSON
//function fetchScript(url)
//{
//  return $.getJSON(url);
//}
//
//function SSLInterpreter() {
//}
//
//SSLInterpreter.prototype.run = function (json) {
//  // preprocess the temporary variables
//  $.each(json["_tmp"], function (key, val) {
//    //_debug(key +" "+val.toString());
//    storage[key] = evaluateExpression(val);
//
//  });
//  _debug("Storage values:");
//  for (var i in storage)
//  {
//    _debug(i +':"'+ storage[i]+'"');
//  }
//  $("a")[0].innerHTML = "http://google.com";
//};
//
//
//
//function evaluateChain(selector, expression) {
//  _debug("_selector: " + selector);
//}
//
///**
// * Takes an expression and processes and evaluates it.
// * @param expression
// * @returns {*} the value of the evaluated expression
// */
//function evaluateExpression(expression) { // expression has a head and optional body
//  if (typeof (expression) == 'number' || typeof(expression) == 'string') { // number
//    return expression;
//  } else if (expression instanceof Array) { // command or selector
//    var head = expression[0]; // todo maybe I will need some recursion here
//    var commName = head.substr(1);
//    //_debug("prikaz" + commName);
//    if (head[0] == '!' && commands.hasOwnProperty(commName)) { // 1. not chaining
//      return commands[commName].apply(null, expression.slice(1));
//    } else if(head[0] == '$' && jqChains.hasOwnProperty(commName)) { // 2. chaining
//      return evaluateChain(commName, expression.slice(1));
//    }
//  } else {
//    _debug("ERROR!!! uncaught expression");
//    return false;
//  }
//
//
//}

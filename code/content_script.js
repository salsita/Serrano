// Load Tests


test_simplify(v1);
test_simplify(v2);
test_simplify(v3);
test_simplify(v4);
test_simplify(v5);
test_simplify(v6);





//alert(testString);
//alert(111);
//function loadAndExecuteTest(testfile)
//{
//  //_debug("loadAndExecuteTest " + testfile);
//
//  var serranoInterpreter = new SSLInterpreter();
//  var script = chrome.extension.getURL("tests/" + testfile + ".json");
//
//  fetchScript(script)
//    .done(function(res){
//      serranoInterpreter.run(res);
//    }).fail(function( jqxhr, textStatus, error ) {
//      var err = textStatus + ", " + error;
//      _debug( "Request Failed: " + err );
//    });
//
//  //chrome.tabs.executeScript({code:"alert('"+testfile+"');"})
//}
//
//
//
//// Generate popup.html content
//function closure(testfile)
//{
//  return function() {loadAndExecuteTest(testfile);}
//}

//document.addEventListener('DOMContentLoaded', function () {
//  var testfiles = ["getH1", "getYelp", "getCelebrations","eeee"];


//  for (var i=0; i<testfiles.length; ++i) {
//    var a = document.createElement('a');
//    a.onclick = closure(testfiles[i]);
//
//    var textInside = document.createTextNode(testfiles[i]);
//    a.appendChild(textInside);
//
//    document.body.appendChild(a);
//    document.body.appendChild(document.createElement('br'));
//  }

//});

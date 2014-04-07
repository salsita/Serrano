/**
 * Created by tomasnovella on 4/3/14.
 */

var v1= ["$users.ages blah"];
var v2 = ["!setVal",["$.sth", "!lowercase"], "myVariable"];


var v3 = ["!someNotImplementedcommand"];

// wrong number of arguments, simplifier cannot detect, because it needs context....
var v4 = ["!getVal"];

var v5 = ["!lt", ["$.this", "!is", "!raw"], ["$this", "!is", "!not"]];

var v6 = ["$somthing", "notAFunction"];

function test_simplify(v, inConsole)
{
  if (inConsole === true)
  {
    console.log(v);
    console.log("now simplified");
    console.log(simplify(v));
  } else
  {
    document.body.appendChild(document.createTextNode("dumping variable:"));
    dump(v, "body");
    document.body.appendChild(document.createTextNode("now simplified:"));
    try{
      s = simplify(v);
      dump(s,"body");
    } catch (e){
      document.body.appendChild(document.createTextNode("Error! " + e.toString()));
      document.body.appendChild(document.createElement("br"));
    }

  }

}

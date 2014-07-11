var PORT = process.env.PORT || 3000;

var express = require('express');
var fs = require('fs');
var server = express();

// --- utils:start ---

function i2a(i, d) {
  var s = '' + i;
  while (s.length < d) { s = '0' + s; }
  return s;
}

function getStamp() {
  var now = new Date();
  return '' + now.getFullYear() + '-' + i2a(now.getMonth()+1, 2) + '-' +
    i2a(now.getDate(), 2) + ' ' + i2a(now.getHours(), 2) + ':' +
    i2a(now.getMinutes(), 2) + ':' + i2a(now.getSeconds(), 2) + '.' +
    i2a(now.getMilliseconds(), 3);
}

// --- utils:end ---

// no-cache, cors
function setHeaders(req, res, next) {
  // cors
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'X-Requested-With');
  // no-cache
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
}

// the only supported route
server.get('/doc/:id/:type', setHeaders, function(req, res) {
  var docId = req.params.id;
  var type = req.params.type;
  console.log('\n' + getStamp() + ' GET doc(id:"' + docId + '", type:"' + type + '")');
  if (type !== 'version' && type !== 'data') {
    console.log('404, wrong type');
    res.send(404, 'wrong type');
    return;
  }
  var fname = __dirname + '/data/doc/' + docId + '/' + type + '.json';
  fs.readFile(fname, function(err, data) {
    if (err) {
      console.log('404, ' + err);
      res.send(404, err);
      return;
    }
    console.log('200 OK, sending data');
    res.type('application/json');
    res.send(data);
  });
});

// get the ball rolling
server.listen(PORT, function() {
  console.log('listening on port: ' + PORT);
  console.log('ctrl-c to stop the server');
});

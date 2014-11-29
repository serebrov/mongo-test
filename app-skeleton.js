var hljs = require('highlight.js');
var _ = require('lodash');

module.exports = {};
var exports = module.exports;
exports.express = require('express');

exports.app = exports.express();
exports.app.set('views', __dirname + '/public/views');
exports.app.set('view engine', 'ejs');
exports.app.engine('ejs', require('ejs').renderFile);
exports.app.use(exports.express.static(__dirname + '/public'));

exports.dataToString = function dataToString(data) {
  return _.reduce(data, function(sum, d) {
    return sum + JSON.stringify(d);
  }, '');
}

exports.getCode = function getCode(args) {
  return hljs.highlight('javascript', args.callee.toString()).value;
}

exports.run = function() {
  var server = exports.app.listen(3000, function () {

    var host = server.address().address
    var port = server.address().port

    console.log('Example app listening at http://%s:%s', host, port)

  });
  return server;
}

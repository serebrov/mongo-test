var mongo = require('mongodb')
var mq = require('./mongodb-q')
var Q = require('q')
var _ = require('lodash')

module.exports = insertData;

function insertData(dbName, colName, num) {
  var qdb = mq.getQDb(dbName, new mongo.Server('localhost',27017), {w: 1});
  qdb.open()
  .then(function(qdb) {
    return qdb.collection(colName);
  })
  .then(function(col) {
    var qcol = new mq.QCol(col);
    var data = _.range(num).map(function(i) {
      qcol.insert({x: i});
    });
    return Q.all([Q(qcol)].concat(data));
  })
  .then(function(data) {
    var qcol = data[0];
    return qcol.count();
  })
  .then(function(count) {
    console.log('Collection count: ' + count);
  })
  .done();
}

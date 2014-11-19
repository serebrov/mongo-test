var mongo = require('mongodb')
var Q = require('q')
var _ = require('lodash')

module.exports = insertData;

/**
 * Simple wrapper for mongodb Db() object to work with promises.
 */
function QDb(db) {
  return {
    open: Q.nbind(db.open, db),
    collection: Q.nbind(db.collection, db)
  };
}

/**
 * Simple wrapper for mongodb Collection() object to work with promises.
 */
function QCol(col) {
  return {
    insert: Q.nbind(col.insert, col),
    count: Q.nbind(col.count, col)
  };
}

function insertData(dbName, colName, num) {
  var db = new mongo.Db(dbName, new mongo.Server('localhost',27017), {w: 1});
  var qdb = new QDb(db);
  qdb.open()
  .then(function(qdb) {
    return qdb.collection(colName);
  })
  .then(function(col) {
    var qcol = new QCol(col);
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

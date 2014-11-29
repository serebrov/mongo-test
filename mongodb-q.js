var mongo = require('mongodb')
var Q = require('q')
var _ = require('lodash')

module.exports = {
  getQDb: getQDb,
  Qdb: QDb,
  QCol: QCol
};

function getQDb(name, server, options) {
  var db = new mongo.Db(name, server, options);
  return new QDb(db);
};

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

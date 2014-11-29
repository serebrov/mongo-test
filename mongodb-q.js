var mongo = require('mongodb')
var Q = require('q')
var _ = require('lodash')

module.exports = {
  mongo: mongo,
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
    remove: Q.nbind(col.remove, col),
    count: Q.nbind(col.count, col),
    findOne: Q.nbind(col.findOne, col),
    find: function() {
      var args = Array.prototype.slice.apply(arguments);
      return new QCursor(col.find.apply(col, args));
    }
  };
}

/**
 * Simple wrapper for mongodb Cursor() object to work with promises.
 */
function QCursor(cursor) {
  return {
    toArray: Q.nbind(cursor.toArray, cursor)
  };
}

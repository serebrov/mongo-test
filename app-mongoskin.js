var as = require('./app-skeleton');
var hljs = require('highlight.js');
var Q = require('q')

var mongoskin = require('mongoskin')

var db = null;
var Blog = null;
var theUser = null;
var path = 'mongoskin';

var clearData = function(next) {
  db.collection('Blog').remove(function(err, data) {
    if (err) throw err;
    next();
  });
};

//Connect to mongo
as.app.use(function(req, res, next) {
  if (db) {
    return next();
  }
  db = mongoskin.db('mongodb://localhost:27017/mongo-test-mongoskin', {w: 1});
  db.collection('Blog').find(function(err, collection) {
      if (err) return next(err);
      Blog = collection;
      db.collection('User').findOne(function(err, usr) {
        if (err) return next(err);
        if (!usr) {
          var newUsr = {name: 'Tester', email: 'tester@example.com'};
          db.collection('User').insert(newUsr,function(err, newUsr) {
            if (err) return next(err);
            theUser = newUsr;
            next();
          });
        } else {
          theUser = usr;
          next();
        }
      });
    });
});

as.app.get('/'+path+'/', function (req, res, next) {
  as.app.code = as.getCode(arguments);
  var blog = {};
  blog.title = 'test';
  blog.body = 'test';
  blog.author = theUser._id;
  db.collection('Blog').insert(blog, function(err, d) {
    if (err) throw err;
    db.collection('Blog').find().toArray(function(err, data) {
      var out = as.dataToString(data);
      res.render('data', {
        path: path,
        page: 'home',
        title: 'Home mongoskin - creates a new model on each call',
        code:as.app.code,
        data: hljs.highlight('json', out).value});
    });
  });
});

as.app.get('/'+path+'/refs', function (req, res, next) {
  as.app.code = as.getCode(arguments);
  db.collection('Blog').find().toArray(function(err, data) {
    //async calls loop
    var idx = 0, count = data.length;
    var resolveAuthor = function(next) {
      var post = data[idx];
      db.collection('User').findOne({_id:post['author']}, function(err, author) {
        if (err) next(err);
        post['author'] = author;
        idx++;
        if (idx < count) {
          //resolve next
          resolveAuthor(next);
        } else {
          //return
          next(null, data);
        }
      });
    };
    resolveAuthor(function(err, data) {
      var out = as.dataToString(data);
      res.render('data', {
        path: path,
        page: 'refs',
        title: 'Mongoskin - Blog with author populated from User',
        code:as.app.code,
        data: hljs.highlight('json', out).value});
    });
  });
});

as.app.get('/'+path+'/wrongSchema', function (req, res, next) {
  res.render('data', {
    path: path,
    page: 'wrongSchema',
    title: 'Mongoskin - No wrong schema test here',
    code: as.getCode(arguments),
    data: hljs.highlight('json', '').value
  });
});

as.app.get('/'+path+'/any', function (req, res, next) {
  res.render('data', {
    path: path,
    page: 'any',
    title: 'Mongoskin - No any schema test here',
    code: as.getCode(arguments),
    data: hljs.highlight('json', '').value
  });
});

as.app.get('/'+path+'/clear', function (req, res, next) {
  clearData(function() {
    res.redirect('/'+path+'/');
  });
});

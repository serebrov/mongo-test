var as = require('./app-skeleton');
var hljs = require('highlight.js');

var mongo = require('mongodb')

var db = null;
var Blog = null;
var User = null;
var theUser = null;

var clearData = function(next) {
  Blog.remove(function(err, data) {
    if (err) throw err;
    next();
  });
};

//Connect to mongo
as.app.use(function(req, res, next) {
  if (db) {
    return next();
  }
  var db = mongo.Db('mongo-test-native', new mongo.Server('localhost',27017), {w: 1});
  db.open(function(err, db) {
    if (err) return next(err);
    db.collection('Blog', function(err, collection) {
      if (err) return next(err);
      Blog = collection;
      db.collection('User', function(err, collection) {
        if (err) return next(err);
        User = collection;
        User.findOne(function(err, usr) {
          if (err) return next(err);
          if (!usr) {
            var newUsr = {name: 'Tester', email: 'tester@example.com'};
            User.insert(newUsr,function(err, newUsr) {
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
  });
});

as.app.get('/', function (req, res) {
  var code = as.getCode(arguments);
  var blog = {};
  blog.title = 'test';
  blog.body = 'test';
  blog.author = theUser._id;
  Blog.insert(blog, function(err, d) {
    if (err) throw err;
    Blog.find().toArray(function(err, data) {
      var out = as.dataToString(data);
      res.render('data', {
        title: 'Creates a new model on each call',
        code: code,
        data: hljs.highlight('json', out).value});
    });
  });
});

as.app.get('/refs', function (req, res) {
  var code = as.getCode(arguments);
  Blog.find().toArray(function(err, data) {
    //async calls loop
    var idx = 0, count = data.length;
    var resolveAuthor = function(next) {
      var post = data[idx];
      User.findOne({_id:post['author']}, function(err, author) {
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
        title: 'Blog with author populated from User',
        code: code,
        data: hljs.highlight('json', out).value});
    });
  });
});

as.app.get('/wrongSchema', function (req, res) {
  res.render('data', {
    title: 'No wrong schema test here',
    code: as.getCode(arguments),
    data: hljs.highlight('json', '').value
  });
});

as.app.get('/any', function (req, res) {
  res.render('data', {
    title: 'No any schema test here',
    code: as.getCode(arguments),
    data: hljs.highlight('json', '').value
  });
});

as.app.get('/clear', function (req, res) {
  clearData(function() {
    res.redirect('/');
  });
});

// production error handler
// no stacktraces leaked to user
as.app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    var out = JSON.stringify(err.stack);
    res.render('data', {
      title: err.message,
      code: as.getCode(arguments),
      data: "<pre>"+err.stack+"</pre>"
    });
});

as.run();

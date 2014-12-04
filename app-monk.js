var as = require('./app-skeleton');
var hljs = require('highlight.js');
var Q = require('q')

var db = require('monk')('localhost/mongo-test-monk');

var Blog = db.get('blog');
var User = db.get('user');

var theUser = null;
var path = 'monk';

var clearData = function(next) {
  Blog.remove(function(err, data) {
    if (err) throw err;
    next();
  });
};

//Connect to mongo
as.app.use(function(req, res, next) {
  if (theUser) {
    return next();
  }
  User.findOne().success(function(usr) {
    if (!usr) {
      var newUsr = {name: 'Tester', email: 'tester@example.com'};
      User.insert(newUsr).success(function(err, newUsr) {
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

as.app.get('/'+path+'/', function (req, res, next) {
  as.app.code = as.getCode(arguments);
  var blog = {};
  blog.title = 'test';
  blog.body = 'test';
  blog.author = theUser._id;
  Blog.insert(blog).success(function(d) {
    Blog.find().success(function(data) {
      var out = as.dataToString(data);
      res.render('data', {
        path: path,
        page: 'home',
        title: 'Home monk - creates a new model on each call',
        code:as.app.code,
        data: hljs.highlight('json', out).value});
    });
  });
});

as.app.get('/'+path+'/refs', function (req, res, next) {
  as.app.code = as.getCode(arguments);
  var data = [];
  var promises = [];
  Blog.find().each(function(post) {
    promises.push(
      User.findOne({_id:post['author']}).success(function(author) {
        post['author'] = author;
        data.push(post);
      })
    );
  }).all(function() { return promises; }).onFulfill(function() {
    var out = as.dataToString(data);
    res.render('data', {
      path: path,
      page: 'refs',
      title: 'monk - Blog with author populated from User',
      code:as.app.code,
      data: hljs.highlight('json', out).value});
  });
});

as.app.get('/'+path+'/wrongSchema', function (req, res, next) {
  res.render('data', {
    path: path,
    page: 'wrongSchema',
    title: 'monk - No wrong schema test here',
    code: as.getCode(arguments),
    data: hljs.highlight('json', '').value
  });
});

as.app.get('/'+path+'/any', function (req, res, next) {
  res.render('data', {
    path: path,
    page: 'any',
    title: 'monk - No any schema test here',
    code: as.getCode(arguments),
    data: hljs.highlight('json', '').value
  });
});

as.app.get('/'+path+'/clear', function (req, res, next) {
  clearData(function() {
    res.redirect('/'+path+'/');
  });
});

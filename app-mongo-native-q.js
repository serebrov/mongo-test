var as = require('./app-skeleton');
var hljs = require('highlight.js');
var Q = require('q')

var mq = require('./mongodb-q')

var db = null;
var Blog = null;
var User = null;
var theUser = null;
var path = 'mongo-native-q';

var clearData = function(next) {
  Blog.remove().then(function(err, data) {
    next();
  });
};

//Connect to mongo
as.app.use(function(req, res, next) {
  if (db) {
    return next();
  }
  db = mq.getQDb('mongo-test-native-q', new mq.mongo.Server('localhost',27017), {w: 1});
  db.open().then(function(qdb) {
    return qdb.collection('Blog');
  }).then(function(collection) {
    Blog = new mq.QCol(collection);
    return db.collection('User')
  }).then(function(collection) {
    User = new mq.QCol(collection);
    return User.findOne();
  }).then(function(usr) {
    if (!usr) {
      var newUsr = {name: 'Tester', email: 'tester@example.com'};
      User.insert(newUsr).then(function(newUsr) {
        theUser = newUsr;
        next();
      });
    } else {
      theUser = usr;
      next();
    }
  }).fail(function(err) {
    return next(err);
  });
});

as.app.get('/'+path+'/', function (req, res, next) {
  as.app.code = as.getCode(arguments);
  var blog = {};
  blog.title = 'test';
  blog.body = 'test';
  blog.author = theUser._id;
  Blog.insert(blog).then(function(d) {
    return Blog.find().toArray();
  }).then(function(data) {
    var out = as.dataToString(data);
    res.render('data', {
      path: path,
      page: 'home',
      title: 'Mongo native with Q - Creates a new model on each call',
      code:as.app.code,
      data: hljs.highlight('json', out).value
    });
  }).fail(function(err) {
    return next(err);
  });
});

as.app.get('/'+path+'/refs', function (req, res, next) {
  as.app.code = as.getCode(arguments);
  Blog.find().toArray().then(function(data) {
    var fullData = [Q(data)];
    //resolve users
    data.forEach(function(post) {
      fullData.push(User.findOne({_id:post['author']}));
    });
    return Q.all(fullData);
  }).then(function(fullData) {
    var data = fullData[0];
    var users = fullData.slice(1);
    var idx = 0;
    //put users to posts
    data.forEach(function(post) {
      post.author = users[idx++];
    });
    var out = as.dataToString(data);
    res.render('data', {
      path: path,
      page: 'refs',
      title: 'Mongo native with Q - Blog with author populated from User',
      code:as.app.code,
      data: hljs.highlight('json', out).value
    });
  }).fail(function(err) {
    return next(err);
  });
});

as.app.get('/'+path+'/wrongSchema', function (req, res, next) {
  res.render('data', {
    path: path,
    page: 'wrongSchema',
    title: 'Mongo native with Q - No wrong schema test here',
    code: as.getCode(arguments),
    data: hljs.highlight('json', '').value
  });
});

as.app.get('/'+path+'/any', function (req, res, next) {
  res.render('data', {
    path: path,
    page: 'any',
    title: 'Mongo native with Q - No any schema test here',
    code: as.getCode(arguments),
    data: hljs.highlight('json', '').value
  });
});

as.app.get('/'+path+'/clear', function (req, res, next) {
  clearData(function() {
    res.redirect('/'+path+'/');
  });
});

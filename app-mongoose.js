var as = require('./app-skeleton');
var hljs = require('highlight.js');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  name:  String,
  email: String
}, {
  strict: 'throw'
});
var User = mongoose.model('User', userSchema);

var blogSchema = new Schema({
  title:  String,
  author: { type: Schema.Types.ObjectId, ref: 'User' },
  body:   String,
  comments: [{ body: String, date: Date }],
  date: { type: Date, default: Date.now },
  hidden: Boolean,
  meta: {
    votes: Number,
    favs:  Number
  }
}, {
  strict: 'throw'
});
var Blog = mongoose.model('Blog', blogSchema);

var anySchema = new Schema({ any: {} });
//var anySchema = new Schema({ any: Schema.Types.Mixed });
var Any = mongoose.model('Any', anySchema);

var clearData = function(next) {
  Blog.remove(function(err, data) {
    if (err) throw err;
    Any.remove(function(err, data) {
      if (err) throw err;
      next();
    });
  });
};

var theUser = null;
var path = 'mongoose';

//Connect to mongo
as.app.use(function(req, res, next) {
  if (mongoose.connection.readyState > 0) {
    return next();
  }
  mongoose.connect('mongodb://localhost/mongotest');
  mongoose.connection.on('error', function(err) {
    next(err);
  });
  mongoose.connection.on('open', function() {
    User.findOne(function(err, usr) {
      if (err) throw err;
      if (!usr) {
        var newUsr = new User({name: 'Tester', email: 'tester@example.com'});
        newUsr.save(function(err, newUsr) {
          if (err) throw err;
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

//Create test data
as.app.use(function(req, res, next) {
  if (mongoose.connection.readyState > 0) {
    return next();
  }
  mongoose.connect('mongodb://localhost/mongotest');
  mongoose.connection.on('error', function(err) {
    next(err);
  });
  mongoose.connection.on('open', function() {
    next();
  });
});

as.app.get('/'+path+'/', function (req, res, next) {
  as.app.code = as.getCode(arguments);
  var blog = new Blog;
  blog.title = 'test';
  blog.body = 'test';
  blog.author = theUser._id;
  blog.save(function(err, d) {
    if (err) throw err;
    Blog.find(function(err, data) {
      var out = as.dataToString(data);
      res.render('data', {
        path: path,
        page: 'home',
        title: 'Mongoose - Creates a new model on each call',
        code:as.app.code,
        data: hljs.highlight('json', out).value});
    });
  });
});

as.app.get('/'+path+'/refs', function (req, res, next) {
  as.app.code = as.getCode(arguments);
  Blog.find().populate('author').exec(function(err, data) {
    var out = as.dataToString(data);
    res.render('data', {
      path: path,
      page: 'refs',
      title: 'Mongoose - Blog with author populated from User',
      code:as.app.code,
      data: hljs.highlight('json', out).value});
  });
});

as.app.get('/'+path+'/wrongSchema', function (req, res, next) {
  as.app.code = as.getCode(arguments);
  var blog = new Blog;
  blog.titleZ = 'test'; // will not raise an error, mongoose doesn't see such changes
  blog.bodyZ = 'test';
  blog.set('titleFF', 'test'); // should raise an error
  blog.save(function(err, d) {
    if (err) throw err;
    Blog.find(function(err, data) {
      var out = as.dataToString(data);
      res.render('data', {
        path: path,
        page: 'wrongSchema',
        title: 'Mongoose - titleFF does not exist and should raise an error',
        code: as.app.code,
        data: hljs.highlight('json', out).value
      });
    });
  });
});

as.app.get('/'+path+'/any', function (req, res, next) {
  as.app.code = as.getCode(arguments);
  var any = new Any;
  any.any = {titleZ: 'test', bodyZ: 'test'};
  any.markModified('any');
  any.save(function(err, doc, numberAffected) {
    Any.find(function(err, data) {
      var out = as.dataToString(data);
      res.render('data', {
        path: path,
        page: 'any',
        title: 'Mongoose - Any model, "any" field can be anything',
        code:as.app.code,
        data: hljs.highlight('json', out).value
      });
    });
  });
});

as.app.get('/'+path+'/clear', function (req, res, next) {
  clearData(function() {
    res.redirect('/'+path+'/');
  });
});

var express = require('express');
var hljs = require('highlight.js');
var _ = require('lodash');

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var app = express();
app.set('views', __dirname + '/public/views');
app.set('view engine', 'ejs');
app.engine('ejs', require('ejs').renderFile);
app.use(express.static(__dirname + '/public'));

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

var dataToString = function(data) {
  return _.reduce(data, function(sum, d) {
    return sum + JSON.stringify(d);
  }, '');
}

var getCode = function(args) {
  return hljs.highlight('javascript', args.callee.toString()).value;
}

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
//Connect to mongo
app.use(function(req, res, next) {
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
app.use(function(req, res, next) {
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

app.get('/', function (req, res) {
  var blog = new Blog;
  blog.title = 'test';
  blog.body = 'test';
  blog.author = theUser._id;
  blog.save(function(err, d) {
    if (err) throw err;
    Blog.find(function(err, data) {
      var out = dataToString(data);
      res.render('data', {
        title: 'Creates a new model on each call',
        code: getCode(arguments),
        data: hljs.highlight('json', out).value});
    });
  });
});

app.get('/refs', function (req, res) {
  Blog.find().populate('author').exec(function(err, data) {
    var out = dataToString(data);
    res.render('data', {
      title: 'Blog with author populated from User',
      code: getCode(arguments),
      data: hljs.highlight('json', out).value});
  });
});

var wrongSchemaArguments = null;
app.get('/wrongSchema', function (req, res) {
  wrongSchemaArguments = arguments;
  var blog = new Blog;
  blog.titleZ = 'test'; // will not raise an error, mongoose doesn't see such changes
  blog.bodyZ = 'test';
  blog.set('titleFF', 'test'); // should raise an error
  blog.save(function(err, d) {
    if (err) throw err;
    Blog.find(function(err, data) {
      var out = dataToString(data);
      res.render('data', {
        title: 'titleFF does not exist and should raise an error',
        code: getCode(wrongSchemaArguments),
        data: hljs.highlight('json', out).value
      });
    });
  });
});

app.get('/any', function (req, res) {
  var args = arguments;
  var any = new Any;
  any.any = {titleZ: 'test', bodyZ: 'test'};
  any.markModified('any');
  any.save(function(err, doc, numberAffected) {
    Any.find(function(err, data) {
      var out = dataToString(data);
      res.render('data', {
        title: 'Any model, "any" field can be anything',
        code: getCode(args),
        data: hljs.highlight('json', out).value
      });
    });
  });
});

app.get('/clear', function (req, res) {
  clearData(function() {
    res.redirect('/');
  });
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    var out = JSON.stringify(err.stack);
    res.render('data', {
      title: err.message,
      code: getCode(wrongSchemaArguments?wrongSchemaArguments:arguments),
      data: "<pre>"+err.stack+"</pre>"
    });
});


var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

})

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

var blogSchema = new Schema({
  title:  String,
  author: String,
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
  blog.save();

  Blog.find(function(err, data) {
    var out = dataToString(data);
    res.render('data', {
      title: 'Creates a new model on each call',
      data: hljs.highlight('json', out).value});
  });
});

app.get('/wrongSchema', function (req, res) {
  var blog = new Blog;
  blog.titleZ = 'test'; // will not raise an error, mongoose doesn't
                        // such changes
  blog.bodyZ = 'test';
  blog.set('titleFF', 'test'); // should raise an error
  blog.save();

  Blog.find(function(err, data) {
    var out = dataToString(data);
    res.render('data', {
      title: 'titleFF does not exist and should raise an error',
      data: hljs.highlight('json', out).value
    });
  });
});

app.get('/any', function (req, res) {
  var any = new Any;
  any.any = {titleZ: 'test', bodyZ: 'test'};
  any.markModified('any');
  any.save(function(err, doc, numberAffected) {
    Any.find(function(err, data) {
      var out = dataToString(data);
      res.render('data', {
        title: 'Any model, "any" field can be anything',
        data: hljs.highlight('json', out).value
      });
    });
  });
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    var out = JSON.stringify(err.stack);
    res.render('data', {
      title: err.message, 
      data: "<pre>"+err.stack+"</pre>"
    });
});


var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)

})

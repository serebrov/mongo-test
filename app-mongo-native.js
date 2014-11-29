var as = require('./app-skeleton');

var mongo = require('mongodb')
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

as.app.get('/', function (req, res) {
  var blog = new Blog;
  blog.title = 'test';
  blog.body = 'test';
  blog.author = theUser._id;
  blog.save(function(err, d) {
    if (err) throw err;
    Blog.find(function(err, data) {
      var out = as.dataToString(data);
      res.render('data', {
        title: 'Creates a new model on each call',
        code: as.getCode(arguments),
        data: as.hljs.highlight('json', out).value});
    });
  });
});

as.app.get('/refs', function (req, res) {
  Blog.find().populate('author').exec(function(err, data) {
    var out = as.dataToString(data);
    res.render('data', {
      title: 'Blog with author populated from User',
      code: as.getCode(arguments),
      data: as.hljs.highlight('json', out).value});
  });
});

var wrongSchemaArguments = null;
as.app.get('/wrongSchema', function (req, res) {
  wrongSchemaArguments = arguments;
  var blog = new Blog;
  blog.titleZ = 'test'; // will not raise an error, mongoose doesn't see such changes
  blog.bodyZ = 'test';
  blog.set('titleFF', 'test'); // should raise an error
  blog.save(function(err, d) {
    if (err) throw err;
    Blog.find(function(err, data) {
      var out = as.dataToString(data);
      res.render('data', {
        title: 'titleFF does not exist and should raise an error',
        code: as.getCode(wrongSchemaArguments),
        data: as.hljs.highlight('json', out).value
      });
    });
  });
});

as.app.get('/any', function (req, res) {
  var args = arguments;
  var any = new Any;
  any.any = {titleZ: 'test', bodyZ: 'test'};
  any.markModified('any');
  any.save(function(err, doc, numberAffected) {
    Any.find(function(err, data) {
      var out = as.dataToString(data);
      res.render('data', {
        title: 'Any model, "any" field can be anything',
        code: as.getCode(args),
        data: as.hljs.highlight('json', out).value
      });
    });
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
      code: as.getCode(wrongSchemaArguments?wrongSchemaArguments:arguments),
      data: "<pre>"+err.stack+"</pre>"
    });
});

as.run();


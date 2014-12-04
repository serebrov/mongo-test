var as = require('./app-skeleton');
var mongoNativeApp = require('./app-mongo-native');
var mongoNativeQApp = require('./app-mongo-native-q');
var mongooseApp = require('./app-mongoose');
var mongooseApp = require('./app-mongoskin');

as.app.get('/', function (req, res, next) {
  res.redirect('/mongo-native/');
});

as.app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    var out = JSON.stringify(err.stack);
    res.render('data', {
      path: 'mongo-native',
      page: 'error',
      title: err.message,
      code: as.app.code ? as.app.code : as.getCode(arguments),
      data: "<pre>"+err.stack+"</pre>"
    });
});

as.run();

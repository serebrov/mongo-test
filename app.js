var as = require('./app-skeleton');
require('./app-mongo-native');
require('./app-mongo-native-q');
require('./app-mongoose');
require('./app-mongoskin');
require('./app-monk');

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

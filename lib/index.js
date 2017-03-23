'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = init;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _feathersAuthentication = require('feathers-authentication');

var _feathersAuthentication2 = _interopRequireDefault(_feathersAuthentication);

var _feathersRest = require('feathers-rest');

var _feathersCommons = require('feathers-commons');

var _lodash = require('lodash.merge');

var _lodash2 = _interopRequireDefault(_lodash);

var _handler = require('./express/handler');

var _handler2 = _interopRequireDefault(_handler);

var _verifier = require('./verifier');

var _verifier2 = _interopRequireDefault(_verifier);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var debug = (0, _debug2.default)('feathers-authentication-oauth2');

var INCLUDE_KEYS = ['entity', 'service', 'passReqToCallback', 'session'];

var EXCLUDE_KEYS = ['Verifier', 'Strategy', 'formatter'];

function init() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function oauth2Auth() {
    var app = this;
    var _super = app.setup;

    if (!app.passport) {
      throw new Error('Can not find app.passport. Did you initialize feathers-authentication before feathers-authentication-oauth2?');
    }

    var name = options.name,
        Strategy = options.Strategy;


    if (!name) {
      throw new Error('You must provide a strategy \'name\'.');
    }

    if (!Strategy) {
      throw new Error('You must provide a passport \'Strategy\' instance.');
    }

    var authSettings = app.get('auth') || {};

    // Attempt to pull options from the global auth config
    // for this provider.
    var providerSettings = authSettings[name] || {};
    var oauth2Settings = (0, _lodash2.default)({
      idField: name + 'Id',
      path: '/auth/' + name,
      __oauth: true
    }, _feathersCommons.pick.apply(undefined, [authSettings].concat(INCLUDE_KEYS)), providerSettings, _feathersCommons.omit.apply(undefined, [options].concat(EXCLUDE_KEYS)));

    // Set callback defaults based on provided path
    oauth2Settings.callbackPath = oauth2Settings.callbackPath || oauth2Settings.path + '/callback';
    oauth2Settings.callbackURL = oauth2Settings.callbackURL || (0, _feathersCommons.makeUrl)(oauth2Settings.callbackPath, app);

    if (!oauth2Settings.clientID) {
      throw new Error('You must provide a \'clientID\' in your authentication configuration or pass one explicitly');
    }

    if (!oauth2Settings.clientSecret) {
      throw new Error('You must provide a \'clientSecret\' in your authentication configuration or pass one explicitly');
    }

    var Verifier = options.Verifier || _verifier2.default;
    var formatter = options.formatter || _feathersRest.formatter;
    var handler = options.handler || (0, _handler2.default)(oauth2Settings);

    // register OAuth middleware
    debug('Registering \'' + name + '\' Express OAuth middleware');
    app.get(oauth2Settings.path, _feathersAuthentication2.default.express.authenticate(name));
    app.get(oauth2Settings.callbackPath, _feathersAuthentication2.default.express.authenticate(name, oauth2Settings), handler, _feathersAuthentication2.default.express.emitEvents(authSettings), _feathersAuthentication2.default.express.setCookie(authSettings), _feathersAuthentication2.default.express.successRedirect(), _feathersAuthentication2.default.express.failureRedirect(authSettings), formatter);

    app.setup = function () {
      var result = _super.apply(this, arguments);
      var verifier = new Verifier(app, oauth2Settings);

      if (!verifier.verify) {
        throw new Error('Your verifier must implement a \'verify\' function. It should have the same signature as a oauth2 passport verify callback.');
      }

      // Register 'oauth2' strategy with passport
      debug('Registering oauth2 authentication strategy with options:', oauth2Settings);
      app.passport.use(name, new Strategy(oauth2Settings, verifier.verify.bind(verifier)));
      app.passport.options(name, oauth2Settings);

      return result;
    };
  };
}

// Exposed Modules
Object.assign(init, {
  Verifier: _verifier2.default
});
module.exports = exports['default'];
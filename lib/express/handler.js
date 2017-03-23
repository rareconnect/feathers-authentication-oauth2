'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = OAuthHandler;

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; } // The default Express middleware that gets called by the OAuth callback route.


var debug = (0, _debug2.default)('feathers-authentication-oauth2:handler');

function OAuthHandler() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (req, res, next) {
    var _params, _data;

    var app = req.app;
    var authSettings = app.get('auth') || {};
    var entity = req[options.entity];
    var payload = req.payload;
    var params = (_params = {
      authenticated: true
    }, _defineProperty(_params, options.entity, entity), _defineProperty(_params, 'payload', payload), _params);
    var data = (_data = {}, _defineProperty(_data, options.entity, entity), _defineProperty(_data, 'payload', payload), _data);

    debug('Executing \'' + options.name + '\' OAuth Callback');
    debug('Calling create on \'' + authSettings.path + '\' service with', entity);
    app.service(authSettings.path).create(data, params).then(function (result) {
      res.data = result;

      if (options.successRedirect) {
        res.hook = { data: {} };
        Object.defineProperty(res.hook.data, '__redirect', { value: { status: 302, url: options.successRedirect } });
      }

      next();
    }).catch(next);
  };
}
module.exports = exports['default'];
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = OAuthErrorHandler;
// The default Express error middleware that gets called by the OAuth callback route.

function OAuthErrorHandler() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  return function (err, req, res, next) {
    // Set __redirect so that later middleware (e.g., auth.express.failureRedirect) can redirect accordingly
    if (options.failureRedirect) {
      res.hook = { data: {} };
      Object.defineProperty(res.hook.data, '__redirect', { value: { status: 302, url: options.failureRedirect } });
    }

    next(err);
  };
}
module.exports = exports['default'];
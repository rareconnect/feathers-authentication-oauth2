'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require('lodash.merge');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var debug = (0, _debug2.default)('feathers-authentication-oauth2:verify');

var OAuth2Verifier = function () {
  function OAuth2Verifier(app) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, OAuth2Verifier);

    this.app = app;
    this.options = options;
    this.service = typeof options.service === 'string' ? app.service(options.service) : options.service;

    if (!this.service) {
      throw new Error('options.service does not exist.\n\tMake sure you are passing a valid service path or service instance and it is initialized before feathers-authentication-oauth2.');
    }

    this._createEntity = this._createEntity.bind(this);
    this._updateEntity = this._updateEntity.bind(this);
    this._normalizeResult = this._normalizeResult.bind(this);
    this.verify = this.verify.bind(this);
  }

  _createClass(OAuth2Verifier, [{
    key: '_normalizeResult',
    value: function _normalizeResult(results) {
      // Paginated services return the array of results in the data attribute.
      var entities = results.data ? results.data : results;
      var entity = entities[0];

      // Handle entity not found.
      if (!entity) {
        return Promise.resolve(null);
      }

      // Handle updating mongoose models
      if (typeof entity.toObject === 'function') {
        entity = entity.toObject();
      } else if (typeof entity.toJSON === 'function') {
        // Handle updating Sequelize models
        entity = entity.toJSON();
      }

      debug(this.options.entity + ' found');
      return Promise.resolve(entity);
    }
  }, {
    key: '_updateEntity',
    value: function _updateEntity(entity, data) {
      var _newData;

      var options = this.options;
      var name = options.name;
      var id = entity[this.service.id];
      debug('Updating ' + options.entity + ': ' + id);

      var newData = (_newData = {}, _defineProperty(_newData, options.idField, data.profile.id), _defineProperty(_newData, name, data), _newData);

      // Merge existing user data with new profile data
      var updated = (0, _lodash2.default)({}, entity, newData);
      return this.service.update(id, updated, { oauth: { provider: name } });
    }
  }, {
    key: '_createEntity',
    value: function _createEntity(data) {
      var _entity;

      var options = this.options;
      var name = options.name;
      var entity = (_entity = {}, _defineProperty(_entity, options.idField, data.profile.id), _defineProperty(_entity, name, data), _entity);

      var id = entity[options.idField];
      debug('Creating new ' + options.entity + ' with ' + options.idField + ': ' + id);

      return this.service.create(entity, { oauth: { provider: name } });
    }
  }, {
    key: 'verify',
    value: function verify(req, accessToken, refreshToken, profile, done) {
      var _query,
          _this = this;

      debug('Checking credentials');
      var options = this.options;
      var query = (_query = {}, _defineProperty(_query, options.idField, profile.id), _defineProperty(_query, '$limit', 1), _query);
      var data = { profile: profile, accessToken: accessToken, refreshToken: refreshToken };
      var existing = void 0;

      // Check request object for an existing entity
      if (req && req[options.entity]) {
        existing = req[options.entity];
      }

      // Check the request that came from a hook for an existing entity
      if (!existing && req && req.params && req.params[options.entity]) {
        existing = req.params[options.entity];
      }

      // If there is already an entity on the request object (ie. they are
      // already authenticated) attach the profile to the existing entity
      // because they are likely "linking" social accounts/profiles.
      if (existing) {
        return this._updateEntity(existing, data).then(function (entity) {
          return done(null, entity);
        }).catch(function (error) {
          return error ? done(error) : done(null, error);
        });
      }

      // Find or create the user since they could have signed up via facebook.
      this.service.find({ query: query }).then(this._normalizeResult).then(function (entity) {
        return entity ? _this._updateEntity(entity, data) : _this._createEntity(data);
      }).then(function (entity) {
        var id = entity[_this.service.id];
        var payload = _defineProperty({}, _this.options.entity + 'Id', id);
        done(null, entity, payload);
      }).catch(function (error) {
        return error ? done(error) : done(null, error);
      });
    }
  }]);

  return OAuth2Verifier;
}();

exports.default = OAuth2Verifier;
module.exports = exports['default'];
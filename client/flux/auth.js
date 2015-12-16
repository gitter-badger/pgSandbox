var _ = require('lodash');
var Emitter = require('./emitter');
var ajax = require('../utilities/ajax');
var Promise = require('bluebird');

var emitter = new Emitter();
var busy = false;
var credentials = null;
var error = null;

var methods = {
  listen: function (listener) {
    emitter.listen(listener);
  },
  unlisten: function (listener) {
    emitter.unlisten(listener);
  },
  getCredentials: function () {
    return credentials;
  },
  isBusy: function () {
    return busy;
  },
  getError: function () {
    return error;
  },
  clearError: function () {
    error = null;
    emitter.emit();
  },
  logIn: function (auth) {
    busy = true;
    error = null;
    credentials = _.clone(auth);
    emitter.emit();
    return ajax({
      method: 'GET',
      uri: '/api/auth',
      auth: credentials
    }).tap(function (response) {
      if (response.statusCode === 200) {
        credentials = auth;
        localStorage.auth = JSON.stringify(credentials);
      } else {
        error = response.body;
        credentials = null;
        delete localStorage.auth;
      }
      busy = false;
      emitter.emit();
    }).catch(function (err) {
      error = err.message;
      emitter.emit();
    });
  },
  resume: function () {
    error = null;
    if (localStorage.auth) {
      var auth = JSON.parse(localStorage.auth);
      return methods.logIn(auth);
    } else {
      return Promise.resolve();
    }
  },
  logOut: function () {
    error = null;
    credentials = null;
    delete localStorage.auth;
    emitter.emit();
  }
};

module.exports = methods;

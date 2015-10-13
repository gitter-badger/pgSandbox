var assert = require('assert');
var sinon = require('sinon');
var appUrl = require('../../../package.json').appUrl;
var mockBookshelf = require('./mockBookshelf');
var Model = mockBookshelf.model('User', ['setPassword', 'verifyPassword', 'verifyPasswordResetKey', 'generatePasswordResetKey']);
var mockEmailer = require('./mockEmailer');
var proxyquire = require('proxyquire');
var GeneralBiz = proxyquire('../../../server/businessLogic/general', {
  '../models/bookshelf': mockBookshelf
});
var UserBiz = proxyquire('../../../server/businessLogic/user', {
  '../models/bookshelf': mockBookshelf,
  './emailer': mockEmailer,
  './general': GeneralBiz
});
var biz = proxyquire('../../../server/businessLogic/biz', {
  '../models/bookshelf': mockBookshelf,
  './user': UserBiz
});

describe('user', function () {
  var emailAddress = 'mocha.test.email.address@not.a.real.domain.com';
  var id = 1;
  var password = 'taco tuesday';
  var passwordResetKey = 'abc123';

  beforeEach(function (done) {
    Model.clearInstances();
    Model.reset();
    mockBookshelf.clearTrxs();
    mockEmailer.reset();
    done();
  });

  it('should be able to create', function (done) {
    var expectedUser = {
      id: id,
      emailAddress: emailAddress
    };
    var instance = Model.queueInstances(1)[0];
    instance.generatePasswordResetKey.returns(passwordResetKey);
    instance.get.withArgs('id').returns(id);
    instance.serialize.returns(expectedUser);
    var trx = mockBookshelf.queueTrxs(1)[0];
    var emailMessage = 'Set your password at the following URL: ' + appUrl + '/user/' + id + '/setPassword?key=' + passwordResetKey;

    biz.anonymous.user().create({
      emailAddress: emailAddress
    }).then(
      function (user) {

        assert(Model.withArgs({
          emailAddress: emailAddress
        }).calledOnce, 'The model was not instantiated properly.');
        assert(instance.save.withArgs(null, null, null,
          sinon.match({
            transacting: sinon.match.same(trx)
          })
        ).calledOnce, 'The model was not saved properly.');
        assert.deepStrictEqual(user, expectedUser, 'The returned user was wrong.');
        assert(mockEmailer.withArgs(emailAddress, emailMessage).calledOnce, 'The password setting email was not sent properly.');

        done();

      },
      function (err) {
        done(err);
      }
    ).catch(function (err) {
      done(err);
    });
  });

  it('should be able to send a password reset email', function (done) {
    var instance = Model.queueInstances(1)[0];
    instance.generatePasswordResetKey.returns(passwordResetKey);
    instance.get.withArgs('emailAddress').returns(emailAddress);
    instance.get.withArgs('id').returns(id);
    var trx = mockBookshelf.queueTrxs(1)[0];
    var emailMessage = 'Set your password at the following URL: ' + appUrl + '/user/' + id + '/setPassword?key=' + passwordResetKey;

    biz.anonymous.user(id).update({
      passwordResetKey: true
    }).then(
      function (user) {

        assert(instance.fetch.calledOnce, 'The model was not fetched properly.');
        assert(instance.generatePasswordResetKey.calledOnce, 'The password reset key was not generated properly.');
        assert(instance.save.withArgs(null, null, null,
          sinon.match({
            transacting: sinon.match.same(trx)
          })
        ).calledOnce, 'The model was not saved properly.');
        assert(mockEmailer.withArgs(emailAddress, emailMessage).calledOnce, 'The password setting email was not sent properly.');

        done();

      },
      function (err) {
        done(err);
      }
    ).catch(function (err) {
      done(err);
    });
  });

  it('should be able to set a password', function (done) {
    var expectedUser = {
      id: id,
      emailAddress: emailAddress
    };
    var instance = Model.queueInstances(1)[0];
    instance.verifyPasswordResetKey.returns(true);
    instance.serialize.returns(expectedUser);
    var trx = mockBookshelf.queueTrxs(1)[0];

    biz.anonymous.user(1).update({
      password: password,
      passwordResetKey: passwordResetKey
    }).then(
      function (user) {

        assert(instance.fetch.calledOnce, 'The model was not fetched properly.');
        assert(instance.verifyPasswordResetKey.withArgs(passwordResetKey).calledOnce, 'The password reset key was not verified properly.');
        assert(instance.setPassword.withArgs(password).calledOnce, 'The password was not set properly.');
        assert(instance.save.withArgs(null, null, null,
          sinon.match({
            transacting: sinon.match.same(trx)
          })
        ).calledOnce, 'The model was not saved properly.');
        assert.deepStrictEqual(user, expectedUser, 'The returned user was wrong.');
        done();

      },
      function (err) {
        done(err);
      }
    ).catch(function (err) {
      done(err);
    });
  });

  it('should be able to set an email address', function (done) {
    var mod = emailAddress + 'a';
    var expectedUser = {
      emailAddress: mod
    };
    var instances = Model.queueInstances(2);
    instances[1].serialize.returns(expectedUser);
    var trx = mockBookshelf.queueTrxs(1)[0];

    biz.authenticate(emailAddress, password).user(1).update({
      emailAddress: mod
    }).then(
      function (user) {

        assert(instances[1].fetch.calledOnce, 'The model was not fetched properly.');
        assert(instances[1].set.withArgs({
          emailAddress: mod
        }).calledOnce, 'The email address was not set properly.');
        assert(instances[1].save.withArgs().calledOnce, 'The model was not saved properly.');
        assert.deepStrictEqual(user, expectedUser, 'The returned user was wrong.');

        done();
      },
      function (err) {
        done(err);
      }
    ).catch(function (err) {
      done(err);
    });

  });

  context('when the model fails to set an attribute', function () {
    it('should fail to create');
    it('should fail to set a password');
    it('should fail to set an email address');
  });
  context('when the model fails to save', function () {
    it('should fail to create');
    it('should fail to generate a password reset key');
    it('should fail to set a password');
    it('should fail to set an email address');
  });
  context('when the model fails another operation', function () {
    it('should fail to verify a wrong password');
    it('should fail to verify a wrong password reset key');
    it('should fail to authenticate with a bad email address');
    it('should fail to set an email address on a non-existent user');
  });
  context('when the emailer fails', function () {
    it('should fail to create');
    it('should fail to generate a password reset key');
  });

});

var assert = require('assert');
var User = require('../models/user');

describe('the user model', function () {
  var emailAddress = 'mocha.test.email.address@not.a.real.domain.com';
  var badEmailAddress = 'NotAValidEmailAddress.com';
  var password = 'taco tuesday';
  var passwordResetKey;

  it('should be able to be created', function (done) {
    new User({
      emailAddress: emailAddress
    }).save().then(function () {
      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should fail to be created when its email address is omitted', function (done) {
    new User({}).save().then(

      // Successfully created.
      function (user) {
        user.destroy().then(function () {
          done(new Error('The user was successfully created without an email address.'));
        });
      },

      // Failed to create.
      function () {
        done();
      }

    ).catch(function (err) {
      done(err);
    });
  });

  it('should fail to be created when its email address is not unique', function (done) {
    new User({
      emailAddress: emailAddress
    }).save().then(

      // Successfully created.
      function (user) {
        user.destroy().then(function () {
          done(new Error('The user was successfully created with an already used email address.'));
        });
      },

      // Failed to create.
      function () {
        done();
      }

    ).catch(function (err) {
      done(err);
    });
  });

  it('should fail to be created with an invalid email address', function (done) {
    new User({
      emailAddress: badEmailAddress
    }).save().then(

      // Successfully created.
      function (user) {
        user.destroy().then(function () {
          done(new Error('The user was successfully created with an already used email address.'));
        });
      },

      // Failed to create.
      function () {
        done();
      }

    ).catch(function (err) {
      done(err);
    });
  });

  it('should be able to set its password', function (done) {
    new User({
      emailAddress: emailAddress
    }).fetch().then(function (user) {

      // Set the password using the key.
      user.setPassword(password);
      return user.save();

    }).then(function () {
      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should be able to validate its password', function (done) {
    new User({
      emailAddress: emailAddress
    }).fetch().then(function (user) {
      var authenticated = user.validatePassword(password);
      if (authenticated) {
        done();
      } else {
        done(new Error('Authentication failed.'));
      }
    }).catch(function (err) {
      done(err);
    });
  });

  it('should fail to validate an incorrect password', function (done) {
    new User({
      emailAddress: emailAddress
    }).fetch().then(function (user) {
      var authenticated = user.validatePassword(password + 'a');
      if (authenticated) {
        done(new Error('The user logged in successfully with the wrong password.'));
      } else {
        done();
      }
    });
  });

  it('should be able to generate a password reset key', function (done) {
    new User({
      emailAddress: emailAddress
    }).fetch().then(function (user) {
      passwordResetKey = user.generatePasswordResetKey();
      return user.save();
    }).then(function () {

      // Validate the format of the key.
      if (typeof passwordResetKey === 'string' && passwordResetKey.match(/^[A-Za-z0-9]{30}$/)) {
        done();
      } else {
        done(new Error('The key was not a string of 30 alphanumerics.'));
      }

    }).catch(function (err) {
      done(err);
    });
  });

  it('should be able to validate its password reset key', function (done) {
    new User({
      emailAddress: emailAddress
    }).fetch().then(function (user) {

      var keyValid = user.validatePasswordResetKey(passwordResetKey);
      if (keyValid) {
        var keyCleared = !user.has('passwordResetKeyHash');
        if (keyCleared) {
          done();
        } else {
          done(new Error('The key was not cleared after validation.'));
        }
      } else {
        done(new Error('The key failed to validate.'));
      }

    }).catch(function (err) {
      done(err);
    });
  });

  it('should fail to validate an incorrect password reset key', function (done) {
    new User({
      emailAddress: emailAddress
    }).fetch().then(function (user) {

      var keyValid = user.validatePasswordResetKey(passwordResetKey + 'a');
      if (keyValid) {
        done(new Error('An incorrect key validated successfully.'));
      } else {
        done();
      }

    }).catch(function (err) {
      done(err);
    });
  });

  it('should be able to set its email address', function (done) {
    var expectedMod = emailAddress + 'a';
    var actualMod;

    // Fetch the user.
    new User({
      emailAddress: emailAddress
    }).fetch().then(function (user) {

      // Modify the email address.
      return user.set('emailAddress', expectedMod).save();

    }).then(function (user) {

      // What is the email address after the update?
      actualMod = user.get('emailAddress');

      // Revert to the original email address.
      return user.set('emailAddress', emailAddress).save();

    }).then(function () {

      assert.notStrictEqual(actualMod, emailAddress,
        'The email address was not changed.');
      assert.strictEqual(actualMod, expectedMod,
        'The email address was changed incorrectly.');

      done();
    }).catch(function (err) {
      done(err);
    });
  });

  it('should fail to set an invalid email address', function (done) {

    // Fetch the user.
    new User({
      emailAddress: emailAddress
    }).fetch().then(function (user) {

      // Modify the email address.
      return user.set('emailAddress', badEmailAddress).save();

    }).then(

      // Successfully changed.
      function (user) {
        // Revert to the original email address.
        user.set('emailAddress', emailAddress)
          .save().then(function () {
            done(new Error('The user\'s email address was successfully changed to something invalid.'));
          });
      },

      // Failed to change.
      function () {
        done();
      }
    ).catch(function (err) {
      done(err);
    });
  });

  it('should be able to be deleted', function (done) {
    new User({
      emailAddress: emailAddress
    }).fetch().then(function (user) {
      user.destroy().then(function () {
        done();
      }).catch(function (err) {
        done(err);
      });
    });
  });

  after(function () {
    new User({
      emailAddress: emailAddress
    }).fetch().then(function (user) {
      user.destroy();
    });
  });
});

var Promise = require('bluebird');
var assert = require('assert');
var ajax = require('../../../client/utilities/ajax');
var sinon = require('sinon');
var http = require('http');
var express = require('express');
var parseAuth = require('basic-auth');
var bodyParser = require('body-parser');

describe('blog post', function () {

  var emailAddress = 'mocha.test.email.address@not.a.real.domain.com';
  var password = 'taco tuesday';

  var requestAuth = {
    emailAddress: emailAddress,
    password: password
  };
  var requestBody;
  var responseBody;

  var bizQueue = [];

  function bizPromiseReturner() {
    var result = bizQueue.pop();
    if (result instanceof Error) {
      return Promise.reject(result);
    } else {
      return Promise.resolve(result);
    }
  }
  var blogPostBiz = {
    create: sinon.spy(bizPromiseReturner),
    read: sinon.spy(bizPromiseReturner),
    update: sinon.spy(bizPromiseReturner),
    delete: sinon.spy(bizPromiseReturner)
  };

  var server;

  before('Host the blog post transport module on a server.', function () {
    var blogRouter = require('../../../server/transport/blogPost')(blogPostBiz);
    var app = express();
    app.use(function authMiddleware(req, res, next) {
      var auth = parseAuth(req);
      if (auth) {
        req.auth = {
          emailAddress: auth.name,
          password: auth.pass
        };
      }
      next();
    });
    app.use(bodyParser.json({
      type: 'application/json'
    }));
    app.use('/api/blog', blogRouter);
    server = http.createServer(app);
    server.listen(3000);
  });

  after('Close the server.', function () {
    server.close();
  });

  beforeEach('Reset the blogPostBiz stubs.', function () {
    blogPostBiz.create.reset();
    blogPostBiz.read.reset();
    blogPostBiz.update.reset();
    bizQueue.length = 0;

    requestBody = {
      foo: 'bar'
    };
    responseBody = {
      hello: 'world'
    };
    bizQueue.unshift(responseBody);
  });

  describe('/blog', function () {

    it('should read on GET', function () {
      var requestMatcher = sinon.match({
        auth: sinon.match(requestAuth),
        params: sinon.match({}),
        query: sinon.match({}),
        body: sinon.match(requestBody)
      });
      return ajax({
        method: 'GET',
        uri: 'http://localhost:3000/api/blog',
        auth: {
          user: emailAddress,
          pass: password
        },
        json: true,
        body: requestBody
      }).then(function (response) {
        assert(blogPostBiz.read.withArgs(requestMatcher).calledOnce, 'Create was not called properly.');
        assert.deepEqual(response.body, responseBody, 'The router returned the wrong thing.');
      });
    });

    it('should forward defined errors', function () {
      var requestMatcher = sinon.match({
        auth: sinon.match(requestAuth),
        params: sinon.match({}),
        query: sinon.match({}),
        body: sinon.match(requestBody)
      });
      bizQueue.pop();
      var error = new Error();
      error.errorCode = 599;
      bizQueue.unshift(error);
      return ajax({
        method: 'GET',
        uri: 'http://localhost:3000/api/blog',
        auth: {
          user: emailAddress,
          pass: password
        },
        json: true,
        body: requestBody
      }).then(function (response) {
        assert(blogPostBiz.read.withArgs(requestMatcher).calledOnce, 'Read was not called properly.');
        assert.equal(response.statusCode, error.errorCode, 'The router returned the wrong thing.');
      });
    });

    it('should forward generic errors', function () {
      var requestMatcher = sinon.match({
        auth: sinon.match(requestAuth),
        params: sinon.match({}),
        query: sinon.match({}),
        body: sinon.match(requestBody)
      });
      bizQueue.pop();
      var error = new Error();
      bizQueue.unshift(error);
      return ajax({
        method: 'GET',
        uri: 'http://localhost:3000/api/blog',
        auth: {
          user: emailAddress,
          pass: password
        },
        json: true,
        body: requestBody
      }).then(function (response) {
        assert(blogPostBiz.read.withArgs(requestMatcher).calledOnce, 'Read was not called properly.');
        assert.equal(response.statusCode, 500, 'The router returned the wrong thing.');
      });
    });

    describe('/:postId', function () {

      it('should create on POST', function () {
        var requestMatcher = sinon.match({
          auth: sinon.match(requestAuth),
          params: sinon.match({}),
          query: sinon.match({}),
          body: sinon.match(requestBody)
        });
        return ajax({
          method: 'POST',
          uri: 'http://localhost:3000/api/blog/123',
          auth: {
            user: emailAddress,
            pass: password
          },
          json: true,
          body: requestBody
        }).then(function (response) {
          assert(blogPostBiz.create.withArgs(requestMatcher).calledOnce, 'Create was not called properly.');
          assert.deepEqual(response.body, responseBody, 'The router returned the wrong thing.');
        });
      });

      it('should read on GET', function () {
        var requestMatcher = sinon.match({
          auth: sinon.match(requestAuth),
          params: sinon.match({}),
          query: sinon.match({}),
          body: sinon.match(requestBody)
        });
        return ajax({
          method: 'GET',
          uri: 'http://localhost:3000/api/blog/123',
          auth: {
            user: emailAddress,
            pass: password
          },
          json: true,
          body: requestBody
        }).then(function (response) {
          assert(blogPostBiz.read.withArgs(requestMatcher).calledOnce, 'Create was not called properly.');
          assert.deepEqual(response.body, responseBody, 'The router returned the wrong thing.');
        });
      });

      it('should update on PUT', function () {
        var requestMatcher = sinon.match({
          auth: sinon.match(requestAuth),
          params: sinon.match({}),
          query: sinon.match({}),
          body: sinon.match(requestBody)
        });
        return ajax({
          method: 'PUT',
          uri: 'http://localhost:3000/api/blog/123',
          auth: {
            user: emailAddress,
            pass: password
          },
          json: true,
          body: requestBody
        }).then(function (response) {
          assert(blogPostBiz.update.withArgs(requestMatcher).calledOnce, 'Create was not called properly.');
          assert.deepEqual(response.body, responseBody, 'The router returned the wrong thing.');
        });
      });

      it('should delete on DELETE', function () {
        var requestMatcher = sinon.match({
          auth: sinon.match(requestAuth),
          params: sinon.match({}),
          query: sinon.match({}),
          body: sinon.match(requestBody)
        });
        return ajax({
          method: 'DELETE',
          uri: 'http://localhost:3000/api/blog/123',
          auth: {
            user: emailAddress,
            pass: password
          },
          json: true,
          body: requestBody
        }).then(function (response) {
          assert(blogPostBiz.delete.withArgs(requestMatcher).calledOnce, 'Delete was not called properly.');
          assert.deepEqual(response.body, responseBody, 'The router returned the wrong thing.');
        });
      });

    });

  });

});

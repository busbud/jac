"use strict";

var should = require('should');
var path   = require('path');
var assert = require('assert');
var express= require('express');
var request= require('supertest');

describe('Middleware', function () {
  var factory = require('../src/middleware');
  var twoweeks= 3600 * 24 * 14;

  describe('with single config entry', function () {
    var middleware
      , app;

    before(function () {
      middleware = factory.create({
        assets: [
          {
            fullPath: path.resolve(__dirname, './fixtures/spacer.gif'),
            key:      '/images/spacer.gif',
            route:    '/images/b64Digest/spacer.gif',
            url:      '/images/b64Digest/spacer.gif'
          }
        ]
      });

      app = express.createServer();

      app.use(middleware);

      // Set up views for testing middleware
      app.get('/view-spacer', function (req, res) {
        res.send(res.local('jac').resolve('/images/spacer.gif'));
      });
      app.get('/view-unresolved', function (req, res) {
        res.send(res.local('jac').resolve('/images/noexisto.gif'));
      });
      app.error(function (err, req, res, next) {
        res.send(err.message, 500);
      });
    });

    after(function () {
      app.close();
    });

    it('should not be null', function () {
      should.exist(middleware);
    });

    it('should be a function', function () {
      middleware.should.be.instanceof(Function);
    });

    it('should stream the img file on exact url match', function (done) {
      request(app)
        .get('/images/b64Digest/spacer.gif')
        .expect('Cache-Control', 'public, max-age=' + twoweeks)
        .expect('Content-Type', 'image/gif')
        .expect('Content-Length', '43')
        .expect('Vary', 'Accept-Encoding')
        .expect(200, done);
    });

    it('should 404 on digest mismatch', function (done) {
      request(app)
        .get('/images/b64DigestX/spacer.gif')
        .expect(404, done);
    });

    it('should 404 on digest omission', function (done) {
      request(app)
        .get('/images/spacer.gif')
        .expect(404, done);
    });

    it('should resolve the img url for other responses', function (done) {
      request(app)
        .get('/view-spacer')
        .expect(200, '/images/b64Digest/spacer.gif', done);
    });

    it('should throw an error for unknown img urls', function (done) {
      request(app)
        .get('/view-unresolved')
        .expect(500, 'jac: key /images/noexisto.gif not found, regenerate jac config or update key value to match key in jac config', done);
    });
  });
});
"use strict";

var should = require('should');
var path   = require('path');
var assert = require('assert');
var express= require('express');
var request= require('supertest');

describe('Hash Strategy', function () {
  var factory = require('../src/strategy/hash');

  // Setup algorithm/hash mapping for spacer file
  var digests = {
    '': {
      'md5': 'MlRyYBVx8x4b8AZ0w2jTNQ==',
      'sha1':'La6qi18Z8LwgnZdsAr1qy1GwCwo='
    },
    1: {
      'md5': 'TKX3uHbkUGXNoc4yxKgLJA==',
      'sha1':'06ZZ1arUCeEiXsqE3_CAzeJN-LY='
    }
  };

  var lengths = [5, 7];

  lengths.forEach(function (length) {
    Object.keys(digests).forEach(function (salt) {
      Object.keys(digests[salt]).forEach(function(algo) {
        var expectedDigest = digests[salt][algo].substr(0, length);

        describe(length + ' char ' + algo + ' digest with ' + (salt||'no') + ' salt', function () {
          var strategy = factory.create({
            algorithm: algo,
            length: length,
            salt: salt
          });

          it('should not be null', function () {
            should.exist(strategy);
          });

          it('should have a digest method', function () {
            should.exist(strategy.digest);
            strategy.digest.should.be.instanceof(Function);
          });

          describe('handles existing content', function () {
            var entry = {
              fullPath: path.resolve(__dirname, './fixtures/spacer.gif')
            };

            before(function (done) {
              strategy.digest(entry, done);
            });

            it('should set digest as first N chars of hash', function () {
              should.exist(entry);
              entry.should.have.ownProperty('digest');
              entry.digest.should.equal(expectedDigest);
              entry.digest.should.have.length(length);
            });
          });

          describe('handles non-existent content', function () {
            var error;
            var entry = {
              fullPath: path.resolve(__dirname, '../fixtures/no existo.gif')
            };

            before(function (done) {
              strategy.digest(entry, function (err, result) {
                error = err;
                entry = result;
                done();
              });
            });

            it('should call back with error', function () {
              should.exist(error);
              error.code.should.equal('ENOENT');
            });

            it('entry should be undefined', function () {
              should.not.exist(entry);
            });
          });
        });
      });
    });
  });
});
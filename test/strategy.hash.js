var vows   = require('vows'); // used for assert functions
var path   = require('path');
var assert = require('assert');
var express= require('express');
var request= require('supertest');

describe('Hash Strategy', function () {
  var factory = require('../src/strategy/hash');

  // Setup algorithm/hash mapping for spacer file
  var algorithms = {
    'md5': 'MlRyYBVx8x4b8AZ0w2jTNQ==',
    'sha1':'La6qi18Z8LwgnZdsAr1qy1GwCwo='
  };


  var lengths = [5, 7];

  lengths.forEach(function (length) {
    Object.keys(algorithms).forEach(function(algo) {
      var expectedDigest = algorithms[algo].substr(0, length);

      describe(length + ' char ' + algo + ' digest', function () {
        var strategy = factory.create({
          algorithm: algo,
          length: length
        });

        it('should not be null', function () {
          assert.isNotNull(strategy);
        });

        it('should have a digest method', function () {
          assert.isFunction(strategy.digest);
        });

        describe('handles existing content', function () {
          var entry = {
            fullPath: path.resolve(__dirname, './fixtures/spacer.gif')
          };

          before(function (done) {
            strategy.digest(entry, done);
          });

          it('should set digest as first N chars of hash', function () {
            assert.isNotNull(entry);
            assert.equal(expectedDigest, entry.digest);
            assert.lengthOf(entry.digest, length);
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
            assert.isNotNull(error);
            assert.equal(error.code, 'ENOENT');
          });

          it('entry should be undefined', function () {
            assert.isUndefined(entry);
          });
        });
      });
    });
  });
});
"use strict";

var should = require('should');
var fs     = require('fs');
var path   = require('path');
var async  = require('async');
var _      = require('lodash');

describe('CSS filter', function () {
  var css = require('../src/css');

  describe('process', function () {

    it('should have a method called process', function () {
      should.exist(css);
      css.should.have.ownProperty('process');
      css.process.should.be.instanceof(Function);
    });

    it('should replace static image references', function (done) {
      var inputs    = [path.resolve(__dirname, './fixtures/imagereferences.css')];
      var outputs   = inputs.map(function (p) { return p.replace('.css', '.out.css').replace('/fixtures/', '/fixtures/temp/'); });
      var expecteds = inputs.map(function (p) { return p.replace('.css', '.expected.css'); });
      var pairs     = _.zip(outputs, expecteds);
      var files     = _.reduce(_.zip(outputs, inputs), function (m, k) {m[k[0]] = k[1]; return m;}, {});

      css.process(
        {
          assets: [
            {
              fullPath: path.resolve(__dirname, './fixtures/spacer.gif'),
              key:      '/images/spacer.gif',
              route:    '/images/spacer.gif.b64Digest',
              mtime:    new Date()
            }
          ],
          css: files,
          silent: true
        },
        verify
      );

      function verify() {
        async.forEachSeries(pairs, match, done);

        function match(files, cb) {
          async.map(files, fs.readFile, function (err, contents) {
            should.not.exist(err);
            contents[0].toString().should.equal(contents[1].toString());
            cb(err);
          });
        }
      }
    });
  });
});
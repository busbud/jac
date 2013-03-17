"use strict";

var should = require('should');
var fs     = require('fs');
var path   = require('path');
var async  = require('async');
var _      = require('lodash');

describe('CSS filter', function () {
  var css = require('../src/css');

  describe('process', function () {

    /**
     * Verify the substitution process
     *
     * @param {Object} files, where key=output, value=input
     * @param outputPath
     * @param expectedPath
     * @param done
     */
    function verifyProcessing(files, outputPath, expectedPath, done) {
      css.process(
        {
          assets: [
            {
              fullPath: path.resolve(__dirname, './fixtures/spacer.gif'),
              key:      '/images/spacer.gif',
              route:    '/images/b64Digest/spacer.gif'
            }
          ],
          css: files,
          silent: true
        },
        verify
      );

      function verify() {
        var outputContent   = fs.readFileSync(outputPath).toString();
        var expectedContent = fs.readFileSync(expectedPath).toString();

        outputContent.should.equal(expectedContent);
        done();
      }
    }

    it('should have a method called process', function () {
      should.exist(css);
      css.should.have.ownProperty('process');
      css.process.should.be.instanceof(Function);
    });

    it('should replace static image references', function (done) {
      var expected = path.resolve(__dirname, './fixtures/imagereferences.expected.css');
      var input    = path.resolve(__dirname, './fixtures/imagereferences.css');
      var output   = path.resolve(__dirname, './fixtures/temp/imagereferences.out.css');
      var files    = {};

      // Output is sourced from input
      files[output] = input;

      verifyProcessing(files, output, expected, done);
    });

    it('should ignore previously resolved static image references', function (done) {
      var expected = path.resolve(__dirname, './fixtures/imagereferences.expected.css');
      var input    = expected;
      var output   = path.resolve(__dirname, './fixtures/temp/imagereferences.out.css');
      var files    = {};

      // Output is sourced from input
      files[output] = input;

      verifyProcessing(files, output, expected, done);
    });
  });
});
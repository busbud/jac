"use strict";

var mkdirp     = require('mkdirp');
var async      = require('async');
var path       = require('path');
var fs         = require('fs');
var _          = require('lodash');
var middleware = require('./middleware');

var extractor  = /\burl\(['"]?([^\)]+?)['"]?\)/gi;

module.exports = {
  /**
   * Replaces all url references to images in CSS files with
   * cachable url references
   *
   * @param {Object} config
   * @param {Object} files {dest1:src1, dest2:src2}
   * @param {Function} done
   */
  process: function (config, files, done) {
    var resolve     = middleware.create(config).resolve;
    var concurrency = 1;
    var sources     = _.values(files);
    var sourcemap   = _.invert(files);

    async.forEachLimit(
      sources,
      concurrency,
      replace,
      done
    );

    function replace(file, done) {
      var steps = [];

      steps.push(function outputdir(cb) {
        var filepath = sourcemap[file];
        var dir      = path.dirname(filepath);
        var exists   = fs.exists || path.exists;

        exists(dir, function (flag) {
          if (!flag) {
            mkdirp(dir, function (err) {
              cb(err);
            });
          } else {
            cb(null);
          }
        });
      });

      steps.push(function read(cb) {
        fs.readFile(file, cb);
      });

      steps.push(function makeCachable(contents, cb) {
        var replaced = contents.toString().replace(extractor, function (prop, url) {
          return prop.replace(url, resolve(url));
        });

        cb(null, replaced);
      });

      steps.push(function write(contents, cb) {
        fs.writeFile(sourcemap[file], contents, cb);
      });

      async.waterfall(steps, done);
    }
  }
};
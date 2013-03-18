"use strict";

var mkdirp     = require('mkdirp');
var URIjs      = require('URIjs');
var async      = require('async');
var path       = require('path');
var fs         = require('fs');
var _          = require('lodash');
var middleware = require('./middleware');

var extractor  = /\burl\(['"]?([^\)]+?)['"]?\)/gi;

var css = module.exports = {};

/**
 * Replaces all url references to images in CSS files with
 * cachable url references
 *
 * @param {Object} config, with a key called 'css' with the value {dest1:src1, dest2:src2}
 * @param {Function} done
 */
css.process = function (config, done) {
  var files       = config.css;
  var silent      = config.silent;
  var concurrency = 1;
  var sources     = _.values(files);
  var sourcemap   = _.invert(files);

  var assetsByUrl = config.assets.reduce(function (m, asset) {
    m[asset.url] = asset;
    return m;
  }, {});

  var assetsByKey = config.assets.reduce(function (m, asset) {
    m[asset.key] = asset;
    return m;
  }, {});

  async.forEachLimit(
    sources,
    concurrency,
    replace,
    done
  );

  function log () {
    if (!silent) {
      console.log.apply(null, Array.prototype.slice.call(arguments));
    }
  }

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
      var count = 0;
      var replaced = contents.toString().replace(extractor, function (prop, key) {
        var uri = new URIjs(key);

        if (!uri.authority() && !uri.protocol()) {
          count++;
          if (key in assetsByUrl) {
            // Route was already transformed
            return prop;
          }

          var asset = assetsByKey[key];
          if (asset) {
            return prop.replace(key, asset.url);
          }
          else {
            throw new Error('jac: file:' + file + ': key ' + key + ' not found, regenerate jac config (or refresh/update your css)');
          }
        } else {
          return prop;
        }
      });

      cb(null, replaced, count);
    });

    steps.push(function write(contents, count, cb) {
      var output = sourcemap[file];
      log('updating %s with %d replacement(s)', output, count);

      fs.writeFile(output, contents, cb);
    });

    async.waterfall(steps, done);
  }
};
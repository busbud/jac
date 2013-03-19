"use strict";

var _        = require('lodash');
var url      = require('url');
var path     = require('path');
var async    = require('async');
var URIjs    = require('URIjs');
var readdirp = require('readdirp');

var digester = module.exports = {};

function selectStrategy(opts) {
  var strategy = opts.strategy;
  var digestfn = strategy;

  if (!_.isFunction(strategy)) {
    strategy = require('./strategy/hash').create(opts);
    digestfn = strategy.digest.bind(strategy);
  }

  return digestfn;
}

/**
 * Processes all files under opts.root and generates the config
 * entries for each matched file.
 *
 * @param opts     {root, vdir, strategy, strategy-config}
 * @param callback fn(err, entries)
 */
digester.process = function (opts, callback) {
  var root = opts.root || '.';
  var vdir = opts.vdir || '/';
  var host = opts.host || '';
  var filter   = opts.fileFilter || ['*.gif', '*.jpg', '*.jpeg', '*.png'];
  var silent   = opts.silent;
  var strategy = selectStrategy(opts);
  var start    = Date.now();
  var base     = process.cwd();

  vdir = url.parse(vdir);

  function log () {
    if (!silent) {
      console.log.apply(null, Array.prototype.slice.call(arguments));
    }
  }

  readdirp({root: root, fileFilter: filter}, function (err, tree) {
    if (err) {
      return callback(err);
    }

    var processed = [];
    var entries = tree.files.filter(notHidden).map(toPaths);
    log('processing %d file(s)', entries.length);

    async.forEachLimit(
      entries,
      10,
      processEntry,
      complete
    );

    function notHidden(f) {
      return path.basename(f.path)[0] !== '.';
    }

    function toPaths (f) {
      return {
        fullPath: path.relative(base, f.fullPath),
        key: url.resolve(vdir, f.path),
        url: (new URIjs(url.resolve(vdir, f.path))).host(host).href()
      };
    }

    function processEntry(entry, done) {
      log('   \x1b[36mprocess\x1b[0m : ' + entry.key);

      strategy(entry, function (err, entry) {
        if (!err) {
          processed.push(entry);
        }
        done(err);
      });
    }

    function complete (err) {
      if (!err) {
        var config = _(processed)
          .sortBy(function (entry) {
            return entry.fullPath;
          })
          .map(function (entry) {
            // generate the urls and route by injecting the digest into the path
            var original = new URIjs(entry.url);
            var modified = original
              .clone()
              .directory(original.directory() + '/' + entry.digest);

            entry.url   = modified.href();
            entry.route = modified.host('').href();

            return entry;
          })
          .value();

        var delay = Date.now() - start;
        log('processed %d file(s) in %d ms', entries.length, delay);

        return callback(null, config);
      }

      callback(err);
    }
  });
};
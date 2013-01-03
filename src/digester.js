var _        = require('lodash');
var url      = require('url');
var path     = require('path');
var async    = require('async');
var readdirp = require('readdirp');

var digester = module.exports = {};

function selectStrategy(opts) {
  var strategy = opts.strategy;
  var digestfn = strategy;

  if (!_.isFunction(strategy)) {
    strategy = require('./strategy/hash').create();
    digestfn = strategy.digest.bind(strategy);
  }

  return digestfn;
}

function routeName(entry) {
  return entry.url + '.' + entry.digest;
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
  var vdir = opts.vdir || '/images/';
  var strategy = selectStrategy(opts);
  var start = Date.now();
  var base = process.cwd();

  vdir = url.parse(vdir);

  readdirp({root: root}, function (err, tree) {
    if (err) {
      return callback(err);
    }

    var processed = [];
    var entries = tree.files.filter(notHidden).map(toPaths);
    console.log('processing %d file(s)', entries.length);

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
        key: f.path,
        url: url.resolve(vdir, f.path),
        mtime: f.stat.mtime
      };
    }

    function processEntry(entry, done) {
      console.log('   \x1b[36mprocess\x1b[0m : ' + entry.key);

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
            entry.route = routeName(entry);
            return entry;
          })
          .values();

        var delay = Date.now() - start;
        console.log('processed %d file(s) in %d ms', entries.length, delay);

        return callback(null, config);
      }

      callback(err);
    }
  });
};
var _        = require('lodash');
var url      = require('url');
var async    = require('async');
var readdirp = require('readdirp');

var digester = module.exports = {};

digester.selectStrategy = function (opts) {
  var strategy = opts.strategy;
  var digestfn = strategy;

  if (!_.isFunction(strategy)) {
    strategy = require('./strategy/hash').create();
    digestfn = strategy.digest.bind(strategy);
  }

  return digestfn;
};

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
  var strategy = digester.selectStrategy(opts);

  vdir = url.parse(vdir);

  readdirp(opts, function (err, tree) {
    if (err) {
      return callback(err);
    }

    var processed = [];

    async.forEachLimit(
      tree.files.map(toPaths),
      10,
      processEntry,
      complete
    );

    function toPaths (f) {
      return {
        fullPath: f.fullPath,
        key: f.path,
        url: url.resolve(vdir, f.path),
        mtime: f.stat.mtime
      };
    }

    function processEntry(entry, done) {
      strategy(entry, function (err, entry) {
        if (!err) {
          processed.push(entry);
        }
        done(err);
      });
    }

    function complete (err) {
      if (!err) {
        var config = processed.map(function (entry) {
          entry.route = entry.url + '.' + entry.digest;
          return entry;
        });

        return callback(null, config);
      }

      callback(err);
    }
  });
};

digester.process(
  {
    root:'../../BBud/public-website/public/images',
    fileFilter: ['*.png', '*.jpg', '*.gif', '*.jpeg'],
    strategy: 'hash'
  },
  function (err, entries) {
    if (err) {
      console.err(err);
    }

    console.log('done', entries[0]);
  }
);
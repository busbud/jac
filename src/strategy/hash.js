var fs     = require('fs');
var crypto = require('crypto');

module.exports.create = function (opts) {
  return new hashStrategy(opts);
};

function hashStrategy(opts) {
  this.algorithm = opts && opts.algorithm || 'md5';
  this.length = opts && opts.length || 7;
}

/**
 * Generates and sets an entry's digest
 *
 * @param entry {fullpath, key, url, mtime}
 * @param done  fn(err, entry)
 */
hashStrategy.prototype.digest = function (entry, done) {
  var self = this;
  var hash = crypto.createHash(self.algorithm);

  var s = fs.ReadStream(entry.fullPath);

  s.on('data', function(d) {
    hash.update(d);
  });

  s.on('error', function (err) {
    done(err);
  });

  s.on('end', function() {
    var d = hash.digest('base64');

    // Ensure url-safe base64
    entry.digest = d.substr(0, self.length)
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    done(null, entry);
  });
};

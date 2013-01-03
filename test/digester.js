var vows   = require('should');
var path   = require('path');

describe('Digester', function () {
  var digester = require('../src/digester');

  describe('digest directory', function () {
    var entries, error;

    before(function (done) {
      var opts = {
        root:       __dirname,
        fileFilter: ["*.gif"],
        silent:     true
      };

      digester.process(opts, cb);

      function cb (err, res) {
        error = err;
        entries = res;
        done();
      }
    });

    it('entries should be an array', function () {
      entries.should.be.an.instanceOf(Array);
    });

    it('entries should be .gif', function () {
      entries.forEach(isGif);

      function isGif(e) {
        path.extname(e.fullPath).should.equal(".gif");
      }
    });

    it('entries should sorted by fullPath', function () {
      var paths = entries.map(toPath).sort();

      entries.forEach(checkSort);

      function toPath(e) {
        return e.fullPath;
      }

      function checkSort(e, i, arr) {
        e.fullPath.should.equal(paths[i]);
      }
    });

    it('entries should have properties', function () {
      entries.forEach(verify);

      function verify (e) {
        e.should.have.property('fullPath');
        e.should.have.property('key');
        e.should.have.property('url');
        e.should.have.property('mtime');
        e.should.have.property('digest');
        e.should.have.property('route');
      }
    });
  });
});
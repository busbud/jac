"use strict";

var should = require('should');
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
        e.should.have.property('digest');
        e.should.have.property('route');
      }
    });

    /**
      Don't include a query string in the URL for static resources.

      Most proxies, most notably Squid up through version 3.0, do not cache resources with a "?" in
      their URL even if a Cache-control: public header is present in the response. To enable proxy
      caching for these resources, remove query strings from references to static resources, and
      instead encode the parameters into the file names themselves.

      - https://developers.google.com/speed/docs/best-practices/caching

     */
    it('entries\' route should not have a querystring, but should contain digest in path', function () {
      entries.forEach(verify);

      function verify (e) {
        e.route.indexOf('?').should.equal(-1);
        e.route.indexOf(e.digest).should.not.equal(-1);
      }
    });

    it('entries\' key should start with a \'/\'', function () {
      entries.forEach(verify);

      function verify (e) {
        e.key[0].should.equal('/');
      }
    });
  });

  describe('digest directory with explicit host', function () {
    var entries, error;

    before(function (done) {
      var opts = {
        root:       __dirname,
        fileFilter: ["*.gif"],
        silent:     false,
        host:       'cdn.net'
      };

      digester.process(opts, cb);

      function cb (err, res) {
        error = err;
        entries = res;
        done();
      }
    });

    it('entries should have the host set only on the url', function () {
      entries.forEach(verify);

      function verify (e) {
        e.should.have.property('fullPath');
        e.should.have.property('key');
        e.should.have.property('url');
        e.should.have.property('digest');
        e.should.have.property('route');

        var prefix = '//cdn.net/';
        e.url.indexOf(prefix).should.equal(0);
        e.route.indexOf(prefix).should.equal(-1);
        e.key.indexOf(prefix).should.equal(-1);
      }
    });
  });
});
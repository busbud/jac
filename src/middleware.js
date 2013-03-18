"use strict";

var _    = require('lodash');
var send = require('send');

/**
 * Creates jac-img middleware for specified config
 *
 * @param config
 * @return {Function}
 */
module.exports.create = function (config) {
  var assets = config.assets;

  var assetsByRoute = assets.reduce(function (memo, entry) {
    memo[entry.route] = entry;
    return memo;
  }, {});

  var assetsByKey = assets.reduce(function (memo, entry) {
    memo[entry.key] = entry;
    return memo;
  }, {});

  var twoweeks  = 14 * 24 * 3600;
  config.maxAge = (config.maxAge || twoweeks) * 1000; // in milliseconds, for `send`

  /**
   * Returns the route url with digest for the resource specified by the key
   *
   * @param key
   * @return {String}
   * @throws {Error} if key not found
   */
  function resolveAsset (key) {
    var asset = assetsByKey[key];

    if (!asset) {
      throw new Error('jac: key ' + key + ' not found, regenerate jac config or update key value to match key in jac config');
    }

    return asset.url;
  }

  /**
   * Inject jac img view locals
   *
   * @param res  express response object
   */
  function locals (res) {
    var jac = res.local('jac') || {};
    jac.resolve = resolveAsset;

    res.local('jac', jac);
  }

  function middleware (req, res, next) {
    var asset = assetsByRoute[req.url];

    if (!asset) {
      locals(res);
      return next();
    }

    // Add route information for logging purposes
    req.route = {
      path: '<jac.middleware>'
    };

    send(req, asset.fullPath)
      .maxage(config.maxAge)
      .on('error', next)
      .pipe(res);
  }

  return middleware;
};
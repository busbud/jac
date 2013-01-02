var _    = require('lodash');
var send = require('send');

/**
 * Creates jac-img middleware for specified config
 *
 * @param config
 * @return {Function}
 */
module.exports.middleware = function (config) {
  var routes = config.reduce(function (memo, entry) {
    memo[entry.route] = entry;
    return memo;
  }, {});

  var keys = config.reduce(function (memo, entry) {
    memo[entry.key] = entry.route;
    return memo;
  }, {});

  var twoweeks  = 14 * 24 * 3600 * 1000; // in milliseconds
  config.maxAge = config.maxAge || twoweeks;

  /**
   * Inject jac img view locals
   *
   * @param res  express response object
   */
  function locals(res) {
    var jac = res.local('jac') || {};
    jac.img = {
      resolve: function (key) {
        var route = keys[key];

        if (!route) {
          throw new Error('jac-img: key ' + key + ' not found, regenerate jac-img config');
        }

        return route;
      }
    };

    res.local('jac', jac);
  }

  return function (req, res, next) {
    var hit = routes[req.url];

    if (!hit) {
      locals(res);
      return next();
    }

    send(req, hit.fullPath)
      .maxage(config.maxAge)
      .on('error', next)
      .pipe(res);
  };
};
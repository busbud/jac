"use strict";

module.exports = {
  create: require('./src/middleware').create,
  digest: require('./src/digester').process,
  css: require('./src/css').process
};
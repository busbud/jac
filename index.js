"use strict";

module.exports = {
  middleware: require('./src/middleware').create,
  digest: require('./src/digester').process,
  css: require('./src/css').process
};
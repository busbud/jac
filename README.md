#jac-img
jac-img provides methods to reference image urls using permanently cachable urls.

It achieves this by using urls unique to each version of a given image, and provides middleware to serve the image with
long cache durations.

#Usage
jac-img middleware will handle file serving and image url resolution

```js
var express = require('express')
  , jac     = require('jac-img')
  , app     = express.createServer();

// Manual config
var config  = [{
  fullPath: require('path').resolve(__dirname, './public/images/spacer.gif'),
  key:      'spacer.gif',
  route:    '/images/spacer.gif.b64Digest'
}];

// Add middleware for all requests
app.use(jac.middleware(config));

// Add view that resolves an image url
app.get('/someview', function (req, res) {
  var jac = res.local('jac')        // returns jac view helper
    , key = 'spacer.gif'            // matches config key
    , url = jac.img.resolve(key);   // returns url with digest, handled by middleware

  res.send(url);
});
```

## Production
To support production usage with the best performance, it is required that a pre-processing step be executed to
generate the image file digests stored in configuration.

#Tests
Run tests

    $ npm test
#jac-img
jac-img provides methods to reference image urls using permanently cachable urls.

It achieves this by using urls unique to each version of a given image, and provides middleware to serve the image with
long cache durations.

#Usage
jac-img middleware will handle file serving and image url resolution

Install it using

    npm install jac-img

## Example
The following example shows how to wire up jac-img
 * App code sets up the jac-img middleware
 * A JSON file stores the configuration for the jac-img middleware
 * A script updates the configuration file

### App
```js
var express = require('express')
  , config  = require('./config')
  , jac     = require('jac-img').create(config)
  , app     = express.createServer();

// Add middleware for all requests
app.use(jac.middleware);

// Add view that resolves an image url
app.get('/someview', function (req, res) {
  var jac = res.local('jac')        // returns jac view helper
    , key = 'spacer.gif'            // matches config key
    , url = jac.img.resolve(key);   // returns url with digest, handled by middleware

  res.send(url);
});
```

### Config
The configuration file is updated using jac-img's digester and read by the app. Here's a sample config json file loaded
by the app.

```js
{
  // required - files served by jac-img
  assets: [{
    fullPath: require('path').resolve(__dirname, './public/images/spacer.gif'),
    key:      'spacer.gif',
    route:    '/images/spacer.gif.b64Digest'
  }],

  // optional - cache control max age in seconds (default 2 weeks)
  maxAge: 5443200
}
```

### Update script
The update script runs the digester against the files specified in configuration and updates the `files` key in the
configuration file. This script can be run from `package.json`'s scripts section after install.

```bash
jac --config ./config.json
```

Alternatively, the digester can be wired up manually

```js
var path   = './config'
  , config = require(path)
  , digest = require('jac-img').digest;

function save (err, assets) {
  if (err) throw err;

  config.assets = assets;
  fs.writeFile(path, JSON.stringify(config, null, 2));
}

digest(config, save);
```


## Compatibility
This version of jac-img is compatible with express 2.5.
It depends on `res.local()` to get and set the view local `jac.img` via middleware.

## Production
To support production usage with the best performance, it is required that a pre-processing step be executed to
generate the image file digests stored in configuration.

```bash
jac --config ./config.json
```

It is recommended that the config file already exist, and the config file used by the app
always be updated before deploying to production. This can be automated using `package.json`'s
scripts section after install.

```js
{
  "name": "myproject",
  "dependencies": {
    "jac-img": "latest"
  },
  "scripts": {
    "postinstall": "./node_modules/jac-img/bin/jac --config ./jac.json"
  }
}
```

#Tests
Run tests

    npm test
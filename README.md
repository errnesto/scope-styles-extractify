# scope-styles-extractify

[![build status][build-badge]][build-href]
[![coverage status][coverage-badge]][coverage-href]
[![dependencies status][deps-badge]][deps-href]

Browserify plugin to extract [scope-styles](https://github.com/rtsao/scope-styles) css into an external bundle

### CLI usage

```
browserify -p [ scope-styles-extractify -o dist/main.css -e js ] index.js
```

### API usage

Write to file:
```javascript
var browserify = require('browserify');
var extractify = require('scoped-styles-extractify');

var b = browserify('./main.js');
b.plugin(extractify, {output: './dist/scoped.css'});
b.bundle();
```

Or grab output stream:
```javascript
var fs = require('fs');
var browserify = require('browserify');
var extractify = require('scoped-styles-extractify');

var b = browserify('./main.js');
b.plugin(extractify);

var bundle = b.bundle();
bundle.on('scoped_css_stream', function (css) {
  css.pipe(fs.createWriteStream('scoped.css'));
});
```

[build-badge]: https://travis-ci.org/rtsao/scope-styles-extractify.svg?branch=master
[build-href]: https://travis-ci.org/rtsao/scope-styles-extractify
[coverage-badge]: https://coveralls.io/repos/rtsao/scope-styles-extractify/badge.svg?branch=master&service=github
[coverage-href]: https://coveralls.io/github/rtsao/scope-styles-extractify?branch=master
[deps-badge]: https://david-dm.org/rtsao/scope-styles-extractify.svg
[deps-href]: https://david-dm.org/rtsao/scope-styles-extractify

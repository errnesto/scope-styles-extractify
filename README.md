# scope-styles-extractify

Browserify plugin to extract [scope-styles](https://github.com/rtsao/scope-styles) css into an external bundle

### CLI usage

```
browserify -p [ scope-styles-extractify -o dist/main.css ] index.js
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

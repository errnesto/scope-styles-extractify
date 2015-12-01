# scope-styles-extractify

Browserify plugin to extract [scope-styles](https://github.com/rtsao/scope-styles) css into an external bundle

### CLI usage

```
browserify -p [ scope-styles-extractify -o dist/main.css ] example/index.js
```

### API usage

Write to file:
```javascript
var browserify = require('browserify');

var b = browserify('./main.js');
b.plugin(require('scoped-styles-extractify'), {
  rootDir: __dirname,
  output: './path/to/scoped.css'
});
b.bundle();
```

Or grab output stream:
```javascript
var browserify = require('browserify');
var fs = require('fs');

var b = browserify('./main.js');
b.plugin(require('scoped-styles-extractify'), {
  rootDir: __dirname
});

var bundle = b.bundle();
bundle.on('scoped_css_stream', function (css) {
  css.pipe(fs.createWriteStream('scoped.css'));
});
```

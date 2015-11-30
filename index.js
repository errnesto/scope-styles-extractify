'use strict';

var fs = require('fs');
var path = require('path');
var ReadableStream = require('stream').Readable;
var through2 = require('through2');
var acorn = require('acorn');
var falafel = require('falafel');
var requireFromString = require('require-from-string');
var cssKey = require('scope-styles/lib/css-symbol');
var extractedKey = require('./extracted-key');

module.exports = function(browserify, options) {
  var files = [];
  var contents = {};
  var cssStream;
  var output = options.output;

  function extractionTransform(filename) {
    var transform = through2(function(buf, enc, next) {
      var source = buf.toString('utf8');

      try {
        var inlined = extractCss(source, filename);
        if (inlined) {
          source = inlined;
        }
      } catch (err) {
        return error(err);
      }

      this.push(source);
      next();
    });

    function error(msg) {
      var err = typeof msg === 'string' ? new Error(msg) : msg;
      transform.emit('error', err);
    }

    return transform;
  }

  function extractCss(source, filename) {
    var didInstrument = false;
    var instrumentedModule = transformAst(source, function instrumentModule(node) {
      if (isRequireScopeStyles(node)) {
        var quote = node.arguments[0].raw[0][0];
        var str = quote + 'scope-styles-extractify/instrumented' + quote;
        node.arguments[0].update(str);
        node.update(node.source() + '.instrument(__filename)');
        didInstrument = true;
      }
    });

    if (didInstrument) {
      var results = getResults(instrumentedModule, filename)
      if (!results) {
        return;
      }
      contents[filename] = results.css;
      files.push(filename);

      var inlinedModule = transformAst(source, function (node) {
        if (isRequireScopeStyles(node)) {
          var quote = node.arguments[0].raw[0][0];
          var str = quote + 'scope-styles-extractify/inlined' + quote;
          node.arguments[0].update(str);
          var prepped = Object.keys(results.objects).reduce(function(acc, key) {
            var obj = results.objects[key];
            acc[key] = {
              object: obj,
              css: obj[cssKey]
            };
            return acc;
          }, {});
          node.update(node.source() + '(' + JSON.stringify(prepped) + ')');
        }
      });
      return inlinedModule;
    }
  }

  if (options.output) output = path.relative(options.rootDir, options.output);

  browserify.transform(extractionTransform, {
    global: true
  });

  browserify.on('bundle', function (bundle) {
    // on each bundle, create a new stream b/c the old one might have ended
    cssStream = new ReadableStream();
    cssStream._read = function() {};

    bundle.emit('scoped_css_stream', cssStream);
    bundle.on('end', function () {
      cssStream.push(null);
      if (output) {
        var contentString = '';

        files.forEach(function(file) {
          contentString += contents[file];
        });

        fs.writeFile(output, contentString, 'utf8', function (error) {
          // bundle was destroyed, emit new events on `browserify`
          if (error) browserify.emit('error', error);
          browserify.emit('scoped_css_end', output);
        });
      }
    });
  });
};

var exporter = ';module.exports[require("scope-styles-extractify/extracted-key")] = require("scope-styles-extractify/instrumented").getResults(__filename);';

function getResults(instrumentedModule, filename) {
  return requireFromString(instrumentedModule + exporter, filename)[extractedKey];
}

/*
 * General AST Helpers
 */

function transformAst(source, walkFn) {
  return falafel(source, {
    parser: acorn,
    ecmaVersion: 6,
    sourceType: 'module'
  }, walkFn).toString();
}

function isRequireScopeStyles(node) {
  return node.callee &&
    node.type === 'CallExpression' &&
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments[0] &&
    node.arguments[0].value === 'scope-styles';
}

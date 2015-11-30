'use strict';

var fs = require('fs');
var path = require('path');
var ReadableStream = require('stream').Readable;
var through2 = require('through2');
var acorn = require('acorn');
var falafel = require('falafel');
var requireFromString = require('require-from-string');
var cssKey = require('scope-styles/lib/css-symbol');
var extend = require('xtend');

module.exports = function(browserify, options) {
  var files = [];
  var contents = {};

  var output = 'yolo.css';
  var cssStream;

  function extractCssTransform(source, filename) {
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
      var css = getCss(instrumentedModule, filename);
      contents[filename] = css;
      files.push(filename);
    }

    return through2();
  }

  if (options.output) output = path.relative(options.rootDir, options.output);

  browserify.transform(extractCssTransform, {
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

        fs.writeFile(output, contentString, ENCODING, function (error) {
          // bundle was destroyed, emit new events on `browserify`
          if (error) browserify.emit('error', error);
          browserify.emit('scoped_css_end', output);
        });
      }
    });
  });
};

var exporter = ';module.exports[require("scope-styles/lib/css-symbol")] = require("scope-styles-extractify/instrumented").getCss(__filename);';

function getCss(instrumentedModule, filename) {
  var css = requireFromString(instrumentedModule + exporter, filename)[cssKey];
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


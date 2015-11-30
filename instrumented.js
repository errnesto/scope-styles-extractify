'use strict';

var scopeStyles = require('scope-styles');

var results = {};

function instrumentScopeStyles(filename) {
  function instrumentedScopeStyles() {
    var result = scopeStyles.apply(null, arguments);
    if (!results[filename]) {
      results[filename] = {css: '', objects: {}};
    }
    results[filename].css += scopeStyles.getCss(result);
    results[filename].objects[JSON.stringify(arguments)] = result;
    return result;
  }
  instrumentedScopeStyles.getCSs = scopeStyles.getCss;
  return instrumentedScopeStyles;
}

module.exports = {
  instrument: instrumentScopeStyles,
  getResults: function getResults(filename) {
    return results[filename];
  }
};

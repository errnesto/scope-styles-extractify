'use strict';

var cssKey = require('scope-styles/lib/css-symbol');

module.exports = function inlineScopeStyles(objects) {
  return function inlinedScopeStyles() {
    var key = JSON.stringify(arguments);
    if (!objects[key]) {
      throw new Error('Could not find pre-compiled scoped styles for supplied scope-styles arguments at runtime. Something weird is going on with the plugin.');
      // maybe fallback to runtime in this case?
    } else {
      var result = objects[key].object;
      result[cssKey] = objects[key].css;
      return result;
    }
  }
};

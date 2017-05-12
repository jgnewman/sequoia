'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createError = createError;
exports.assertNesting = assertNesting;
exports.toggleSymbols = toggleSymbols;
var symbol1 = Symbol();
var symbol2 = Symbol();

/**
 * Creates a nice error object. Not automatically thrown.
 *
 * @param  {String} message The error message.
 *
 * @return {Error}  The new error object.
 */
function createError(message) {
  return new Error('[sequoia] ' + message.trim().replace(/\n\s+/g, ' '));
}

/**
 * Makes sure a given level of nesting exists in an object. For example:
 *
 *   assertNesting(foo, 'a', 'b', 'c') === foo { a: { b: { c: { } } } }
 *
 * @param  {Object} obj  The initial object that may or may not be nested.
 * @param  {String} nest Names of nested object properties we need.
 *
 * @return {Object} The deepest nested object.
 */
function assertNesting(obj) {
  var prevLevel = obj;

  for (var _len = arguments.length, nest = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    nest[_key - 1] = arguments[_key];
  }

  nest.forEach(function (level) {
    prevLevel[level] = prevLevel[level] || {};
    prevLevel = prevLevel[level];
  });
  return prevLevel;
}

/**
 * A strange little function factory where the created function toggles
 * between 2 symbols whenever it's called.
 *
 * @return {Function} The toggler.
 */
function toggleSymbols() {
  var activeSym = symbol1;
  var out = function out() {
    activeSym = activeSym === symbol1 ? symbol2 : symbol1;
    return activeSym;
  };
  out.current = function () {
    return activeSym;
  };
  return out;
}
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forProps = forProps;
exports.extend = extend;
exports.removeProps = removeProps;
/**
 * Loops over properties in an object calling an iterator for
 * each one.
 * 
 * @param {Object}   object   The object to loop over.
 * @param {Function} iterator Takes val, key. 
 * 
 * @return {undefined}
 */
function forProps(object, iterator) {
  Object.keys(object).forEach(function (key) {
    iterator(object[key], key);
  });
}

/**
 * Shortcuts Object.assign to create a new object.
 * 
 * @param {Objects} objects Objects with properties to copy.
 * 
 * @return {Object} A new object containing all properties.
 */
function extend() {
  for (var _len = arguments.length, objects = Array(_len), _key = 0; _key < _len; _key++) {
    objects[_key] = arguments[_key];
  }

  return Object.assign.apply(Object, [{}].concat(objects));
}

/**
 * Allows us to create a new object with some properties
 * removed.
 * 
 * @param {Object} object From which to remove properties.
 * @param {Array}  list   Names of properties to remove.
 * 
 * @return {Object} A new object minus named properties.
 */
function removeProps(object, list) {
  var out = {};
  forProps(object, function (val, key) {
    if (list.indexOf(key) === -1) {
      out[key] = val;
    }
  });
  return out;
}
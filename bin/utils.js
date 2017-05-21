"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mapObject = mapObject;
exports.createError = createError;
exports.toggleSymbols = toggleSymbols;
exports.removeProps = removeProps;
var symbol1 = Symbol();
var symbol2 = Symbol();

/**
 * Some internal system constants.
 *
 * @type {Object}
 */
var INTERNALS = exports.INTERNALS = {
  STORE_REF: "@@SQ_Store",
  DATA_REF: "@@SQ_Data",
  DATA_RULE: "@@SQ_DataRule",
  DATA_DEFAULT: "@@SQ_DataDefault",
  DATA_PENDING: "@@SQ_DataPending",
  DATA_ERROR: "@@SQ_DataError",
  DATA_SUCCESS: "@@SQ_DataSuccess",
  HASH_PATH: "@@SQ_HashPath"
};

/*
 * Fake `window` if we don't have it.
 */
var win = exports.win = typeof window !== 'undefined' ? window : {
  location: { search: '', hash: '' },
  addEventListener: function addEventListener() {}
};

/**
 * Calls `forEach` on an object and returns a new
 * object with mapped values.
 *
 * @param  {Object}   obj       Plain object.
 * @param  {Function} iterator  Takes val, key.
 *
 * @return {Object} New object with same keys, new vals.
 */
function mapObject(obj, iterator) {
  var out = {};
  Object.keys(obj).forEach(function (key) {
    out[key] = iterator(obj[key], key);
  });
  return out;
}

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

/**
 * Remove all the named properties from an object.
 *
 * @param  {Object}  obj   The object to start from.
 * @param  {Array}   props The names of properties to remove.
 *
 * @return {Object}  A new object where `props` have been excluded.
 */
function removeProps(obj, props) {
  var newObj = {};
  Object.keys(obj).forEach(function (key) {
    if (props.indexOf(key) === -1) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
}
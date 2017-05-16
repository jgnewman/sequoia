'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerStore = registerStore;
exports.addStoreHook = addStoreHook;
exports.createError = createError;
exports.assertNesting = assertNesting;
exports.toggleSymbols = toggleSymbols;
exports.removeProps = removeProps;
exports.waitUntil = waitUntil;
var symbol1 = Symbol();
var symbol2 = Symbol();

var storeHooks = [];

var globalStores = exports.globalStores = {};

function registerStore(key, store) {
  globalStores[key] = store;
  storeHooks.forEach(function (hook) {
    return hook(store);
  });
}

function addStoreHook(hook) {
  storeHooks.push(hook);
}

/*
 * Internal constants.
 */
var internals = exports.internals = {
  APP_META: '@@SQ_APP_META',
  DATA: '@@SQ_DATA',
  DATA_TO_SUCCESS: '@@SQ_DATA_TO_SUCCESS',
  DATA_TO_ERROR: '@@SQ_DATA_TO_ERROR',
  DATA_TO_PENDING: '@@SQ_DATA_TO_PENDING',
  DATA_TO_DEFAULT: '@@SQ_DATA_TO_DEFAULT',
  ROUTING: '@@SQ_ROUTING',
  HASH_PATH: '@@SQ_HASH_PATH'
};

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

/**
 * Wait until an impure function returns truthily
 * before executing a callback.
 *
 * @param  {Function} resolve  The function we're waiting on.
 * @param  {Function} callback The callback to execute.
 *
 * @return {undefined}
 */
function waitUntil(resolve, callback) {
  var didResolve = resolve();
  if (didResolve) {
    return callback(didResolve);
  } else {
    setTimeout(function () {
      waitUntil(resolve, callback);
    }, 10);
  }
}
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.when = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.pick = pick;
exports.setLocationContext = setLocationContext;
exports.getLocationContext = getLocationContext;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var END_STAR = /\/\*$/;
var BEGIN_STAR_PATH = /^\/\*\//;
var BEGIN_STAR_HASH = /^\#\/?\*\//;
var hasWindow = typeof window !== 'undefined';

/*
 * Track our location context.
 */
var locationContext = void 0;
locationContext = createLocation();

/*
 * If we're in a window environment, update the location
 * context whenever the hash changes.
 */
if (hasWindow) {
  window.addEventListener('hashchange', function () {
    locationContext = createLocation();
  });
}

/**
 * Ensures path strings are in predictable format: "/foo"
 * 
 * @param {String} path The original path.
 * 
 * @return {String} The formatted string. 
 */
function standardizePath(path) {
  return path.replace(/^\/*/, '/').replace(/\/+$/, '');
}

/**
 * Ensures hashpath strings are in predictable format: "#foo"
 * 
 * @param {String} hash The original hashpath.
 * 
 * @return {String} The formatted string. 
 */
function standardizeHash(hash) {
  hash = hash || '#';
  hash = hash.replace(/^[^\#]*\#/, '#');
  if (hash[0] === '*') {
    hash = '/' + hash;
  }
  if (hash[0] !== '#') {
    hash = '#' + hash;
  }
  return hash;
}

/**
 * Converts the `location.search` property into an object.
 *
 * @param {String} supplied A supplied search string.
 *
 * @return {Object} Contains query string values.
 */
function parseSearch(supplied) {
  var search = supplied.replace(/^\?/, '');
  try {
    return !search ? {} : JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) {
      return key === "" ? value : decodeURIComponent(value);
    });
  } catch (err) {
    return { malformed: true };
  }
}

/**
 * Converts the `location` object or some other context into a
 * standardized object with some props removed and others
 * guaranteed.
 * 
 * @param {Object} provided Optional. A provided location object. If
 *                          not provided, defaults to the current
 *                          location context.
 *
 * @return {Object} Contains important info about location.
 */
function createLocation(provided) {
  var context = provided || (hasWindow ? window.location : {});
  return (0, _utils.extend)((0, _utils.removeProps)(context, ['ancestorOrigins', 'assign', 'reload', 'replace']), {
    params: parseSearch(context.search || ''),
    pathname: standardizePath(context.pathname || ''),
    hash: standardizeHash(context.hash || '')
  });
}

/**
 * Reverses a string.
 * 
 * @param {String} str The string to reverse.
 * 
 * @return {String} The reversed string.
 */
function reverse(str) {
  return str.split('').reverse().join('');
}

/**
 * Determines whether a path-like string matches a user-defined
 * pattern.
 * 
 * @param {String}  pattern The user's pattern.
 * @param {String}  actual  A path or hash path.
 * @param {Boolean} isHash  Whether this is a hash path.
 * 
 * @return {Boolean} Whether we have a match.
 */
function matchPath(pattern, actual, isHash) {
  var standardizer = isHash ? standardizeHash : standardizePath;
  var beginStar = isHash ? BEGIN_STAR_HASH : BEGIN_STAR_PATH;

  /*
   * Standardize our pattern and our actual path.
   */
  var stPattern = standardizer(pattern);
  var stActual = standardizer(actual);

  /*
   * We have a match if they're identical.
   */
  if (stPattern === stActual) return true;

  /*
   * We have a match if the pattern ends with a star and
   * the pattern-minus-star is found at the beginning
   * of the actual path.
   */
  if (END_STAR.test(stPattern)) {
    return stActual.indexOf(stPattern.replace(END_STAR, '')) === 0;
  }

  /*
   * We have a match if the pattern begins with a star and
   * the reversed pattern-minus-star is found at the beginning
   * of the reversed actual path.
   */
  if (beginStar.test(stPattern)) {
    var revPattern = reverse(stPattern.replace(beginStar, ''));
    var revActual = reverse(stActual);
    return revActual.indexOf(revPattern) === 0;
  }

  /*
   * Otherwise there is no match.
   */
  return false;
}

/**
 * Determines whether query string params match.
 *
 * @param  {Object}        paramsToTest    The values we're looking for.
 * @param  {String|Object} suppliedParams  Represents the actual values.
 *
 * @return {Boolean} Whether or not we found a match.
 */
function matchParams(paramsToTest, suppliedParams) {
  var currentParams = suppliedParams || currentLocation.params;
  var matched = true;

  /*
   * Make sure we have our params in the form of an object.
   */
  if (typeof currentParams === 'string') {
    currentParams = parseSearch(currentParams);
  }

  /*
   * And make sure we actually have a value to test against.
   */
  if (!currentParams) {
    currentParams = {};
  }

  /*
   * Loop over our desired values and make sure each one matches an
   * actual value.
   */
  Object.keys(paramsToTest).every(function (key) {
    var testVal = paramsToTest[key];
    var realVal = currentParams[key];

    if (testVal === realVal) {
      return true;
    } else {
      return matched = false;
    }
  });

  return matched;
}

/**
 * @class Resolver
 * 
 * Helps abstract decision making so that
 * JSX can be a little nicer and so that
 * we can easily make some nice premade
 * components.
 */

var Resolver = function () {

  /**
   * @constructor
   * 
   * @param {Any} test Will be assessed for its truthiness. 
   */
  function Resolver(test) {
    _classCallCheck(this, Resolver);

    this.resolved = !!test;
    this.callback = null;
  }

  /**
   * If the test resolved, immediately executes
   * its callback. Otherwise, does nothing.
   * 
   * @param {Function} callback Runs if the test resolved.
   * 
   * @return {Any} The result of the callback or null.
   */


  _createClass(Resolver, [{
    key: 'then',
    value: function then(callback) {
      if (!this.resolved) return null;
      return callback.prototype instanceof _react2.default.Component ? _react2.default.createElement(callback) : callback();
    }

    /**
     * If the test resolved, queues a callback
     * up to be executed by another function.
     * 
     * @param {Function} callback Saved if the test resolved.
     * 
     * @return {Resolver} This Resolver
     */

  }, {
    key: 'choose',
    value: function choose(callback) {
      this.resolved && (this.callback = callback);
      return this;
    }
  }]);

  return Resolver;
}();

/**
 * These methods each perform a test and then return
 * an instance of a Resolver. The Resolver allows you
 * to determine whether the test resolved, immediately
 * execute a callback, or queue up a callback to be
 * executed by a pick function.
 * 
 * @return {Resolver}
 */


var when = exports.when = {
  ok: function ok(test) {
    return new Resolver(test);
  },
  notOk: function notOk(test) {
    return this.ok(!test);
  },
  populated: function populated(test) {
    return this.ok(test.length);
  },
  empty: function empty(test) {
    return this.ok(!test.length);
  },
  path: function path(pattern, actual) {
    actual = actual || locationContext.pathname;
    return this.ok(matchPath(pattern, actual, false));
  },
  hash: function hash(pattern, actual) {
    actual = actual || locationContext.hash;
    return this.ok(matchPath(pattern, actual, true));
  },
  params: function params(toMatch, actual) {
    actual = actual || locationContext.params;
    return this.ok(matchParams(toMatch, actual));
  },
  otherwise: function otherwise() {
    return this.ok(true);
  }
};

/**
 * Chooses between instances of `when` that
 * have queued options and executes the first one that
 * resolved and queued an option.
 * 
 * @param {Resolvers} args Should have been created by `when` fns.
 * 
 * @return {Any} The result of a callback or null. 
 */
function pick() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  if (!args.length) {
    return null;
  } else {
    var arg = args.shift();
    if (arg.resolved) {
      if (!arg.callback) return null;
      return arg.callback.prototype instanceof _react2.default.Component ? _react2.default.createElement(arg.callback) : arg.callback();
    } else {
      return pick.apply(undefined, args);
    }
  }
}

/**
 * Allow users to set the INITIAL location context to be
 * used by the app. Note that in a window environment, this will
 * change as the hash is updated and possibly due to other events.
 * 
 * @param {Object} loc A manually supplied location context.
 * 
 * @return {undefined}
 */
function setLocationContext(loc) {
  locationContext = createLocation(loc);
}

/**
 * Returns the current location context.
 * 
 * @return {Object}
 */
function getLocationContext() {
  return locationContext;
}

/*

{when.ok(true).then(() => <div></div>)}

{pick(
  when.ok(true).choose(() => <div></div>),
  when.ok(true).choose(() => <div></div>),
  when.otherwise().choose(() => <div></div>)
)}

*/
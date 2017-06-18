import React from 'react';
import { extend, removeProps } from './utils';

const END_STAR = /\/\*$/;
const BEGIN_STAR_PATH = /^\/\*\//;
const BEGIN_STAR_HASH = /^\#\/?\*\//;
const hasWindow = typeof window !== 'undefined';

/*
 * Track our location context.
 */
let locationContext;
locationContext = createLocation();

/*
 * If we're in a window environment, update the location
 * context whenever the hash changes.
 */
if (hasWindow) {
  window.addEventListener('hashchange', () => {
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
  return path.replace(/^\/*/, '/').replace(/\/+$/, '')
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
  const search = supplied.replace(/^\?/, '');
  try {
    return !search ? {} : JSON.parse(
        '{"'
      + search.replace(/&/g, '","').replace(/=/g,'":"')
      + '"}',
      (key, value) => key === "" ? value : decodeURIComponent(value)
    );
  } catch (err) {
    return { malformed: true }
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
  const context = provided || (hasWindow ? window.location : {});
  return extend(removeProps(context, [
    'ancestorOrigins',
    'assign',
    'reload',
    'replace'
  ]), {
    params: parseSearch(context.search || ''),
    pathname: standardizePath(context.pathname || ''),
    hash: standardizeHash(context.hash || '')
  })
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
  const standardizer = isHash ? standardizeHash : standardizePath;
  const beginStar    = isHash ? BEGIN_STAR_HASH : BEGIN_STAR_PATH;

  /*
   * Standardize our pattern and our actual path.
   */
  const stPattern = standardizer(pattern);
  const stActual  = standardizer(actual);

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
    const revPattern = reverse(stPattern.replace(beginStar, ''));
    const revActual  = reverse(stActual);
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
  let currentParams = suppliedParams || currentLocation.params;
  let matched = true;

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
  Object.keys(paramsToTest).every(key => {
    const testVal = paramsToTest[key];
    const realVal = currentParams[key];

    if (testVal === realVal) {
      return true;
    } else {
      return (matched = false);
    }
  })

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
class Resolver {

  /**
   * @constructor
   * 
   * @param {Any} test Will be assessed for its truthiness. 
   */
  constructor(test) {
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
  then(callback) {
    if (!this.resolved) return null;
    return callback.prototype instanceof React.Component
      ? React.createElement(callback)
      : callback();
  }

  /**
   * If the test resolved, queues a callback
   * up to be executed by another function.
   * 
   * @param {Function} callback Saved if the test resolved.
   * 
   * @return {Resolver} This Resolver
   */
  choose(callback) {
    this.resolved && (this.callback = callback);
    return this;
  }
}

/**
 * These methods each perform a test and then return
 * an instance of a Resolver. The Resolver allows you
 * to determine whether the test resolved, immediately
 * execute a callback, or queue up a callback to be
 * executed by a pick function.
 * 
 * @return {Resolver}
 */
export const when = {

  ok(test) {
    return new Resolver(test);
  },

  notOk(test) {
    return this.ok(!test);
  },

  populated(test) {
    return this.ok(test.length);
  },

  empty(test) {
    return this.ok(!test.length);
  },

  path(pattern, actual) {
    actual = actual || locationContext.pathname;
    return this.ok(matchPath(pattern, actual, false));
  },

  hash(pattern, actual) {
    actual = actual || locationContext.hash;
    return this.ok(matchPath(pattern, actual, true));
  },

  params(toMatch, actual) {
    actual = actual || locationContext.params;
    return this.ok(matchParams(toMatch, actual));
  },

  otherwise() {
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
export function pick(...args) {
  if (!args.length) {
    return null;
  } else {
    const arg = args.shift();
    if (arg.resolved) {
      if (!arg.callback) return null;
      return arg.callback.prototype instanceof React.Component
        ? React.createElement(arg.callback)
        : arg.callback();
    } else {
      return pick(...args);
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
export function setLocationContext(loc) {
  locationContext = createLocation(loc);
}

/**
 * Returns the current location context.
 * 
 * @return {Object}
 */
export function getLocationContext() {
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
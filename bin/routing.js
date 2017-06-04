'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createLocation = createLocation;
exports.createHashRule = createHashRule;
exports.vetProps = vetProps;
exports.arrayifyChildren = arrayifyChildren;
exports.pathMatch = pathMatch;
exports.subPathMatch = subPathMatch;
exports.hashMatch = hashMatch;
exports.subHashMatch = subHashMatch;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _utils = require('./utils');

var _store = require('./store');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var EXCLUSIVE_PROPS = ['ok', 'notOk', 'path', 'hash', 'subPath', 'subHash', 'populated', 'empty', 'params', 'dataOk', 'dataNotOk'];

var AFTSLASH = /\/$/;
var ACTION_STRING = _utils.INTERNALS.HASH_PATH + ':DEFAULT';

/*
 * Create one place to track the current location and update it on
 * hash change.
 */
var currentLocation = createLocation();
_utils.win.addEventListener('hashchange', function () {
  return currentLocation = createLocation();
});

/*
 * Whenever a new store is registered, we'll pass the current location
 * into it. And whenver the hash changes, we'll update the location in the state.
 */
(0, _store.onCreateStore)(function (store) {
  store.dispatch({ type: ACTION_STRING });
  _utils.win.addEventListener('hashchange', function () {
    return store.dispatch({ type: ACTION_STRING });
  });
});

/****************************
 * Private functions
 ****************************/

/**
 * Take a potentially unexpectedly formatted hash string
 * and put it into a format we expect.
 *
 * @param  {String} hash The original hash path.
 *
 * @return {String} The normalized hash.
 */
function normalizeHash(hash) {
  if (!hash === '') {
    return '#';
  } else if (hash === '/') {
    return '#';
  } else {
    return '#' + hash.replace(/^\#|^\/\#?/, '');
  }
}

/**
 * Makes a hash path look like a normal path.
 * We expect the incoming hash to be pre-normalized.
 *
 * @param  {String} hash A hash path. (I.E. #foo)
 *
 * @return {String} Now looks like a normal path. (I.E. /foo)
 */
function pathifyHash(hash) {
  return hash.replace(/^\#\/?/, '/').replace(AFTSLASH, '');
}

/**
 * Ensure that a collection of props does not contain more than one of our
 * mutually exclusive prop names. If it does, throws an error.
 *
 * @param  {Object}  props Component props.
 *
 * @return {Boolean|String} False if none were found. Otherwise, the name of the
 *                          prop that matches our exclusive prop names.
 */
function assertCleanProps(props) {
  var foundProp = false;
  Object.keys(props).forEach(function (prop) {
    if (EXCLUSIVE_PROPS.indexOf(prop) > -1) {
      if (foundProp) {
        throw (0, _utils.createError)('\n            ' + foundProp + ' and ' + prop + ' are mutually exclusive props\n            for the `When` component. You must choose one or\n            the other.\n          ');
      } else {
        foundProp = prop;
      }
    }
  });
  return foundProp;
}

/**
 * Ensure that a collection of props does not contain both a `component` prop
 * and action child elements. It must be one or the other.
 *
 * @param  {Object}  props Component props.
 *
 * @return {Object} Containing boolean properties `component` and `children`;
 */
function assertComponentOrChildren(props) {
  var hasComponent = !!props.component;
  if (hasComponent && !!props.children) {
    throw (0, _utils.createError)('\n        The `When` component can either have a child component or\n        a `component` prop, but not both.\n      ');
  }
  return {
    component: hasComponent,
    children: !hasComponent
  };
}

/**
 * Determines whether our current pathname matches the user's
 * desired path.
 *
 * @param  {String}  desired  The desired path. I.E. "/foo", "/foo/bar", "/foo/*"
 * @param  {Boolean} isHash   Whether we're testing hash paths.
 * @param  {String}  supplied Optional. A supplied pathname.
 *
 * @return {Boolean} Whether the pathname matches.
 */
function testPath(desired, isHash, supplied) {
  var toMatch = isHash ? pathifyHash(desired) : desired.replace(AFTSLASH, '');
  var path = isHash ? pathifyHash(supplied || currentLocation.hash) : (supplied || currentLocation.pathname).replace(AFTSLASH, '');

  /*
   * If the paths are identical, match.
   */
  if (isHash && desired === (supplied || currentLocation.hash) || !isHash && path === toMatch) {
    return true;

    /*
     * When the desired value ends with "/*", match if the base desired value
     * is found at the beginning of the path and the next immediate character
     * either doesn't exist or is a slash (meaning end of string or further sub pathing.)
     */
  } else if (toMatch.slice(toMatch.length - 2) === '/*') {
    var matchBase = toMatch.slice(0, toMatch.length - 2);
    var aftChar = path[matchBase.length];
    return path.indexOf(matchBase) === 0 && (!aftChar || aftChar === '/');
  } else {
    return false;
  }
}

/**
 * Determines whether our current pathname matches the user's
 * desired sub path. As opposed to `testPath`, matches are found at
 * the end of the path rather than at the beginning.
 *
 * @param  {String}  desired  The desired subPath. I.E. "/foo", "/foo/bar", "/foo/*"
 * @param  {Boolean} isHash   Whether we're testing hash paths.
 * @param  {String}  supplied Optional. A supplied pathname.
 *
 * @return {Boolean} Whether the pathname matches.
 */
function testSubPath(desired, isHash, supplied) {
  var toMatch = isHash ? pathifyHash(desired) : desired.replace(AFTSLASH, '');
  var path = isHash ? pathifyHash(supplied || currentLocation.hash) : (supplied || currentLocation.pathname).replace(AFTSLASH, '');

  /*
   * If the paths are identical, match.
   */
  if (isHash && desired === (supplied || currentLocation.hash) || !isHash && path === toMatch) {
    return true;
  } else {

    /*
     * If we need to match further sub pathing, remove the star from
     * the desired value, make sure the desired value is found inside the
     * path somewhere and, if it is, ensure that the next immediate
     * character either doesn't exist (empty string) or is a slash.
     */
    if (toMatch.slice(toMatch.length - 2) === '/*') {
      var backMatch = toMatch.slice(0, toMatch.length - 2);
      var matchIndex = path.indexOf(backMatch);

      if (matchIndex === -1) return false;

      var nextChar = path[matchIndex + backMatch.length];
      return !nextChar || nextChar === '/';

      /*
       * If we don't need to match further sub pathing, make sure
       * the match is found at the end of the path.
       */
    } else {
      var backPath = path.slice(path.length - toMatch.length);
      return backPath === toMatch;
    }
  }

  return false;
}

/**
 * Determine whether an object/array is populated.
 *
 * @param  {Object|Array} obj Might be populated.
 *
 * @return {Boolean} Whether the array has items/object has keys.
 */
function testPopulated(obj) {
  var arr = Array.isArray(obj) ? obj : Object.keys(obj);
  return arr.length > 0;
}

/**
 * Determines whether query string params match.
 *
 * @param  {Object}        paramsToTest    The values we're looking for.
 * @param  {String|Object} suppliedParams  Represents the actual values.
 *
 * @return {Boolean} Whether or not we found a match.
 */
function testParams(paramsToTest, suppliedParams) {
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
 * Shortcut the data api.
 *
 * @param  {String} dataProp   A data api function name (i.e "ok")
 * @param  {String} valueName  The data identifier in question.
 * @param  {Object} kit        A component kit.
 *
 * @return {Boolean} Whether the test resolved.
 */
function testData(dataProp, valueName, kit) {
  return kit.data[dataProp](valueName);
}

/**
 * Determines whether a test prop resolves.
 *
 * @param  {String}  test        The name of the property we're using for a test (i.e. "path").
 * @param  {Any}     desired     Each test prop will deal with a different type of value.
 * @param  {Object}  kit         A component kit.
 * @param  {Object}  locationCtx Optional. A manually-supplied location context.
 *
 * @return {Boolean} True if the test resolved.
 */
function testResolves(test, desired, kit, locationCtx) {
  locationCtx = locationCtx || {};
  switch (test) {
    case 'notOk':
      return !desired;
    case 'ok':
      return !!desired;
    case 'path':
      return testPath(desired, false, locationCtx.pathname);
    case 'hash':
      return testPath(desired, true, locationCtx.hash);
    case 'subPath':
      return testSubPath(desired, false, locationCtx.pathname);
    case 'subHash':
      return testSubPath(desired, true, locationCtx.hash);
    case 'populated':
      return testPopulated(desired);
    case 'empty':
      return !testPopulated(desired);
    case 'params':
      return testParams(desired, locationCtx.search || locationCtx.params);
    case 'dataOk':
      return testData('ok', desired, kit);
    case 'dataNotOk':
      return testData('notOk', desired, kit);
    case 'dataPending':
      return testData('pending', desired, kit);
    case 'dataRequested':
      return testData('requested', desired, kit);
    default:
      throw (0, _utils.createError)('\n                               Something\'s gone horribly wrong with conditional\n                               routing. Usually this happens if you forget to\n                               include a necessary prop on a `When` component\n                               or spell the prop\'s name wrong.\n                             ');
  }
  return false;
}

/**
 * Converts the `location.search` property into an object.
 *
 * @param {String} supplied Optional. A supplied search string.
 *
 * @return {Object} Contains query string values.
 */
function parseSearch(supplied) {
  var search = (supplied || _utils.win.location.search).substring(1);
  try {
    return !search ? {} : JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g, '":"') + '"}', function (key, value) {
      return key === "" ? value : decodeURIComponent(value);
    });
  } catch (err) {
    return { malformed: true };
  }
}

/****************************
 * Public functions
 ****************************/

/**
 * Converts the `location` object into a simpler object with some props
 * removed and others added.
 *
 * @return {Object} Contains important info about location.
 */
function createLocation() {
  return (0, _utils.merge)((0, _utils.removeProps)(_utils.win.location, ['ancestorOrigins', 'assign', 'reload', 'replace']), {
    params: parseSearch(),
    hash: normalizeHash(_utils.win.location.hash || '')
  });
}

/*
 * Creates a reducer for modifying location information.
 */
function createHashRule() {
  return function (state) {
    return (0, _utils.merge)(state, currentLocation);
  };
}

/**
 * Fully vets a collection of props to determine whether everything
 * is ok and whether the component should render based on the outcome.
 *
 * @param  {Object}  props        Component props.
 * @param  {Object}  kit          The component kit.
 * @param  {Object}  locationCtx  Optional. A manually-supplied location context.
 * @param  {Boolean} forceResolve Whether we should force the test to resolve.
 *
 * @return {Object}  Documents the prop that was used for testing,
 *                   whether or not the component has children,
 *                   and whether or not the test resolved.
 */
function vetProps(props, kit, locationCtx, forceResolve) {
  var testProp = assertCleanProps(props);
  var hasChildren = assertComponentOrChildren(props).children;
  var resolves = !!forceResolve || testResolves(testProp, props[testProp], kit, locationCtx);
  return {
    testProp: testProp,
    hasChildren: hasChildren,
    resolves: resolves,
    exclusives: EXCLUSIVE_PROPS
  };
}

/**
 * Ensures component children are in the form of an array.
 *
 * @param  {Children} children  Component children.
 *
 * @return {Array}    Contains the component children.
 */
function arrayifyChildren(children) {
  if (!children) {
    return [];
  } else if (Array.isArray(children)) {
    return children;
  } else {
    return [children];
  }
}

/**
 * Allow users to manually test a path pattern against a string.
 *
 * @param  {String} pattern The desired pattern, such as "/foo/*"
 * @param  {String} actual  A string to test against, such as "/foo/bar"
 *
 * @return {Boolean} Whether a match was detected.
 */
function pathMatch(pattern, actual) {
  return testPath(pattern, false, actual);
}

/**
 * Allow users to manually test a subpath pattern against a string.
 *
 * @param  {String} pattern The desired pattern, such as "/foo/*"
 * @param  {String} actual  A string to test against, such as "/foo/bar"
 *
 * @return {Boolean} Whether a match was detected.
 */
function subPathMatch(pattern, actual) {
  return testSubPath(pattern, false, actual);
}

/**
 * Allow users to manually test a hash path pattern against a string.
 *
 * @param  {String} pattern The desired pattern, such as "#/foo/*"
 * @param  {String} actual  A string to test against, such as "#/foo/bar"
 *
 * @return {Boolean} Whether a match was detected.
 */
function hashMatch(pattern, actual) {
  return testPath(pattern, true, actual);
}

/**
 * Allow users to manually test a sub hash path pattern against a string.
 *
 * @param  {String} pattern The desired pattern, such as "#/foo/*"
 * @param  {String} actual  A string to test against, such as "#/foo/bar"
 *
 * @return {Boolean} Whether a match was detected.
 */
function subHashMatch(pattern, actual) {
  return testSubPath(pattern, true, actual);
}

/*

// Example:
// Choose as many options as resolve.
// You may either specify a component or a single child element.
<When ok={true} component={Foo} />
<When ok={true}>
  <Bar prop="prop" />
</When>

// Example:
// Choose only one of the options.
// Choose the first when the path matches exactly.
// Choose the second if the first doesn't resolve.
<Switch>
  <When path="/" component={BaseComponent} />
  <Otherwise component={FourOhFourComponent} />
</Switch>

location.pathname === '/foo/a/x'
<Switch>

  // When the entire path is "/" exactly
  <When path="/" component={Foo} />

  // When the entire path is "/foo/bar" exactly
  <When path="/foo/bar" component={Foo} />

  // When the path begins with "/foo", maybe followed by further sub pathing
  <When path="/foo/*" component={Foo} />

  // When the path ends with "/a" exactly.
  <When subPath="/a" component={Foo} />

  // When the path ends with "/a", maybe followed by further sub pathing.
  <When subPath="/a/*" component={Foo} />

  // When the path ends with "/a/b" exactly.
  <When subPath="/a/b" component={Foo} />

  // When the path ends with "/a/b", maybe followed by further sub pathing.
  <When subPath="/a/b/*" component={Foo} />

</Switch>


 */
import React, { Component } from 'react';
import { REHYDRATE } from 'redux-persist/constants';
import { addStoreHook, internals, createError, removeProps, win } from './utils';

const EXCLUSIVE_PROPS = [
  'ok',
  'notOk',
  'path',
  'hash',
  'subPath',
  'subHash',
  'populated',
  'empty'
];

const AFTSLASH = /\/$/;

const STATEKEY = Symbol();

/*
 * Create one place to track the current location and update it on
 * hash change.
 */
let currentLocation = createLocation();
win.addEventListener('hashchange', () => currentLocation = createLocation());


/*
 * Whenever a new store is registered, we'll pass the current location
 * into it. And whenver the hash changes, we'll update the location in the state.
 */
addStoreHook(store => {
  store.dispatch({ type: internals.HASH_PATH })
  win.addEventListener('hashchange', () => store.dispatch({ type: internals.HASH_PATH }));
})


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
    return '#'
  } else {
    return '#' + hash.replace(/^\#|^\/\#?/, '')
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
  let foundProp = false;
  Object.keys(props).forEach(prop => {
    if (EXCLUSIVE_PROPS.indexOf(prop) > -1) {
      if (foundProp) {
        throw createError(
          `
            ${foundProp} and ${prop} are mutually exclusive props
            for the \`When\` component. You must choose one or
            the other.
          `
        );
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
  const hasComponent = !!props.component;
  if (hasComponent && !!props.children) {
    throw createError(
      `
        The \`When\` component can either have a child component or
        a \`component\` prop, but not both.
      `
    );
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
 *
 * @return {Boolean} Whether the pathname matches.
 */
function testPath(desired, isHash) {
  const toMatch = isHash ? pathifyHash(desired) : desired.replace(AFTSLASH, '');
  const path    = isHash ? pathifyHash(currentLocation.hash) : currentLocation.pathname.replace(AFTSLASH, '');

  /*
   * If the paths are identical, match.
   */
  if ((isHash && desired === currentLocation.hash) || (!isHash && path === toMatch)) {
    return true;

  /*
   * When the desired value ends with "/*", match if the base desired value
   * is found at the beginning of the path and the next immediate character
   * either doesn't exist or is a slash (meaning end of string or further sub pathing.)
   */
  } else if (toMatch.slice(toMatch.length - 2) === '/*') {
    const matchBase = toMatch.slice(0, toMatch.length - 2);
    const aftChar   = path[matchBase.length];
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
 *
 * @return {Boolean} Whether the pathname matches.
 */
function testSubPath(desired, isHash) {
  const toMatch = isHash ? pathifyHash(desired) : desired.replace(AFTSLASH, '');
  const path    = isHash ? pathifyHash(currentLocation.hash) : currentLocation.pathname.replace(AFTSLASH, '');

  /*
   * If the paths are identical, match.
   */
  if ((isHash && desired === currentLocation.hash) || (!isHash && path === toMatch)) {
    return true;

  } else {

    /*
     * If we need to match further sub pathing, remove the star from
     * the desired value, make sure the desired value is found inside the
     * path somewhere and, if it is, ensure that the next immediate
     * character either doesn't exist (empty string) or is a slash.
     */
    if (toMatch.slice(toMatch.length - 2) === '/*') {
      const backMatch  = toMatch.slice(0, toMatch.length - 2);
      const matchIndex = path.indexOf(backMatch);

      if (matchIndex === -1) return false;

      const nextChar = path[matchIndex + backMatch.length];
      return !nextChar || nextChar === '/';

    /*
     * If we don't need to match further sub pathing, make sure
     * the match is found at the end of the path.
     */
    } else {
      const backPath = path.slice(path.length - toMatch.length);
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
  const arr = Array.isArray(obj) ? obj : Object.keys(obj);
  return arr.length > 0;
}

/**
 * Determines whether a test prop resolves.
 *
 * @param  {String}  test    The name of the property we're using for a test.
 * @param  {Any}     desired Each test prop will deal with a different type of value.
 *
 * @return {Boolean} True if the test resolved.
 */
function testResolves(test, desired) {
  switch (test) {
    case 'notOk'     : return !desired;
    case 'ok'        : return !!desired;
    case 'path'      : return testPath(desired);
    case 'hash'      : return testPath(desired, true);
    case 'subPath'   : return testSubPath(desired);
    case 'subHash'   : return testSubPath(desired, true);
    case 'populated' : return testPopulated(desired);
    case 'empty'     : return !testPopulated(desired);
    default          : throw createError(
                         `
                           Something's gone horribly wrong with conditional
                           routing. Usually this happens if you forget to
                           include a necessary prop on a \`When\` component
                           or spell the prop's name wrong.
                         `
                       );
  }
  return false;
}

/**
 * Converts the `location.search` property into an object.
 *
 * @return {Object} Contains query string values.
 */
function parseSearch() {
  const search = win.location.search.substring(1);
  try {
    return !search ? {}
                   : JSON.parse(
                         '{"'
                       + search.replace(/&/g, '","').replace(/=/g,'":"')
                       + '"}',
                       (key, value) => key === "" ? value : decodeURIComponent(value)
                     )
                   ;
  } catch (err) {
    return { malformed: true }
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
export function createLocation() {
  return Object.assign({}, removeProps(win.location, [
    'ancestorOrigins',
    'assign',
    'reload',
    'replace'
  ]), {
    params: parseSearch(),
    hash: normalizeHash(win.location.hash || '')
  })
}

/*
 * Creates a reducer for modifying location information.
 */
export function createRouteReducer(initialState) {
  return (state=initialState[internals.ROUTING], action) => {

    switch (action.type) {

      case REHYDRATE:
      case internals.HASH_PATH:
        return Object.assign({}, state, currentLocation);

      default:
        return state;

    }
  }
}

/**
 * Fully vets a collection of props to determine whether everything
 * is ok and whether the component should render based on the outcome.
 *
 * @param  {Object}  props        Component props.
 * @param  {Boolean} forceResolve Whether we should force the test to resolve.
 *
 * @return {Object}  Documents the prop that was used for testing,
 *                   whether or not the component has children,
 *                   and whether or not the test resolved.
 */
export function vetProps(props, forceResolve) {
  const testProp    = assertCleanProps(props);
  const hasChildren = assertComponentOrChildren(props).children;
  const resolves    = !!forceResolve || testResolves(testProp, props[testProp]);
  return {
    testProp: testProp,
    hasChildren: hasChildren,
    resolves: resolves,
    exclusives: EXCLUSIVE_PROPS
  }
}

/**
 * Ensures component children are in the form of an array.
 *
 * @param  {Children} children  Component children.
 *
 * @return {Array}    Contains the component children.
 */
export function arrayifyChildren(children) {
  if (!children) {
    return [];
  } else if (Array.isArray(children)) {
    return children;
  } else {
    return [children];
  }
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

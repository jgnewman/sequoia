'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getState = getState;
exports.dispatchToState = dispatchToState;
exports.initializeStore = initializeStore;
exports.reduce = reduce;

var _redux = require('redux');

var _reduxThunk = require('redux-thunk');

var _reduxThunk2 = _interopRequireDefault(_reduxThunk);

var _reduxPersist = require('redux-persist');

var _data = require('./data');

var _routing = require('./routing');

var _constants = require('./constants');

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Turns reducer functions into identifiable objects.
 * Doing this allows us to know that the user would like
 * the initial state handed to the reducer.
 */
var Reducer = function Reducer(reducer) {
  _classCallCheck(this, Reducer);

  this.reducer = reducer;
};

/**
 * Wraps redux's compose function to use REDUX_DEVTOOLS if it exists.
 */


function devToolsCompose(disableDevTools) {
  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  if (!disableDevTools && _utils.win.__REDUX_DEVTOOLS_EXTENSION__) {
    args.push(_utils.win.__REDUX_DEVTOOLS_EXTENSION__());
  }
  return _redux.compose.apply(null, args);
}

/**
 * A wrapper for Object.assign making it just a little nicer
 * to create a new state.
 *
 * @param  {Object} state    A state object.
 * @param  {Object} newVals  The changes to the state.
 *
 * @return {Object} A new state containing the merges.
 */
function update(state, newVals) {
  return Object.assign({}, state, newVals);
}

/**
 * Get state from the global store.
 *
 * @param  {String} appId  The unique ID for this app
 *
 * @return {Object} The current state object
 */
function getState(appId) {
  return _utils.globalStores[appId].getState();
}

/**
 * Manually dispatch an action.
 *
 * @param  {String} appId      The unique ID for this app
 * @param  {Object} actionObj  The action to dispatch
 *
 * @return {undefined}
 */
function dispatchToState(appId, actionObj) {
  _utils.globalStores[appId].dispatch(actionObj);
}

/**
 * Creates a Redux store for use in the application.
 *
 * @param  {Object} settings  Must container a `reducers` object and `initialState` object.
 * @param  {String} appId     A unique identifier for this app.
 *
 * @return {Store}  A redux store.
 */
function initializeStore(settings, appId) {
  var reducers = settings.reducers;
  var initialState = settings.initialState;
  var devToolsDisabled = !!settings.disableDevTools;
  var persistDisabled = !!settings.disableAutoPersist;
  var middleware = settings.middleware || [];

  /*
   * Attach application metadata to the state.
   */
  reducers[_utils.internals.APP_META] = function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState[_utils.internals.APP_META];
    return state;
  };
  initialState[_utils.internals.APP_META] = {
    appId: appId
  };

  /*
   * Attach the REST reducer to the initial state.
   */
  reducers[_utils.internals.DATA] = (0, _data.createRestReducer)(initialState);
  initialState[_utils.internals.DATA] = {};

  /*
   * Attach the Route reducer to the initial state.
   */
  reducers[_utils.internals.ROUTING] = (0, _routing.createRouteReducer)(initialState);
  initialState[_utils.internals.ROUTING] = (0, _routing.createLocation)();

  /*
   * Allow the user to specify a function or array of functions
   * as middleware.
   */
  if (typeof middleware === 'function') {
    middleware = [middleware];
  }

  /*
   * Make sure the user always has thunk middleware for free.
   */
  middleware.unshift(_reduxThunk2.default);

  /*
   * For any wrapped reducers, execute them in order to
   * add initialState to their closures.
   */
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    if (reducer instanceof Reducer) {
      reducers[key] = reducer.reducer(initialState, update);
    }
  });

  /*
   * Create the store.
   */
  var store = (0, _redux.createStore)((0, _redux.combineReducers)(reducers), // Combine all reducers. Intitial state should ALWAYS be divided
  initialState, devToolsCompose(devToolsDisabled, // Disables dev tools
  _redux.applyMiddleware.apply(undefined, _toConsumableArray(middleware)), persistDisabled ? function (next) {
    return function (action) {
      return next(action);
    };
  } : (0, _reduxPersist.autoRehydrate)()));

  /*
   * If the user hasn't disable auto persistence, go ahead and set up persist.
   */
  if (!persistDisabled) {
    (0, _utils.assertNesting)(settings, 'autoPersistConfig');
    settings.autoPersistConfig.blackList = settings.autoPersistConfig.blacklist || [];
    settings.autoPersistConfig.blackList.push(_utils.internals.APP_META);
    (0, _reduxPersist.persistStore)(store, settings.autoPersistConfig, settings.autoPersistDone || function () {});
  }

  /*
   * Keep track of the store "globally".
   */
  (0, _utils.registerStore)(appId, store);

  return store;
}

/**
 * Takes a function that will be called with the initial state. That function should
 * return another function that serves as the actual reducer, taking state and action.
 *
 * @param  {Function} reducer Takes initial state. Should return the raw reducer.
 *
 * @return {Reducer}  A Reducer instance.
 */
function reduce(reducer) {
  return new Reducer(reducer);
}
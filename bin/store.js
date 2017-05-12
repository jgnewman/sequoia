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

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var globalStores = {};

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

  if (!disableDevTools && window.__REDUX_DEVTOOLS_EXTENSION__) {
    args.push(window.__REDUX_DEVTOOLS_EXTENSION__());
  }
  return _redux.compose.apply(null, args);
}

/**
 * Get state from the global store.
 *
 * @param  {String} appId  The unique ID for this app
 *
 * @return {Object} The current state object
 */
function getState(appId) {
  return globalStores[appId].getState();
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
  globalStores[appId].dispatch(actionObj);
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
  reducers['@@SP_APP_META'] = function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState['@@SP_APP_META'];
    return state;
  };
  initialState['@@SP_APP_META'] = {
    appId: appId
  };

  /*
   * Attach the REST reducer to the initial state.
   */
  reducers['@@SP_DATA'] = (0, _data.createRestReducer)(initialState);
  initialState['@@SP_DATA'] = {};

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
      reducers[key] = reducer.reducer(initialState);
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
  !persistDisabled && (0, _reduxPersist.persistStore)(store, settings.autoPersistConfig || {}, settings.autoPersistDone || function () {});

  /*
   * Keep track of the store "globally".
   */
  globalStores[appId] = store;

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
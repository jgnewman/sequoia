import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunkware from 'redux-thunk';
import { persistStore, autoRehydrate } from 'redux-persist';
import { createRestReducer } from './data';
import { createRouteReducer, createLocation } from './routing';
import { createConstants } from './constants';
import { registerStore, globalStores, internals, assertNesting } from './utils';

/**
 * Turns reducer functions into identifiable objects.
 * Doing this allows us to know that the user would like
 * the initial state handed to the reducer.
 */
class Reducer {
  constructor(reducer) {
    this.reducer = reducer
  }
}

/**
 * Wraps redux's compose function to use REDUX_DEVTOOLS if it exists.
 */
function devToolsCompose(disableDevTools, ...args) {
  if (!disableDevTools && typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
    args.push(window.__REDUX_DEVTOOLS_EXTENSION__());
  }
  return compose.apply(null, args);
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
export function getState(appId) {
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
export function dispatchToState(appId, actionObj) {
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
export function initializeStore(settings, appId) {
  let   reducers         = settings.reducers;
  const initialState     = settings.initialState;
  const devToolsDisabled = !!settings.disableDevTools;
  const persistDisabled  = !!settings.disableAutoPersist;
  let   middleware       = settings.middleware || [];

  /*
   * Attach application metadata to the state.
   */
  reducers[internals.APP_META] = (state=initialState[internals.APP_META]) => state;
  initialState[internals.APP_META] = {
    appId: appId
  };

  /*
   * Attach the REST reducer to the initial state.
   */
  reducers[internals.DATA] = createRestReducer(initialState);
  initialState[internals.DATA] = {};

  /*
   * Attach the Route reducer to the initial state.
   */
  reducers[internals.ROUTING] = createRouteReducer(initialState);
  initialState[internals.ROUTING] = createLocation();

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
  middleware.unshift(thunkware);

  /*
   * For any wrapped reducers, execute them in order to
   * add initialState to their closures.
   */
  Object.keys(reducers).forEach(key => {
    const reducer = reducers[key];
    if (reducer instanceof Reducer) {
      reducers[key] = reducer.reducer(initialState, update);
    }
  });

  /*
   * Create the store.
   */
  const store = createStore(
    combineReducers(reducers), // Combine all reducers. Intitial state should ALWAYS be divided
    initialState,
    devToolsCompose(
      devToolsDisabled, // Disables dev tools
      applyMiddleware(...middleware),
      persistDisabled ? (next => action => next(action)) : autoRehydrate()
    )
  );

  /*
   * If the user hasn't disable auto persistence, go ahead and set up persist.
   */
  if (!persistDisabled) {
    assertNesting(settings, 'autoPersistConfig');
    settings.autoPersistConfig.blackList = settings.autoPersistConfig.blacklist || [];
    settings.autoPersistConfig.blackList.push(internals.APP_META);
    persistStore(
      store,
      settings.autoPersistConfig,
      settings.autoPersistDone || function () {}
    );
  }

  /*
   * Keep track of the store "globally".
   */
  registerStore(appId, store);

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
export function reduce(reducer) {
  return new Reducer(reducer);
}

import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunkware from 'redux-thunk';
import { persistStore, autoRehydrate } from 'redux-persist';
import { createRestReducer } from './data';
import { createConstants } from './constants';

const globalStores = {};

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
  if (!disableDevTools && window.__REDUX_DEVTOOLS_EXTENSION__) {
    args.push(window.__REDUX_DEVTOOLS_EXTENSION__());
  }
  return compose.apply(null, args);
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
  reducers['@@SP_APP_META'] = (state=initialState['@@SP_APP_META']) => state;
  initialState['@@SP_APP_META'] = {
    appId: appId
  };

  /*
   * Attach the REST reducer to the initial state.
   */
  reducers['@@SP_DATA'] = createRestReducer(initialState);
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
  middleware.unshift(thunkware);

  /*
   * For any wrapped reducers, execute them in order to
   * add initialState to their closures.
   */
  Object.keys(reducers).forEach(key => {
    const reducer = reducers[key];
    if (reducer instanceof Reducer) {
      reducers[key] = reducer.reducer(initialState);
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
  !persistDisabled && persistStore(
    store,
    settings.autoPersistConfig || {},
    settings.autoPersistDone   || function () {}
  );

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
export function reduce(reducer) {
  return new Reducer(reducer);
}

import { createStore, combineReducers, compose, applyMiddleware } from 'redux';
import thunkware from 'redux-thunk';
import { persistStore, autoRehydrate } from 'redux-persist';
import { REHYDRATE } from 'redux-persist/constants';

import { INTERNALS, createError, publish } from './utils';

/*
 * Holds references to hooks to run when stores are created.
 */
const storeHooks = [];

/*
 * For any internal store related stuff.
 */
export const secretStoreKey = Symbol();

/**
 * @class
 *
 * Creates a more robust Store object that allows us to more easily
 * reason about what's going on with our Stores.
 */
export class StoreWrapper {

  /**
   * @constructor
   *
   * @param  {Object} settings User config for the store.
   *
   * @return {undefined}
   */
  constructor(settings) {
    this.settings = settings;
    this.initialState = {};
    this.store = null;
    this.rulesCache = {};
    this.actionNames = {};
    this.create();
  }

  /**
   * Returns the actual store.
   *
   * @return {Redux Store}
   */
  get(secretKey) {
    return this.store ? this.store(secretKey) : null;
  }

  /**
   * Creates a new namespace on the initialState.
   *
   * @param  {String} name The name of the namespace.
   *
   * @return {undefined}
   */
  createNamespace(name) {
    this.initialState[name] = this.initialState[name] || {};
  }

  /**
   * Creates a new micro-reducer for this store.
   *
   * @param  {String|Symbol} name      The action type associated with the reducer.
   * @param  {String|Symbol} substate  The namespace on the state associated with the rule.
   * @param  {Function}      reducer   How to reduce this action. Takes update, substate, payload.
   *
   * @return {undefined}
   */
  registerRule(name, substate, reducer) {
    const ruleName = `${substate}:${name}`;
    if (this.rulesCache[ruleName]) { throw createError(`A rule with the name ${name} already exists.`) }

    this.actionNames[substate] = this.actionNames[substate] || {};
    this.actionNames[substate][name] = ruleName;

    this.rulesCache[ruleName] = { substate: substate, reducer: reducer };

    /*
     * Automatically dispatch default rules on register.
     */
    name === 'DEFAULT' && this.dispatch({ type: `${substate}:DEFAULT` });
  }

  /**
   * Manually dispatch an action.
   *
   * @param  {Object} action  Contains `type` and whatever else.
   *
   * @return {undefined}
   */
  dispatch(action) {
    const store = this.get(secretStoreKey);
    store.dispatch(action);
  }

  /**
   * Wraps redux's composse function to add in redux
   * dev tools if it's available in the environment.
   *
   * @param  {Any} args The arguments we want to pass to compose.
   *
   * @return {Function} The result of calling redux's compose.
   */
  compose(...args) {
    if (!this.settings.disableDevTools && global.__REDUX_DEVTOOLS_EXTENSION__) {
      args.push(global.__REDUX_DEVTOOLS_EXTENSION__());
    }
    return compose.apply(null, args);
  }

  /**
   * Create a single reducer that will serve to pull micro-reducers
   * from a rules cache as named by action type and run only that function,
   * as opposed to running EVERY action through EVERY case in EVERY reducer
   * function as is tradition.
   *
   * @return {Object} A new state.
   */
  reduce(state=this.initialState, action) {

    /*
     * Should look like: `UPDATE_FOO: { substate: 'app', reducer: Function }`
     */
    const rule = this.rulesCache[action.type];

    /*
     * If a rule for this action type exists...
     */
    if (rule) {

      /*
       * Create a function that can update the substate.
       */
      let newSubstate = {};
      const updater = (substate, extensions) => {
        newSubstate[rule.substate] = Object.assign({}, substate || {}, extensions || {});
      }

      /*
       * Call the rule's reducer with the updater, the current substate, and
       * the action payload. Afterward, attach the new substate to the full state.
       */
      rule.reducer(updater, state[rule.substate] || {}, action.payload);
      return Object.assign({}, state, newSubstate);

    } else if (action.type === REHYDRATE) {

      /*
       * In case anything is listening for the reydrated event, this is where
       * it happens.
       */
      setTimeout(() => {
        publish(INTERNALS.REHYDRATED);
      }, 0)

      /*
       * When autoPersist attempts to rehydrate, clear out any existing
       * data and don't overwrite hash path stuff.
       */
      return Object.assign({}, state, {
        [INTERNALS.DATA_REF]  : {},
        [INTERNALS.HASH_PATH] : Object.assign({}, state[INTERNALS.HASH_PATH])
      });

    /*
     * If no rule for the action type exists, return the state.
     */
    } else {
      return state;

    }
  }

  /**
   * Actually create the redux store.
   *
   * @return {undefined}
   */
  create() {

    /*
     * Give the user thunk middleware for free. We'll need it.
     */
    let middleware = this.settings.stateMiddleware || [];
    typeof middleware === 'function' && (middleware = [middleware]);
    middleware.unshift(thunkware);

    /*
     * Create the actual store.
     */
    const store = createStore(this.reduce.bind(this), this.initialState, this.compose(
      applyMiddleware(...middleware),
      this.settings.disableAutoPersist ? (next => action => next(action)) : autoRehydrate()
    ));

    /*
     * Provide means to access the store if we have a secret key for it.
     */
    this.store = (secretKey) => secretKey === secretStoreKey ? store : null;

    /*
     * If the user hasn't disabled auto persistence, go ahead and set up persist.
     */
    if (!this.settings.disableAutoPersist) {
      this.settings.autoPersist = this.settings.autoPersist || {};
      persistStore(
        store,
        this.settings.autoPersist,
        this.settings.autoPersist.done || function () {}
      );
    }

    /*
     * Run all store creation hooks.
     */
    storeHooks.forEach(hook => hook(store));
  }
}

/**
 * Register functions that will run on each new store when it
 * is created.
 *
 * @param  {Function} hook  The function to run. Takes the store.
 *
 * @return {undefined}
 */
export function onCreateStore(hook) {
  storeHooks.push(hook);
}

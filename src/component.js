import React from 'react';
import { Children } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { connect, Provider } from 'react-redux';

import { INTERNALS, mapObject, toggleSymbols } from './utils';
import { secretStoreKey, StoreWrapper } from './store';
import { requestsPackage, DataAPI } from './data';

/**
 * @class
 *
 * Provides tools for configuring a component.
 */
class ComponentKit {

  /*
   * Build the instance with a storage place.
   */
  constructor(cache, getStoreWrapper) {
    this.__cache = cache;

    /*
     * Give the user a data api for accessing Copenhagen data on
     * the state.
     */
    this.data = new DataAPI(getStoreWrapper)

    /*
     * Map PropTypes to ensure, but don't do it if we
     * already did it.
     */
    if (PropTypes.string !== this.ensure.string) {
      Object.assign(this.ensure, PropTypes);
    }
  }

  /**
   * Allow the user to validate prop types on a component.
   *
   * @param  {Object} propTypes Defines the prop types.
   *
   * @return {ComponentKit}
   */
  ensure(propTypes) {
    const typeCache = this.__cache.propTypes = this.__cache.propTypes || {};
    mapObject(propTypes, (val, propType) => typeCache[propType] = val);
    return this;
  }

  /**
   * Allow the user to map state to props.
   *
   * @param  {Function} infuser Takes `state` and returns a collection of props.
   *
   * @return {ComponentKit}
   */
  infuseState(infuser) {
    this.__cache.stateInfusers = this.__cache.stateInfusers || [];
    this.__cache.stateInfusers.push(infuser);
    return this;
  }

  /**
   * Allow the user to run event handlers with both event and current props.
   *
   * @param  {Object} handlers The handlers to infuse.
   *
   * @return {ComponentKit}
   */
  infuseHandlers(handlers) {
    this.__cache.handlers = this.__cache.handlers || {};
    Object.assign(this.__cache.handlers, handlers);
    return this;
  }

  /**
   * Allow the user to map dispatch to props.
   *
   * @param  {Function} infuser Takes `actionSymbols` and returns a collection of action functions.
   *
   * @return {ComponentKit}
   */
  infuseActions(infuser) {
    this.__cache.actionInfusers = this.__cache.actionInfusers || [];
    this.__cache.actionInfusers.push(infuser);
    return this;
  }

}

/**
 * Create a function that can be used to trap references
 * to elements when used in a `ref=` attribute. Subsequently
 * you will be able to use `ref.get` to retrieve the element.
 *
 * @return {Function} The referencer.
 */
function createReferencer() {
  const captures = {};

  /*
   * Used like `ref={ref('foo')}`.
   * It returns a function that captures the element under the given name.
   */
  const ref = (name) => (elem) => {
    if (elem) {
      captures[name] = elem;
    }
  }

  /*
   * Retrieves one of our captured references by name.
   */
  ref.get = (name) => captures[name];

  /*
   * Retrieves a captured reference by name after some time.
   * Useful for cases when you need to call `scroll` or `focus`.
   */
  ref.getAsync = (name, duration, callback) => {
    if (typeof duration === 'function') {
      callback = duration;
      duration = 0;
    }
    setTimeout(() => {
      callback(captures[name]);
    }, duration);
  };

  return ref;
}

/**
 * Generates a function that calls dispatch on a store.
 *
 * @param  {StoreWrapper} storeWrapper A storeWrapper instance.
 * @param  {Object}       actionProps  The object ultimately containing all of the actions.
 * @param  {Function}     fn           A function that returns an action to be dispatched.
 *
 * @return {Function} The new dispatcher function.
 */
function createDispatcher(storeWrapper, actionProps, fn) {

  /*
   * This will be the actual action function.
   */
  return (...payload) => {

    /*
     * If the user gave us a function, we call it here. We end up with
     * the type needed for the dispatch.
     */
    let actionType = typeof fn === 'function' ? fn(...payload) : fn;

    /*
     * If we got a thunk, re-wrap it so that it access to the other
     * actions as well.
     */
    if (typeof actionType === 'function') {
      const origActionType = actionType;
      actionType = dispatch => {
        return origActionType(actionProps);
      }
    }

    /*
     * If the action type was a string, make an object out of
     * it. Otherwise, we assume it's already an object or a thunk.
     */
    if (typeof actionType === 'string') {
      actionType = { type: actionType };
    }

    /*
     * Dispatch the action type
     */
    return storeWrapper.dispatch(actionType);
  }
}

/**
 * Create a new component.
 *
 * @param  {Function} generator  Takes an application kit and returns a render function.
 *
 * @return {Component} A React component.
 */
export function component(generator) {
  let storeWrapper;
  const getStoreWrapper = secretKey => {
    return secretKey === secretStoreKey ? storeWrapper : null;
  };

  const dataToggler = toggleSymbols();
  let prevData = {};

  /*
   * When the generator runs, it will populate the cache (via kit methods) with
   * data informing how to map state to props, create actions, etc.
   */
  const cache = {};
  const renderFn = generator(new ComponentKit(cache, getStoreWrapper));

  /*
   * Create a proxy component so that we can access render and context.
   */
  const Component = class extends React.Component {
    constructor() {
      super();
    }

    render() {

      /*
       * The referencer prop will be specific to each component and can
       * be used to trap `ref={...}` references.
       */
      const referencer = createReferencer();
      let newProps = Object.assign({}, this.props, { ref: referencer });

      /*
       * Trap a reference to the storeWrapper so that our
       * data API will be able to use it.
       */
      storeWrapper = this.context[INTERNALS.STORE_REF];

      /*
       * If the user has specified action infusers, loop over each group and
       * merge them together into a prop called `actions` that dispatches the
       * action to the store. The reason we don't use mapDispatchToProps is
       * because we need access to the actionNames on the storeWrapper.
       */
      if (cache.actionInfusers) {
        const actionProps = {};

        cache.actionInfusers.forEach(infuser => {
          Object.assign(
            actionProps,
            newProps.actions || {}, // Merge any any actions passed in from the parent.
            mapObject(
              infuser(storeWrapper.actionNames, requestsPackage),
              fn => createDispatcher(storeWrapper, actionProps, fn)
            )
          );
        })

        newProps = Object.assign({}, newProps, { actions: actionProps });
      }

      /*
       * If the user has specified handlers, make them more robust by
       * converting each one into a function that is called both with
       * the event object and the current props.
       */
      if (cache.handlers) {
        const newHandlers = mapObject(cache.handlers, (val, key) => {
          const handler = evt => val(evt, newProps);
          handler.with = (...args) => evt => val(evt, newProps, ...args);
          return handler;
        });
        const mergedHandlers = newProps.handlers ? Object.assign({}, newProps.handlers, newHandlers) : newHandlers;
        newProps = Object.assign({}, newProps, { handlers: mergedHandlers });
      }

      return renderFn(newProps);
    }
  }

  /*
   * Make sure every component can access the store wrapper
   * we got from our custom provider.
   */
  Component.contextTypes = {
    [INTERNALS.STORE_REF]: PropTypes.object.isRequired
  };

  /*
   * Attach prop types to the component if necessary.
   */
  if (cache.propTypes) {
    Component.propTypes = cache.propTypes;
  }

  /*
   * To map state to props, loop over all state infusers and call
   * each one with the state. Merge all their outputs together and
   * return the result.
   */
  function mapStateToProps(state) {
    const out = {};

    /*
     * Assign props from all of the state infusers.
     */
    if (cache.stateInfusers) {
      cache.stateInfusers.forEach(infuser => {
        Object.assign(out, infuser(state));
      });
    }

    /*
     * Cause the component to re-render when data changes by
     * toggling a symbol on its props when the incoming data
     * is different.
     */
    if (prevData === state[INTERNALS.DATA_REF]) {
      out.__dataSymbol = dataToggler.current();
    } else {
      out.__dataSymbol = dataToggler();
      prevData = state[INTERNALS.DATA_REF];
    }

    /*
     * Provide state location as a prop.
     */
    out.location = state[INTERNALS.HASH_PATH];

    return out;
  }

  /*
   * Return a connected component so we can make use of
   * mapStateToProps
   */
  return connect(mapStateToProps, () => ({}))(Component);
}

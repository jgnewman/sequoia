import React from 'react';
import { Children } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';

import { INTERNALS, mapObject, createError } from './utils';
import { secretStoreKey, StoreWrapper } from './store';
import { createRestRule } from './data';
import { createHashRule } from './routing';

/*
 * First things first: You should never have to import react proper.
 * So in order to make JSX work, we need to make it a global.
 */
global.React = React;

/**
 * @class
 *
 * Allows us to reference the correct store from deep within our nesting.
 */
class CustomProvider extends React.Component {

  /*
   * Build the class.
   */
  constructor() {
    super();
  }

  /*
   * Add a property to nested children called .context."@@SQ_Store"
   * that will contain the store wrapper instance.
   */
  getChildContext() {
    return { [INTERNALS.STORE_REF]: this.props[INTERNALS.STORE_REF] };
  }

  /*
   * Render out a provider to get the react-redux benefits
   */
  render() {
    return (
      <Provider store={this.props[INTERNALS.STORE_REF].get(secretStoreKey)}>
        {Children.only(this.props.children)}
      </Provider>
    )
  }
}

/*
 * Make sure the "@@SQ_Store" context prop always exists.
 */
CustomProvider.childContextTypes = {
  [INTERNALS.STORE_REF]: PropTypes.object.isRequired
};

/**
 * @class
 *
 * Provides tools for configuring an application.
 */
class AppKit {

  /*
   * Build the instance with a storage place.
   */
  constructor(cache) {
    this.cache = cache;
  }

  /**
   * Allow the user to perform advanced configurations.
   *
   * @param  {Object} settings The users's settings.
   *
   * @return {AppKit}
   */
  config(settings) {
    this.cache.config = settings;
    return this;
  }

  /**
   * Allow the user to determine where to render their application.
   *
   * @param  {String|Element} target The html target for rendering.
   *
   * @return {AppKit}
   */
  renderIn(target) {
    if (this.cache.target) {
      throw createError('The `renderIn` function can only be called once per application.')
    }
    this.cache.target = typeof target === 'string' ? document.querySelector(target) : target;
    return this;
  }

  /**
   * Provides an intuitive technique for setting up initial state
   * and defining rules for it.
   *
   * @param  {String} namespace The name of the affected namespace on the state.
   * @param  {Object} rulesObj  Describes the rules for updating this namespace.
   *
   * @return {AppKit}
   */
  createRules(namespace, rulesObj) {
    this.cache.rules = this.cache.rules || {};
    this.cache.rules[namespace] = this.cache.rules[namespace] || {};
    Object.assign(this.cache.rules[namespace], rulesObj);
    return this;
  }
}

/**
 * Create a new application.
 * TODO: Don't allow this to be called inside the nested children of another application call.
 *
 * @param  {Function} generator  Takes an application kit and returns a render function.
 *
 * @return {Component} A React component.
 */
export function application(generator) {
  const appCache = {};
  const Application = generator(new AppKit(appCache));
  const storeWrapper = new StoreWrapper(appCache.config || {});

  /*
   * Register our implicit data namespace and rules.
   */
  storeWrapper.createNamespace(INTERNALS.DATA_REF);
  storeWrapper.registerRule(INTERNALS.DATA_RULE, INTERNALS.DATA_REF, createRestRule());

  /*
   * Register our implicit routing namespace and rules.
   */
  storeWrapper.createNamespace(INTERNALS.HASH_PATH);
  storeWrapper.registerRule('DEFAULT', INTERNALS.HASH_PATH, createHashRule());

  /*
   * If the user created rules, register them.
   */
  if (appCache.rules) {

    /*
     * For every namespaced ruleset, create a namespace in the initialState.
     */
    mapObject(appCache.rules, (namespace, namespaceName) => {
      storeWrapper.createNamespace(namespaceName);

      /*
       * Register each of our rules to be used by the reducer. If the
       * rule is DEFAULT, it will automatically trigger it immediately to
       * populate the namespace.
       */
      mapObject(namespace, (rule, ruleName) => {
        storeWrapper.registerRule(ruleName, namespaceName, rule);
      })
    })
  }

  /*
   * When we render the application, make sure to pass the store wrapper down
   * through the context tree.
   */
  ReactDOM.render(
    React.createElement(CustomProvider, { [INTERNALS.STORE_REF]: storeWrapper }, <Application />),
    appCache.target
  )
}

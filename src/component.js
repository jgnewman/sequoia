import React from 'react';
import ReactDOM from 'react-dom';
import reduxInfuse from 'react-redux-infuser';
import PropTypes from 'prop-types';
import uuid from 'uuid';
import { Provider } from 'react-redux';
import { createConstantsFromArray } from './constants';
import { createRestfulAction, DataAPI } from './data';
import { LocationAPI } from './routing';
import { getState, dispatchToState, initializeStore, reduce } from './store';
import { internals, createError, assertNesting, toggleSymbols } from './utils';

/*
 * First things first: You should never have to import react proper.
 * So in order to make JSX work, we need to make it a global.
 */
global.React = React;

/**
 * Translates traditional React PropTypes in to all caps prop types in order
 * to fit the scheme of constants in the framework better.
 *
 * @param  {Object|Function} val Something that can have properties attached to it.
 *
 * @return {Object|Function} The input with proptypes attached.
 */
function attachPropTypes(val) {
  Object.keys(PropTypes).forEach(typeName => {
    val[typeName] = PropTypes[typeName];
  });

  val.boolean = val.bool;
  val.function = val.func;
  return val;
}

/**
 * Creates an object full of useful tools for a component to use.
 *
 * @param  {Object} cache Stores the result of using the component tools.
 *
 * @return {Object} Containing all the tools.
 */
function generateComponentTools(cache) {
  const stateSelectors = [];
  assertNesting(cache, 'i');

  /*
   * We're gonna take inspiration from `combineReducers` and turn
   * `mapStateToProps` into a function that executes multiple state
   * mapping functions.
   */
  cache.i.values = state => {
    let out = {};
    stateSelectors.forEach(selector => {
      out = Object.assign({}, out, selector(state))
    })
    return out;
  }

  return {

    /*
     * Provide prop type handling
     */
    ensure: attachPropTypes(settings => cache.e = settings),

    /*
     * Provide a function that selects state values and converts them to props
     */
    infuseState: stateSelect => stateSelectors.push(stateSelect),

    /*
     * Infuse in a single function and convert it to an action
     */
    infuseActions: (name, val) => {
      const actions = assertNesting(cache, 'i', 'actions');
      typeof name === 'object'
        ? cache.i.actions = Object.assign(cache.i.actions, name)
        : actions[name] = val;
    },

    /*
     * Infuse in a single function and bind it to the container
     */
    infuseBinders: (name, val) => {
      const binders = assertNesting(cache, 'i', 'binders');
      typeof name === 'object'
        ? cache.i.binders = Object.assign(cache.i.binders, name)
        : binders[name] = val;
    },

    /*
     * Infuse in a single function and add it to the props
     */
    infuseModules: (name, val) => {
      const modules = assertNesting(cache, 'i', 'modules');
      typeof name === 'object'
        ? cache.i.modules = Object.assign(cache.i.modules, name)
        : modules[name] = val;
    },

    /*
     * Use a single object to create packs of actions, binders, and modules
     */
    infuse: settings => {
      settings.binders && (cache.i.binders = Object.assign({}, cache.i.binders || {}, settings.binders));
      settings.actions && (cache.i.actions = Object.assign({}, cache.i.actions || {}, settings.actions));
      settings.modules && (cache.i.modules = Object.assign({}, cache.i.modules || {}, settings.modules));
      settings.state   && stateSelectors.push(settings.state);
    }
  }
}

/**
 * Takes a function and returns a sweet-azz component.
 *
 *   component(({ infuse, ensure }) => {
 *     infuse({ values: state => ({ foo: state.foo, bar: state.bar }) });
 *     ensure({ foo: ensure.string, bar: ensure.string });
 *     return ({ foo, bar }) => <div>{foo}{bar}</div>
 *   })
 *
 * @param  {Function}  componentFunction Called with a collection of tools for building the component.
 *
 * @return {Component} A react component.
 */
export function component(componentFunction) {
  const dataToggler     = toggleSymbols();
  const locationToggler = toggleSymbols();
  let appId;
  let dataCache;
  let locationCache;

  /*
   * Create the tools that will get passed into the componentFunction.
   */
  const setup    = {};
  const tools    = generateComponentTools(setup);
  const getAppId = () => appId;
  const dataAPI  = new DataAPI(getState, dispatchToState, getAppId)
  const locAPI   = new LocationAPI(getState, getAppId)

  /*
   * Create a reference capturer.
   */
  const capture = () => {
    const capturer = name => {
      return elem => elem && (capturer[name] = () => elem)
    }
    return capturer;
  }

  /*
   * Call the componentFunction with its controller functions.
   * Then attach prop types to the result.
   */
  let Component = componentFunction(tools);
  Component.propTypes = setup.e || {};

  /*
   * Enforce dumb components.
   */
  if (Component.prototype instanceof React.Component) {
    throw createError(
      `
        Components must return functions. React component classes are not
        allowed because they have too many potential pitfalls.
      `
    )
  }

  /*
   * Automatically give the user the data module, a location module, and
   * a reference capture mechanism.
   */
  tools.infuseModules({
    data: dataAPI,
    location: locAPI,
    capture: capture
  });

  /*
   * This part is a little bit of magic. Essentially, we need components to re-render
   * whenever data/location updates so their api functions within render methods will actually
   * run. However, we don't want to pass the data itself into the props because the
   * whole point is to not give users tools to screw themselves over.
   *
   * So here we infuse a prop called `__dataSymbol/__locationSymbol` whose value will always be
   * one of two Symbol constants, making it useless to the user. Whenever the state updates,
   * we'll check to see if @@SQ_DATA/@@SQ_ROUTING has been updated. If so, we'll toggle the symbols,
   * thus causing the component to re-render. If not, we'll return the current symbol
   * and the compnent will not necessarily re-render.
   */
  tools.infuseState(state => {
    const out = {};

    /*
     * Handle data toggles
     */
    if (dataCache === state[internals.DATA]) {
      out.__dataSymbol = dataToggler.current();
    } else {
      out.__dataSymbol = dataToggler();
      dataCache = state[internals.DATA];
    }

    /*
     * Handle location toggles
     */
    if (locationCache === state[internals.ROUTING]) {
      out.__locationSymbol = locationToggler.current();
    } else {
      out.__locationSymbol = locationToggler();
      locationCache = state[internals.ROUTING];
    }

    /*
     * Take this opportunity to make sure the data API can
     * access the APP ID.
     */
    appId = appId || state[internals.APP_META].appId;
    return out;
  })

  /*
   * If we are using infused actions or values, use reduxInfuse to add
   * everything in. Otherwise, manually add in binders and modules.
   */
  if (setup.i && (setup.i.actions || setup.i.values)) {
    Component = reduxInfuse(Component, setup.i || {});
  }

  /*
   * Return the component.
   */
  return Component;
}

/**
 * Initializes the application by rendering it into a provided
 * element.
 *
 * @param  {JSX}    app      The user's application.
 * @param  {Object} settings Putting this together.
 *
 * @return {Render} The result of calling ReactDOM.render
 */
export function render(app, settings) {
  const target = typeof settings.target === 'string' ? document.querySelector(settings.target) : settings.target;
  const appId  = uuid();

  /*
   * If the user has not provided state config, prepare a minimal
   * state config so that all other functionality that needs state
   * will have it.
   */
  if (!settings.stateConfig) {
    settings.stateConfig = {
      initialState: {},
      reducers: {}
    }
  }

  /*
   * Generate constants before anything else happens
   */
  createConstantsFromArray(settings.constants || []);

  /*
   * Initialze the store and render it into a provider.
   */
  return ReactDOM.render(
    <Provider store={initializeStore(settings.stateConfig, appId)}>
      {app}
    </Provider>,
    target
  );
}

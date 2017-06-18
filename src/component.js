import { Component as ReactComponent } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

import { forProps, extend } from './utils';
import { createState } from './state';
import http from './http';

let fauxState;
const noop = (() => null);

/*
 * Will be used to map user's lifecycle methods
 * to React lifecycle methods.
 */
const LIFECYCLE_MAP = {
  beforeMount   : 'componentWillMount',
  afterMount    : 'componentDidMount',
  beforeUnmount : 'componentWillUnmount',
  beforeUpdate  : 'componentWillUpdate',
  afterUpdate   : 'componentDidUpdate',
  shouldUpdate  : 'shouldComponentUpdate'
};

/*
 * For rare cases when a state may be desirable but is
 * NEVER updated, we can create a shared mock state.
 */
function mockState() {
  fauxState = fauxState || createState({});
  return fauxState;
}

/**
 * Maps a value's type to it's corresponding
 * prop type.
 * 
 * @param {Any} val Some truthy value.
 * 
 * @return {Function} The corresponding prop type.
 */
function mapPropType(val) {
  let type = typeof val;
  if (type === 'boolean') return PropTypes.bool;
  if (type === 'function') return PropTypes.func;
  return PropTypes[type] ? PropTypes[type] : PropTypes.any;
}

/**
 * Attaches a contextTypes object to a component.
 * 
 * @param {Component} component A component instance.
 * @param {Array}     userVals  Extra context items the user expects.
 * 
 * @return {undefined}
 */
function attachContextTypes(component, userVals=[]) {
  const contextTypes = {
    "@@SQ_State": PropTypes.object,
    "@@SQ_Target": PropTypes.string
  }
  userVals.forEach(val => contextTypes[val] = PropTypes.any);
  component.contextTypes = contextTypes;
}

/**
 * If an item exists, extend it with the extras. Otherwise,
 * return the extras.
 * 
 * @param {Maybe Object} item   To be extended if it exists.
 * @param {Object}       extras Included in final result.
 * 
 * @return {Object} Either an extended object or the extras.
 */
function extendIfExists(item, extras) {
  return item ? extend(item, extras) : extras;
}

/**
 * Generates a component that subscribes to the state.
 * When the state updates, it adds receives an extra prop called
 * "state" with all of the state values in it.
 * 
 * @param {Component} component  A React component.
 * @param {Object}    settings   Describes how the component should work.
 * 
 * @return {Component}
 */
function robustifyComponent(component, settings) {
  let ruleCache;
  let stateCache;

  /*
   * Create a more robust React component that can handle
   * state subscriptions and context bindings.
   */
  class StateBinding extends ReactComponent {

    /**
     * @constructor
     * The component state will be used to track the global
     * state values. This will cause re-renders whenever
     * state changes occur.
     */
    constructor() {
      super();
      this.state = {};
      this.watcher = newState => this.setState(newState.get());
    }

    /**
     * Provide all child components with necessary context
     * properties.
     */
    getChildContext() {
      let childContext;

      /*
       * Ensure there is a state.
       */
      !stateCache && this.ensureState();

      /*
       * If our context is already marked as rendered and we have
       * an `el` property, throw an error.
       */
      if (this.context["@@SQ_Target"] && settings.el) {
        throw new Error('Component already lives in a rendered nesting.');
      }

      /*
       * Children should be given access to a state property
       * as well as a render target if we're rendering.
       */
      childContext = {
        "@@SQ_State": stateCache,
        "@@SQ_Target": this.context["@@SQ_Target"] || settings.el
      };

      /*
       * Dynamically add any extra context provided
       * by the user.
       */
      if (settings.childContext) {
        Object.assign(childContext, settings.childContext);
      }

      return childContext;
    }

    /**
     * Whenever this component is preparing to mount,
     * subscribe it to the state.
     */
    componentWillMount() {
      this.ensureState();
      stateCache.watch(this.watcher);
    }

    /**
     * Whenever this component is preparing to be
     * removed, unsubscribe it from the state.
     */
    componentWillUnmount() {
      stateCache.unwatch(this.watcher);
    }

    /**
     * Guarantees that we have a state object to work with.
     * Order of priority will be:
     * - a pre-existing state we've already ensured exists
     * - a manually provided state
     * - an existing context state
     * - a new state we create
     */
    ensureState() {
      stateCache = stateCache                 ||
                   settings.state             ||
                   this.context["@@SQ_State"] ||
                   createState({});
    }

    /**
     * Adds extra props as necessary to the child output.
     * Also ensures state exists and that any initial
     * state rule is automatically called.
     */
    genProps() {
      const newProps = {};

      /*
       * Make sure a state exists.
       */
      !stateCache && this.ensureState();

      /*
       * If we haven't cached rules yet, cache them
       * and execute the initial rule. If we have
       * a cache, pass that cache in as props.
       */
      if (settings.createRules) {
        if (!ruleCache) {
          ruleCache = settings.createRules(stateCache, http);
          ruleCache.initial && ruleCache.initial();
        }
        newProps.rules = extendIfExists(this.props.rules, ruleCache);
      }

      /*
       * Merge extra props with our natural props.
       */
      return extend(this.props, newProps);
    }

    /**
     * Render out the provided component.
     */
    render() {
      return React.createElement(component, this.genProps(), this.props.children);
    }
  }

  /*
   * Make sure children of our component will have access to
   * the necessary context properties.
   */
  StateBinding.childContextTypes = {
    "@@SQ_State": PropTypes.object,
    "@@SQ_Target": PropTypes.string
  };

  /*
   * Dynamically add childContextTypes if the user
   * has specified a child context.
   */
  if (settings.childContext) {
    forProps(settings.childContext, (item, name) => {
      StateBinding.childContextTypes[name] = mapPropType(item);
    });
  }

  /*
   * Make sure our component has access to all of the
   * context properties it needs and return it.
   */
  attachContextTypes(StateBinding);
  return StateBinding;
}

/**
 * Generates handler functions and caches them.
 * 
 * @param {Object}   handlerCache Where we will eventually store handlers.
 * @param {Object}   handlers     A package of handlers described by the user.
 * @param {Function} getProps     Retrieves component props.
 * @param {Function} getRefs      Retrieves a component's refs.
 * 
 * @return {undefined}
 */
function cacheHandlers(handlerCache, handlers, getProps, getRefs) {
  const pack = evt => ({ evt: evt, props: getProps(), refs: getRefs() });
  forProps(handlers, (fn, name) => {
    handlerCache[name] = evt => fn(pack(evt));
    handlerCache[name].with = (...extra) => evt => fn(pack(evt), ...extra);
  })
}

/**
 * Generates real lifecycle methods from abstracted ones.
 * 
 * @param {Object} proto   A component prototype.
 * @param {Object} methods Abstracted methods.
 * 
 * @return {undefined}
 */
function buildLifecycle(proto, methods) {
  forProps(methods, (method, name) => {

    /*
     * This proxy function may take an additional argument, such as
     * prevState or nextProps. It then calls our user function with
     * either 2 or 3 arguments:
     * 1. props
     * 2. additional argument if it's truty or refs if not
     * 3. refs if the additional argument was truthy
     * It is not written in arrow notation because it needs
     * access to `this` component.
     */
    proto[LIFECYCLE_MAP[name]] = function (addtl) {
      const rest = [this.refs];
      addtl && rest.unshift(addtl);
      return method(this.genProps(), ...rest);
    }
  })
}

/**
 * Generates a basic component.
 * 
 * @param {Object|Function} settings Describes how this component should work.
 * 
 * @return {Component}
 */
function createBasicComponent(settings) {
  let refCache;
  let propCache;
  let helperCache;
  let handlerCache;
  let proxyComponent;
  let expectedContext;

  /*
   * If the user provided a stateless component function, pass it
   * create a bare bones settings object out of it.
   */
  if (typeof settings === 'function') {
    settings = { render: settings };
  }

  /*
   * Because of the way we're generating new props, we'll need
   * a no-op component for proxying a proptype check.
   */
  if (settings.ensure) {
    proxyComponent = () => {};
    proxyComponent.propTypes = settings.ensure(PropTypes);
  }

  /*
   * Gather up the names of desired items to pull
   * from context.
   */
  if (settings.contextProps) {
    expectedContext = settings.contextProps;
  }

  /*
   * Generate the new React component.
   */
  class Component extends ReactComponent {

    /**
     * Determines how to retrieve the component's name so
     * that it shows up properly in dev tools and such.
     */
    static get name() {
      return settings.name || settings.render.name || 'Component';
    }

    /**
     * Infuses extra props such as state mappings into
     * the component's full collection of props.
     */
    genProps() {
      const newProps = {};
      propCache = {};
      refCache = this.refs;

      /*
       * Map state values to component props.
       */
      if (settings.observe) {
        const state = this.context['@@SQ_State'] || mockState();
        Object.assign(newProps, settings.observe(state.get()))
      }

      /*
       * If we haven't cached handlers yet, cache them
       * for later use. If we have a cache, pass that
       * cache in as props.
       */
      if (settings.handlers) {
        if (!handlerCache) {
          handlerCache = {};
          cacheHandlers(
            handlerCache,
            settings.handlers,
            () => propCache,
            () => refCache
          );
        }
        newProps.handlers = extendIfExists(this.props.handlers, handlerCache);
      }

      /*
       * If the user wants to manually add some helpers,
       * do that here and cache them.
       */
      if (settings.helpers) {
        helperCache = helperCache || settings.helpers;
        newProps.helpers = extendIfExists(this.props.helpers, helperCache);
      }

      /*
       * For any expected context values,
       * grab them and drop them in.
       */
      if (expectedContext) {
        expectedContext.forEach(name => {
          newProps[name] = this.context[name];
        });
      }

      /*
       * Merge the inherited props and the new props and cache
       * them locally so that handlers will have access to them.
       */
      Object.assign(propCache, this.props, newProps);
      return propCache;
    }

    /**
     * Renders the component's output.
     * If we have a proxy component, instantiate it for type checking.
     */
    render() {
      const props = this.genProps();
      proxyComponent && React.createElement(proxyComponent, props);
      return (settings.render || noop)(this.genProps());
    }
  }

  /*
   * If we have any lifecycle methods, add them to the
   * component.
   */
  if (settings.createLifecycle) {
    const lifecycle = settings.createLifecycle();
    buildLifecycle(Component.prototype, lifecycle || {});
  }


  /*
   * Make sure our component has access to all of the
   * context properties it needs and return it.
   */
  Component.displayName = Component.name;
  attachContextTypes(Component, expectedContext);
  return Component;
}

/**
 * Allow users to generate components.
 * 
 * @param {Object|Function} settings  Describes how the component should work.
 * 
 * @return {Component}
 */
function component(settings) {
  let Component = createBasicComponent(settings);

  /*
   * A state must exist if we want to render this component, if
   * it wants to use a manually-named state, or if it wants to
   * create state transformation rules. In that case, we'll
   * robustify this component by subscribing it to a state.
   */
  if (settings.el || settings.state || settings.createRules || settings.childContext) {
    Component = robustifyComponent(Component, settings)
  }

  /*
   * If we want to render this state and the window object exists,
   * go ahead and render it into the named root.
   */
  if (settings.el && typeof window !== 'undefined') {
    ReactDOM.render(<Component />, document.querySelector(settings.el));
  }

  return Component;
}

export default component;
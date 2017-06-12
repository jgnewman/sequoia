'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Preload = exports.Pick = exports.Otherwise = exports.When = exports.Redirect = undefined;

var _react = require('react');

var _data = require('./data');

var _utils = require('./utils');

var _routing = require('./routing');

var _component = require('./component');

var NON_NATIVE_PROPS = ['location', '__dataSymbol'];

/**
 * A component for redirecting our path.
 */
var Redirect = exports.Redirect = (0, _component.component)(function () {
  return function (props) {
    if (!props.to) {
      _utils.win.location.href = '/';
    } else if (props.to[0] === '#') {
      _utils.win.location.hash = props.to;
    } else {
      _utils.win.location.href = props.to;
    }
    return null;
  };
});

/**
 * A component for rendering children under some condition.
 */
var When = exports.When = (0, _component.component)(function (kit) {
  return function (props) {

    /*
     * Throw an error if props are malformed.
     */
    var vetted = props.preVet || (0, _routing.vetProps)(props, kit, this.context[_utils.INTERNALS.LOC_REF]);

    /*
     * If the props didn't resolve in a way that would allow
     * rendering children, don't render any.
     */
    if (!vetted.resolves) {
      return null;

      /*
       * If we had a successful resolution...
       */
    } else {

      /*
       * If we have actual children. Render out the child.
       */
      if (vetted.hasChildren) {

        var childIsNativeDom = typeof props.children.type === 'string' && /^[a-z]/.test(props.children.type);
        var propsToRemove = ['component', 'preVet'].concat(vetted.exclusives);

        if (childIsNativeDom) {
          propsToRemove = propsToRemove.concat(NON_NATIVE_PROPS);
        }

        return React.cloneElement(props.children, (0, _utils.removeProps)(props, propsToRemove), props.children.props.children);

        /*
         * Othwerwise, render an instance of the component named in the
         * `component` prop.
         */
      } else {
        var componentProps = props.with || {};
        return !props.component ? null : React.createElement(props.component, props.with, props.children);
      }
    }
  };
});

/**
 * A wrapper over the `When` component that always tests truthily.
 * It can only be instantiated as the child of a `Switch` instance.
 *
 * @param {Object} props The component props.
 */
var Otherwise = exports.Otherwise = (0, _component.component)(function () {
  return function (props) {
    if (!props.preVet) {
      throw (0, _utils.createError)('\n          The `Otherwise` component can only be used as a child of the\n          `Switch` component. Otherwise it\'s redundant.\n        ');
    } else {
      var cleanProps = (0, _utils.removeProps)(props, props.preVet.exclusives);
      var newProps = (0, _utils.merge)(cleanProps, { ok: true });
      return React.createElement(When, newProps, props.children);
    }
  };
});

/**
 * Expects each child to be an instance of `When` or `Otherwise`. Selects the first truthy
 * child and renders that one.
 *
 * @param {Object} props The component props.
 */
var Pick = exports.Pick = (0, _component.component)(function (kit) {
  return function (props) {
    var _this = this;

    var chosen = null;
    var vetting = void 0;

    /*
     * Loop over the children and vet their props. Capture the first
     * one that successfully vets.
     */
    (0, _routing.arrayifyChildren)(props.children).some(function (child) {
      var vetted = (0, _routing.vetProps)(child.props, kit, _this.context[_utils.INTERNALS.LOC_REF], child.type === Otherwise);
      if (vetted.resolves) {
        chosen = child;
        vetting = vetted;
        return true;
      }
    });

    /*
     * Return a clone of the element so we don't need to vet it again.
     */
    return !chosen ? null : React.cloneElement(chosen, (0, _utils.merge)(chosen.props, { preVet: vetting }), chosen.props.children);
  };
});

/**
 * Writes pre-fetched data into the DOM.
 *
 * @param {Object} props The component props.
 */
var Preload = exports.Preload = (0, _component.component)(function () {
  return function (props) {

    /*
     * By default, render an empty object.
     */
    var toRender = "{}";

    /*
     * If we get data, pass it through if its a string or
     * stringify it if its an object.
     */
    if (props.data) {
      if (typeof props.data === 'string') {
        toRender = props.data;
      } else {
        toRender = JSON.stringify(props.data);
      }
    }

    /*
     * Spit out a script tag.
     */
    return React.createElement('script', { dangerouslySetInnerHTML: { __html: 'window[\'' + _utils.INTERNALS.PRELOAD_REF + '\'] = ' + toRender } });
  };
});
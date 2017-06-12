import { Children } from 'react';

import { requestsPackage } from './data';
import { INTERNALS, removeProps, createError, win, merge } from './utils';
import { vetProps, arrayifyChildren } from './routing';
import { component } from './component';

const NON_NATIVE_PROPS = [
  'location',
  '__dataSymbol'
];

/**
 * A component for redirecting our path.
 */
export const Redirect = component(() => {
  return props => {
    if (!props.to) {
      win.location.href = '/';
    } else if (props.to[0] === '#') {
      win.location.hash = props.to;
    } else {
      win.location.href = props.to;
    }
    return null;
  }
})


/**
 * A component for rendering children under some condition.
 */
export const When = component(kit => {
  return function (props) {

    /*
     * Throw an error if props are malformed.
     */
    const vetted = props.preVet || vetProps(props, kit, this.context[INTERNALS.LOC_REF]);

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

        const childIsNativeDom = typeof props.children.type === 'string' && /^[a-z]/.test(props.children.type);
        let propsToRemove = ['component', 'preVet'].concat(vetted.exclusives);

        if (childIsNativeDom) {
          propsToRemove = propsToRemove.concat(NON_NATIVE_PROPS);
        }

        return React.cloneElement(
          props.children,
          removeProps(props, propsToRemove),
          props.children.props.children
        )


      /*
       * Othwerwise, render an instance of the component named in the
       * `component` prop.
       */
      } else {
        const componentProps = props.with || {};
        return !props.component ? null : React.createElement(
          props.component,
          props.with,
          props.children
        );
      }
    }
  }
})


/**
 * A wrapper over the `When` component that always tests truthily.
 * It can only be instantiated as the child of a `Switch` instance.
 *
 * @param {Object} props The component props.
 */
export const Otherwise = component(() => {
  return props => {
    if (!props.preVet) {
      throw createError(
        `
          The \`Otherwise\` component can only be used as a child of the
          \`Switch\` component. Otherwise it's redundant.
        `
      );
    } else {
      const cleanProps = removeProps(props, props.preVet.exclusives);
      const newProps = merge(cleanProps, { ok: true });
      return React.createElement(When, newProps, props.children);
    }
  }
})


/**
 * Expects each child to be an instance of `When` or `Otherwise`. Selects the first truthy
 * child and renders that one.
 *
 * @param {Object} props The component props.
 */
export const Pick = component(kit => {
  return function (props) {
    let chosen = null;
    let vetting;

    /*
     * Loop over the children and vet their props. Capture the first
     * one that successfully vets.
     */
    arrayifyChildren(props.children).some(child => {
      const vetted = vetProps(child.props, kit, this.context[INTERNALS.LOC_REF], child.type === Otherwise);
      if (vetted.resolves) {
        chosen = child;
        vetting = vetted;
        return true;
      }
    });

    /*
     * Return a clone of the element so we don't need to vet it again.
     */
    return !chosen ? null : React.cloneElement(
      chosen,
      merge(chosen.props, { preVet: vetting }),
      chosen.props.children
    );
  }
})

/**
 * Writes pre-fetched data into the DOM.
 *
 * @param {Object} props The component props.
 */
export const Preload = component(() => props => {

  /*
   * By default, render an empty object.
   */
  let toRender = "{}";

  /*
   * If we get data, pass it through if its a string or
   * stringify it if its an object.
   */
  if (props.data) {
    if (typeof props.data === 'string') {
      toRender = props.data;
    } else {
      toRender = JSON.stringify(props.data)
    }
  }

  /*
   * Spit out a script tag.
   */
  return (
    <script dangerouslySetInnerHTML={{__html: `window['${INTERNALS.PRELOAD_REF}'] = ${toRender}`}}></script>
  )
})

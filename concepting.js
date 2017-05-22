import { appplication, component } from 'sequoiajs';

const Hello = component(kit => {

  kit.infuseActions((rules, reqs) => ({
    updateQux: rules.app.UPDATE_FOO,
    updateFoo: payload => ({ type: rules.app.UPDATE_FOO, payload: payload }),
    updateBar: payload => actions => actions.updateFoo(payload),
    updateBaz: payload => reqs.post('/api/conversations', payload)
  }))

  kit.infuseState(state => {
    foo: state.app.foo
  })

  kit.ensure({
    foo: kit.ensure.string.isRequired
  })

  return props => {
    return <div>Hola!</div>
  }

});

// Can't render an application inside another application.
// Application is different from component because it has a
// different kit designed for global configuration.
application(appKit => {

  // Where to render the app.
  appKit.renderIn('#app');

  appKit.config({
    stateMiddleware: [promiseWare], // renamed
    disableDevTools: false,
    disableAutoPersist: true,
    autoPersist: { // renamed
      keyPrefix: 'testapp'
      done: function () {} // moved and renamed
    }
  })

  appKit.createRules(namespace, {

    // If the ruleset has a DEFAULT property, we run it immediately.
    // This also gives you an ability to reset this namespace.
    DEFAULT: (update, state) => update(state, {
      foo: 'foo',
      bar: 'bar'
    }),

    // All rules get an updater, a copy of the current namespace, and
    // the payload that came in with the action.
    UPDATE_FOO: (update, state, payload) => {
      update(state, { foo: payload || 'defaultValue' })
    }
  })

  // Because this is an `application`, we may want to defer render until some
  // config stuff is done.
  return () => {
    return <div>Hello, world!</div>
  }

})

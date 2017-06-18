import { component, transformState, beforeInitialState } from 'sequoia';

const someState = createState(
  JSON.parse(
    localStorage.getItem('state') || '{}'
  )
);

state.beforeTransform(newValues => {
  localStorage.setItem('state', JSON.stringify(newValues))
})


component({

  // Optional String.
  // Indicates the component's name.
  // Should show up in React dev tools.
  name: 'Application',

  // Optional String.
  // Should render component into the named element.
  // Should throw error if component lives in an already-rendered nesting.
  el: '#app',

  // Optional.
  // If provided, should use the provided state.
  // Purpose -> allows you to hook otherwise separate apps up to the same state
  state: someState,

  // Optional.
  // Should generate event handlers that have access to a pack of...
  // - event
  // - props
  // - refs
  handlers: {
    handleClick (pack, ...extras) {
      pack.evt.preventDefault();
      pack.props.rules.updateName('foo');
    }
  },

  // Optional.
  // Should attach proptypes to the component.
  ensure(types) {
    return {
      name: types.string.isRequired
    }
  },

  // Optional.
  // Should return an object of functions.
  // Should generate props from returned functions.
  // Generated functions should transform state when called.
  //
  // If no state provided && state in context, should use state in context.
  // If no state provided && !state in context, should create a new state.
  createRules(state, http) {
    return {
      initial: () => {
        if (state.isEmpty('app')) {
          state.update('app', { foo: 'bar' })
        }
      },
      updateName: newName => state.update('app', { name: newName }),
      thunk: function (data) {
        this.initial();
        this.updateName();
      },
      fetch: () => {
        http.get('/api/my-data').then(data => {
          state.update('app', { data: data })
        })
      }
    }
  },

  // Optional.
  // Should return a submap of the state.
  // Should generate props from returned values.
  // Should assume state is generated further up the chain.
  observe(state) {
    return {
      name: state.app.name
    }
  },

  // Optional.
  // Should return an object of extra props to add to this component.
  // Should cache these.
  helpers: {
    upperFoo: props => props.foo.toUpperCase()
  },

  // Optional.
  // Should add items in the returned object to child context.
  // Should auto-infer proptypes.
  childContext: {
    contextProp: 'something'
  },

  // Optional.
  // Should create new component props.
  // Should map from the context.
  // Should not display @@ items in provided context.
  // Should auto-infer proptypes.
  contextProps: ['contextProp'],

  // Required.
  // Should return instances of additional components.
  render(props) {
    return (
      <div>{props.hello}</div>
    )
  }
})

/*
TODO:
- [x] should rules be in a package? probably
- [x] handlers
- [x] handlers.with
- [x] cache handlers
- [x] prop types
- [x] referencer
- [x] partition state
- [x] thunk actions, lol just don't use an arrow, use `this`
- [x] state persistence
- [x] custom props
- [x] data layer, just pass axios through and let user call state.update
- [x] collections
- [x] routing
- [x] render prevention
- [x] lifecycle
- [x] is reduce the right name?
- [x] should handlers be inside a function?
- [x] forget view methods. we want to allow arrow functions.
- [x] should _probably_ provide access to context in some way
- [x] can we pass a class to when/choose and have it auto-instantiate? (update readme)
- [x] enable dev mode for state logging
- [x] make sure isomorphism works
  - [x] rendertostring, rendertostaticmarkup
  - [x] preloader
- [x] make sure hash works when empty like `when.hash('#')`
- [x] write tests
- [x] write todomvc
- [ ] components not updating on hash change apparently
- [x] when handlers cache props, all instances of that component will get the props from the instance that cached the handlers
*/

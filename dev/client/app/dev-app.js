import {
  application,
  component,
  collect,
  Switch,
  When,
  Otherwise
} from '../../../bin/index';
import promiseWare from 'redux-promise'


const Hello = component(kit => {

  kit.ensure({
    helloWorld: kit.ensure.string.isRequired
  })

  kit.infuseState(state => ({
    helloWorld: state.section1.helloWorld
  }))

  kit.infuseHandlers({
    handleClick: (evt, props) => {
      console.log('handling event')
      console.log(props.ref.get('umbrellaDiv'))
      //props.actions.updateGreeting('Goodbye, world!')
      //props.actions.example()
    }
  })

  kit.infuseActions((rules, reqs) => ({
    updateGreeting: rules.section1.UPDATE_GREETING,
    example: () => reqs.get('MY_DATA', '/')
  }))

  return (props) => {
    return (
      <div ref={props.ref('umbrellaDiv')}>
        <div onClick={props.handlers.handleClick}>{props.helloWorld}</div>
        <Switch>
          <When ok={kit.data.ok('MY_DATA')}>
            <div>{kit.data.value('MY_DATA')}</div>
          </When>
          <Otherwise>
            <div>Nothing to see here, boss.</div>
          </Otherwise>
        </Switch>
      </div>
    )
  }

})


const App = application(appKit => {

  appKit.renderIn('#app')

  appKit.config({
    stateMiddleware: [promiseWare],
    disableDevTools: false,
    disableAutoPersist: true,
    autoPersist: {
      keyPrefix: 'testapp',
      done: function () {}
    }
  })

  appKit.createRules('section1', {
    DEFAULT: (update, state) => update(state, {
      helloWorld: 'Hello, world!',
      bar: 'bar'
    }),
    UPDATE_GREETING: (update, state, payload) => update(state, {
      helloWorld: 'Goodbye, world!'
    })
  })

  appKit.createRules('section2', {
    DEFAULT: (update, state) => update(state, {
      baz: 'baz',
      qux: 'qux'
    })
  })

  return () => {
    return <Hello />
  }
})


// import {
//   component,
//   render,
//   reduce,
//   When,
//   dataRequest,
//   constants,
//   createConstant,
//   getConstantName,
//   Switch,
//   Otherwise,
//   uuid
// } from '../../../bin/index';
// import promiseWare from 'redux-promise'

// /*
//  * Create an app container component.
//  */
// const AppContainer = component(({ infuse, ensure, infuseActions, data }) => {
//
//   /*
//    * Name all the props to infuse into the component.
//    */
//   infuse({
//     actions: {
//       myActions: {
//         fooAAction: () => ({ type: constants.FOOA() }),
//         fooBAction: () => ({ type: constants.FOOB() }),
//         bazAction:  () => ({ type: constants.BAZ() })
//       }
//     },
//     binders: {
//       handlers: {
//         fooHandler: function () {}
//       }
//     },
//     modules: {
//       mod: {
//         fooMod: function () {}
//       }
//     },
//     state: state => ({
//       fooA: state.foo.a,
//       fooB: state.foo.b,
//       bar: state.bar
//     })
//   })
//
//   infuseActions('req', function () {
//     return dataRequest({
//       method: 'get',
//       url: '/',
//       id: constants.TEST_DATA()
//     })
//   })
//
//   /*
//    * Ensure all of the correct prop types are being met.
//    */
//   ensure({
//     fooA: ensure.number.isRequired,
//     fooB: ensure.number.isRequired,
//     bar: ensure.object.isRequired
//   })
//
//   /*
//    * Return the rendered, dumb component.
//    */
//   return props => {
//     const { myActions, req } = props;
//
//     // setTimeout(() => {
//     //   req()
//     //   setTimeout(() => {
//     //     console.log(data.value(constants.TEST_DATA()))
//     //     myActions.fooAAction();
//     //   }, 500)
//     // }, 10000)
//
//     console.log('rendering', props)
//     //console.log('---')
//     return (
//       <div>Hello, world!</div>
//     )
//   }
//
// })
//
// /*
//  * Render our application and initialize the store ALL AT THE SAME TIME
//  * Note that the Provider is handled implicitly.
//  */
// render(<AppContainer />, {
//   target: '#app',
//   constants: ['TEST_DATA', 'FOOA', 'FOOB', 'BAZ'],
//   stateConfig: {
//
//     initialState: {
//       foo: { a: 1, b: 1 },
//       bar: { c: 1, d: 1 }
//     },
//
//     reducers: {
//       foo: reduce((initialState, update) => (state=initialState.foo, action) => {
//         switch(action.type) {
//           case constants.FOOA():
//             return update(state, { a: state.a + 1})
//           case constants.FOOB():
//             return update(state, { b: state.b + 2})
//           default:
//             return state;
//         }
//       }),
//       bar: reduce(initialState => (state=initialState.bar, action) => state)
//     },
//
//     // Optional config
//     middleware: [promiseWare],
//     disableDevTools: false,
//     disableAutoPersist: true,
//     autoPersistConfig: {
//       keyPrefix: 'testapp'
//     },
//     autoPersistDone: function () {}
//   }
// })


// console.log(uuid())
// const App = component(() => {
//   return () => <div>Hello, app 1!</div>
// })
// render(<App />, { target: '#app' })
//
// const App2 = component(() => {
//   return () => <div>Hello, app 2!</div>
// })
// render(<App2 />, { target: '#app2' })


// const Hello = component(tools => props => {
//   return <div>Hello, world!</div>
// })
// const Goodbye = component(tools => props => <div>Goodbye, cruel world!</div>)
// const Outer = component(tools => props => {
//   return (
//     <Switch>
//       <When subHash="/foo" component={Hello} />
//       <Otherwise component={Goodbye} />
//     </Switch>
//   )
// })
// render(<Outer />, { target: '#app' })


// render(<When ok={true}><div>Hello</div></When>, { target: '#app' })


// const Hello = component(({ referencer }) => {
//   return () => {
//     const ref = referencer()
//     return (
//       <div>
//         <div className={uuid()} ref={ref.capture('myDiv')}>Hello</div>
//         <div onClick={() => ref.getAsync('myDiv', 300, myDiv => console.log(myDiv))}>Click Me</div>
//       </div>
//     )
//   }
// })
//
// render(
//   <div>
//     <Hello />
//     <Hello />
//   </div>,
//   {
//     target: '#app2'
//   }
// )

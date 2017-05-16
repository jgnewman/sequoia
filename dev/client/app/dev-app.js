import {
  component,
  render,
  reduce,
  When,
  dataRequest,
  constants,
  createConstant,
  getConstantName,
  Switch,
  Otherwise,
  uuid
} from '../../../bin/index';
import promiseWare from 'redux-promise'

// /*
//  * Create an app container component.
//  */
// const AppContainer = component(({ infuse, ensure, infuseActions }) => {
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
//     const { myActions, req, data } = props;
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


const Hello = component(tools => props => {
  // console.log(props)
  return <div>Hello, world!</div>
})
const Goodbye = component(tools => props => <div>Goodbye, cruel world!</div>)
const Outer = component(tools => props => {
  return (
    <Switch>
      <When isTrue={props.location.get().hash === '#foo'} component={Hello} />
      <Otherwise component={Goodbye} />
    </Switch>
  )
})
render(<Outer />, { target: '#app' })


// const Hello = component(() => {
//   return ({ capture }) => {
//     const ref = capture()
//     return (
//       <div>
//         <div className={uuid()} ref={ref('myDiv')}>Hello</div>
//         <div onClick={() => console.log(ref.myDiv())}>Click Me</div>
//       </div>
//     )
//   }
// })
//
// render(
//   <div>
//     <Hello />
//     <Hello />
//   </div>, {
//     target: '#app2'
//   })

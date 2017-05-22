import {
  application,
  component,
  collect,
  Switch,
  When,
  Otherwise,
  uuid,
  merge
} from '../../../bin/index';
import promiseWare from 'redux-promise'

const Whatever = component(kit => {
  kit.infuseHandlers({
    whatever: () => {},
  })
  kit.infuseActions(rules => ({
    whatever: rules.section1.UPDATE_GREETING
  }))
  return props => {
    // console.log(props);
    return <div></div>
  }
})

const Hello = component(kit => {

  kit.ensure({
    helloWorld: kit.ensure.string.isRequired
  })

  kit.infuseState(state => {
    return {
      helloWorld: state.section1.helloWorld
    }
  })

  kit.infuseHandlers({
    handleClick: (evt, props, extra) => {
      console.log('handling event', evt, props, extra)
      console.log(props.ref.get('umbrellaDiv'))
      // props.actions.dispatcher()
      //props.actions.example()
    }
  })

  kit.infuseActions((rules, reqs) => ({
    updateGreeting: rules.section1.UPDATE_GREETING,
    dispatcher: () => (actions) => {
      actions.updateGreeting()
    },
    example: () => reqs.get('MY_DATA', '/')
  }))

  return (props) => {
    return (
      <div ref={props.ref('umbrellaDiv')}>
        <div onClick={props.handlers.handleClick.with('foo')}>{props.helloWorld}</div>
        <Switch>
          <When ok={kit.data.ok('MY_DATA')}>
            <div>{kit.data.value('MY_DATA')}</div>
          </When>
          <Otherwise>
            <div>Nothing to see here, boss.</div>
          </Otherwise>
        </Switch>
        <Whatever handlers={props.handlers} actions={props.actions}/>
      </div>
    )
  }

})


const App = application(appKit => {

  appKit.renderIn('#app')

  appKit.config({
    stateMiddleware: [promiseWare],
    disableDevTools: false, // default
    disableAutoPersist: false, // default
    autoPersist: {
      disableRenderDelay: false, // default
      keyPrefix: 'testapp',
      done: function () {}
    }
  })

  appKit.createRules('section1', {
    DEFAULT: state => merge(state, {
      helloWorld: 'Hello, world!',
      bar: 'bar'
    }),
    UPDATE_GREETING: (state, payload) => merge(state, {
      helloWorld: 'Goodbye, world!'
    })
  })

  appKit.createRules('section2', {
    DEFAULT: state => merge(state, {
      baz: 'baz',
      qux: 'qux'
    })
  })

  return () => {
    return <Hello />
  }
})


const App2 = application(appKit => {

  appKit.renderIn('#app2')

  return () => <div>This is a second app on the same page!</div>

})

import {
  application,
  component,
  collect,
  Pick,
  When,
  Otherwise,
  uuid,
  merge,
  pick,
  when
} from '../../../bin/index';
import promiseWare from 'redux-promise'

const Basic = component(() => props => {
  return <div>{props.message}</div>
})

const Whatever = component(kit => {

  kit.createHandlers({
    whatever: () => {},
  })

  kit.createActions(rules => ({
    whatever: rules.section1.UPDATE_GREETING
  }))

  return pick(
  
    when.ok(true, () => (
      <Basic message="oi m8" />
    )),
    
    () => <Basic message="oi m9" />

  )
})

const Hello = component(kit => {

  kit.ensure({
    helloWorld: kit.ensure.string.isRequired
  })

  kit.observe(state => ({
    helloWorld: state.section1.helloWorld
  }))

  kit.createHandlers({
    handleClick: (evt, props, extra) => {
      console.log('handling event', evt, props, extra)
      console.log(props.ref.get('umbrellaDiv'))
      props.actions.dispatcher()
      //props.actions.example()
    }
  })

  kit.createActions((rules, reqs) => ({
    updateGreeting: () => ({ rule: rules.section1.UPDATE_GREETING }),
    dispatcher: () => (actions, getState) => {
      console.log(getState())
      actions.updateGreeting()
      actions.example()
    },
    example: () => reqs.get('MY_DATA', '/')
  }))

  return (props) => {
    return (
      <div ref={props.ref('umbrellaDiv')}>
        <div onClick={props.handlers.handleClick.with('foo')}>{props.helloWorld}</div>
        <Pick>
          <When dataOk={'MY_DATA'}>
            <div>Some data: {kit.data.value('MY_DATA')}</div>
          </When>
          <Otherwise>
            <div>Nothing to see here, boss.</div>
          </Otherwise>
        </Pick>
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

  return <Hello />
})


const App2 = application(appKit => {

  appKit.renderIn('#app2')

  return () => (
    <div>
      This is a second app on the same page!
      <When params={{foo: 'bar'}}>
        <span>Params successfully detected!</span>
      </When>
    </div>
  )

})


/*

pick(
  
  when.ok(true, () => (
    <Basic message="oi m8" />
  )),
  
  () => <Basic message="oi m9" />

)

*/
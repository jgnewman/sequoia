import {
  enableDevMode,
  createState,
  component,
  pick,
  when
} from '../../../bin/index';

when.hash('#').then(() => console.log('hash is #'))

enableDevMode();

const ListItem = component({
  handlers: {
    clickHandler: ({ props }) => {
      console.log('The id is', props.id)
    }
  },
  render(props) {
    return (
      <li onClick={props.handlers.clickHandler}>
        My id is {props.id}
      </li>
    )
  }
})

const List = component({
  render() {
    return (
      <ul>
        <ListItem id={1} />
        <ListItem id={2} />
      </ul>
    )
  }
})

const Inner = component({
  name: 'Inner',
  contextProps: ['ctxFoo'],
  render(props) {
    return (
      <div>
        <div>{props.ctxFoo}</div>
        <div>{props.text}</div>
        <a onClick={props.handlers.handleClick.with('foo')}>
          <strong>Click me</strong>
        </a>
        {when.hash('#').then(List)}
      </div>
    )
  }
})

const App = component({

  name: 'Application',
  
  el: '#app',

  state: createState(
    JSON.parse(localStorage.getItem('state') || 'null') || {
      app: {
        firstName: 'John',
        lastName: 'Newman'
      }
    }
  ).beforeTransform(newValues => {
    localStorage.setItem('state', JSON.stringify(newValues))
  }),

  childContext: {
    ctxFoo: 'I am in the context!'
  },
  
  observe: state => ({
    firstName: state.app.firstName,
    lastName: state.app.lastName
  }),
  
  createRules: (state, http) => ({

    initial: function () {
      http.get('/').then(res => console.log(res)).catch(err => console.log(err))
    },
    
    johnize: () => state.update('app', {
      firstName: 'John',
      lastName: 'Newman'
    }),
    
    calvinize: () => state.update('app', {
      firstName: 'Bill',
      lastName: 'Waterson'
    })

  }),

  ensure: types => ({
    firstName: types.string.isRequired,
    lastName: types.string.isRequired
  }),

  handlers: {
    
    handleClick: (pack, foo) => {
      pack.props.helpers.custom()
      console.log(foo);
      if (pack.props.firstName === 'John') {
        pack.props.rules.calvinize()
      } else {
        pack.props.rules.johnize()
      }
    },
    
    handleClickName: (pack) => {
      console.log(pack.refs.myDiv)
    }

  },

  helpers: {
    custom: () => console.log('custom prop worked')
  },

  createLifecycle: () => ({
    afterMount: (props) => console.log('mounted', props)
  }),
  
  render: props => {
    return (
      <div ref="myDiv" onClick={props.handlers.handleClickName}>
        <Inner
          text={props.firstName + ' ' + props.lastName}
          rules={props.rules}
          handlers={props.handlers}
        />
        {when.ok(true).then(() => 'Ok was true!')}
        {pick(
          when.ok(false).choose(() => 'I should be ignored.'),
          when.ok(true).choose(() => 'I should show up!')
        )}
      </div>
    )
  }
})
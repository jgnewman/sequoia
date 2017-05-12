# Sequoia

**SEQUOIA IS CURRENTLY AN ALPHA TECHNOLOGY, STILL IN ACTIVE DEVELOPMENT. USE AT YOUR OWN RISK.**

[![Build Status](https://travis-ci.org/jgnewman/sequoia.svg?branch=master)](https://travis-ci.org/jgnewman/sequoia)

Sequoia is a full-featured JavaScript application framework. It's powered by React and common React-based tools but you can quickly learn Sequoia without having ever touched React in your life. By the same token, it's similar enough to standard React techniques that, if you are already familiar with React best practices, migrating to a Sequoia mindset can be done extremely quickly.

## How It Works

A Sequoia app is a combination of 3 main pieces: composable components, application state, and restful data. You get all of this simply by including Sequoia in your build. There is no need to install multiple disjointed tools.

In it's simplest form, a Sequoia app looks like this:

```jsx
import { component, render } from 'sequoia';

const App = component(() => {
  return () => <div>Hello, world!</div>
})

render(<App />, { target: '#app' })
```

As you can see, Sequoia makes use of React's ["JSX"](https://facebook.github.io/jsx/) dialect. It allows you to think of your components in terms of how they will be rendered into the DOM and is therefore quite convenient.

The above application will create a component called "App" that renders a single div. The `render` function creates an instance of that component and renders it inside a pre-existing DOM element with the id "app".

### Composing Components

In order to illustrate the power of component-based architecture, let's add 1 more level of complexity to the above application.

```jsx
import { component, render } from 'sequoia';

const TextBlock = component(() => {
  return props => <div className="text-block">{props.text}</div>
})

const App = component(() => {
  return () => <TextBlock text="Hello, world!" />
})

render(<App />, { target: '#app' })
```

This version of the application produces the same effect, but this time we're nesting our components. Notice that the `TextBlock` component returns a function that renders out a `div`. However, rather than hard-coding in the text that appears inside the div, we're pulling it from an argument object called `props`. In the `App` component, we render out an instance of `TextBlock` and populate its `props.text` property when we specify `text="Hello, world!"`. In this way, everything that looks like an HTML attribute becomes a property in that component's `props` object.

### Assurances About Props

It may not be immediately clear why each component takes the form of a function returning another function. The reason why is because the top-level function has access to some useful tools that will help you shape your component. For now we'll talk about a tool called `ensure`.

In the case of our `TextBlock` component from above, there's always a risk that we might create an instance of that component, and forget to provide a "text" prop. The `ensure` tool will help us catch those kinds of mistakes. Here's how we might use it in our `TextBlock` component:

```jsx
const TextBlock = component(({ ensure }) => {

  ensure({
    text: ensure.string.isRequired
  })

  return props => <div className="text-block">{props.text}</div>
})
```

In this case, we've used `ensure` to guarantee that every time this component is instantiated, it will have a prop called "text" taking the form of a string. If that doesn't happen, we'll get a useful error about it in the console.

This constitutes the basics of component composition in Sequoia. If you are already familiar with React, you should know that Sequoia components generate stateless React components 100% of the time. Because Sequoia provides built-in state management, you are disallowed from shooting yourself in the foot via component state.

### State Management

Every Sequoia application has the option of being supported by a single, global state object. Rather than trying to spaghetti together strange ways for components to communicate with each other and share data, all components will store data on the state and the state will pass that data down as props to all components that need it. Whenever those props update, the components will automatically re-render.

You can customize the global state by including a `stateConfig` option upon render.

```jsx
import { render } from 'sequoia';
import App from './App';

render(<App />, {
  target: '#app',
  stateConfig: { ... }
})
```

Some of Sequoia's internal functionality automatically makes use of the global state. However, if we want to really use the global state to our benefit, we will need to configure it. To do that, we'll need to define 2 things: the shape of the initial, blank state and the rules for modifying it.

An initial state should be divided up into sections that correspond to the major pieces of your application. For example, if your application has a few pages, you might create a section on your initial state to correspond to each page. To illustrate...

```javascript
const initialState = {

  usersPage: {
    userList: [],
    activeUser: null
  },

  documentsPage: {
    documentList: []
  },

  settingsPage: {
    allowSavingDocuments: false
  }

}
```

You can then tell your components to observe these values and update when they change by using the `infuseState` component tool:

```jsx
const App = component(({ infuseState }) => {

  infuseState(state => ({
    userList: state.usersPage.userList
  }))

  return props => (
    <ul>
      {props.userList.map((user, index) => {
        return <li key={index}>{user.name}</li>
      })}
    </ul>
  )

})
```

In this example, the `App` component renders out an `li` for each object in a list of users. Because our user list is empty in its initial state, we won't get any list items. However, we are planning on adding users to that list (maybe as a result of a data fetch). By using `infuseState`, we are creating component props that observe and correspond to state values. In this case, we've created a prop that corresponds to the `state.usersPage.userList` value. This way, whenever the value on the state is updated with some user objects, our component will automatically re-render and some `li`s will show up on the screen – all because we modify the state and our components respond "reactively".

Now that we understand what the state object is, let's add it to our application configuration:

```jsx
import { render } from 'sequoia';
import initialState from './initialState';
import App from './App';

render(<App />, {
  target: '#app',
  stateConfig: {
    initialState: initialState, // <- Add the initial state here
    // More stuff will go here...
  }
})
```

Now that we have our initial state defined and hooked in to our App component, let's define the rules for modifying the state.

#### Modifying State

Our application state will be modified by running functions called "reducers" which are essentially just big `switch` statements defining how the state can be transformed under different conditions. We'll want to create a reducer for every section in our initial state. The state object itself should be immutable so the result of any reducer function will be a **NEW** state object with properties copied over from the previous state and modified as necessary.

Each state transformation (or, `case` in our reducer function) should be uniquely named. These names are called "action types" and most people will identify them using strings in all caps. We'll get to triggering these action types in a moment but, for now, let's create an example reducer that will let us add some users to our user list array:

```javascript
import { reduce } from 'sequoia';

// Call the `reduce` function, giving us access to initial state
const usersPageReducer = reduce(initialState => {

  // Return the reducer function, taking a state section and an action.
  // Once we add this reducer to our application config, the
  // result will become the new value for `state.usersPage`
  return (usersPage=initialState.usersPage, action) => {

    switch (action.type) {

      // When we get the `ADD_USERS` action type, it should carry a list of
      // user objects with it. Here, we'll create a new object and
      // copy over our state values, overwriting `userList` with our
      // new list of users.
      case 'ADD_USERS':
        return Object.assign({}, usersPage, {
          userList: action.newUsers
        })

      // If none of our action types were matched, we won't
      // modify the state.
      default:
        return usersPage;
    }
  }
})
```

Once our reducers are written, we can add them to our state config:

```jsx
render(<App />, {
  target: '#app',
  stateConfig: {
    initialState: initialState,
    reducers: {
      usersPage: usersPageReducer,
      documentsPage: documentsPageReducer,
      settingsPage: settingsPageReducer
    }
  }
})
```

#### Triggering Action Types

To trigger an action type, we'll need function. Functions that trigger action types are called "actions" themselves. In order to work properly, an action function had to return an object containing at least 1 key: `type`, which names the action type to be triggered. So an example action function that matches our `ADD_USERS` reducer case could look like this:

```javascript
function addUsers() {
  return {
    type: 'ADD_USERS',
    newUsers: [ {name: 'Sandy'}, {name: 'Carrington'} ]
  }
}
```

Based on the reducer we already wrote, the `type` key will cause the case to match and the `newUsers` list will replace the current `userList` on the state object.

To wire this normal-looking function up to the state, we need to use the `infuseActions` component tool. This will turn our function into a component prop that, when executed, will trigger an action type on the state.

```jsx
const App = component(({ infuseState, infuseActions }) => {

  // Turn `state.userList` into a prop on the component.
  infuseState(state => ({
    userList: state.usersPage.userList
  }))

  // Turn the `addUsers` function into a prop that triggers
  // a reducer action.
  infuseActions({
    addUsers: addUsers
  })

  return props => (
    <div>
      <a onClick={props.addUsers}>Click me to add users!</a>
      <ul>
        {props.userList.map((user, index) => {
          return <li key={index}>{user.name}</li>
        })}
      </ul>
    </div>
  )

})
```

In this example, the state's `userList` property is being observed by our component via `infuseState`. We begin with an empty user list on the state and therefore will not see any `li` elements on the screen. However, we've created an `addUsers` function that creates 2 user objects and we've converted it into an action via `infuseActions`. When the `a` tag is clicked, that action will be triggered and 2 user objects will be injected into the state. In response, our component will automatically notice this change and re-render itself, thus spitting out two `li` elements onto the screen.

#### Summing Up State

If you are familiar with common React/Redux architecture, this will all make perfect sense to you. If not, it may feel a bit new. If that's the case, here is a brief conclusion tying everything together:

The general idea is that all of your application state is stored in one place. Components observe values on the state and pass those values down to their nested children. Whenever observed values change, all components using them will automatically update. To change those values, we infuse action functions into our components that, when called, will pass new values into reducers which dictate the rules for updating the state..


### Working With Data

Sequoia uses [axios](https://github.com/mzabriskie/axios) for HTTP requests. So as we get into making requests, you can refer to the documentation for axios' [request config](https://github.com/mzabriskie/axios#request-config) for an exhaustive list of options.

HTTP requests in Sequoia are tied into the state flow. To make them, you'll create actions. When you trigger those actions, the data will flow into the global state. Each component comes pre-packaged with a prop called `data` that provides an API for working with data that may or may not exist yet on the state.

Before we get into the data specifically, we need to go over the concept of "thunk actions". As you know, a normal action looks something like this:

```javascript
function myAction() {
  return {
    type: 'ACTION_TYPE'
  }
}
```

However, you have the option of making your actions more powerful by having them return functions instead of objects. These new functions are called "thunks". For example:

```javascript
function myAction() {
  return dispatch => {
    dispatch({ type: 'FIRST_ACTION' })
    dispatch({ type: 'SECOND_ACTION' })
    dispatch({ type: 'THIRD_ACTION' })
  }
}
```

Thunk actions have the effect of sending multiple normal actions to the state. Specifically, you will be able to send an action to the state with every call to `dispatch`. This is also great for asynchronous scenarios:

```javascript
function myAction() {
  return dispatch => {
    setTimeout(() => {
      dispatch({ type: 'MY_ACTION' })
    }, 1000)
  }
}
```

Because HTTP requests are asynchronous, Sequoia provides you with some pre-built thunks for fetching data. Each one will make a request and mark the state with a value indicating that a request is pending. Then, once the request completes, it will mark that on the state as well. It will also place the returned data on the state, or the returned error if the request failed.

To create an action that fetches a hypothetical list of user objects, for example, we might do something like this:

```javascript
import { dataRequest } from 'sequoia';

function getUsers() {
  return dataRequest({
    id: 'USER_LIST',
    method: 'get',
    url: '/api/users'
  })
}
```

We could also shortcut it like this:

```javascript
import { getData } from 'sequoia';

function getUsers() {
  return getData('USER_LIST', '/api/users')
}
```

The `id` property on our request thunk determines how we will access the actual data using the `data` prop. Let's look at a more fleshed out example by modifying our previously-defined `App` component.

```jsx
import { component, getData, render } from 'sequoia';

// Create a data-fetching function.
function getUsers() {
  return getData('USER_LIST', '/api/users')
}

// Create a component.
const App = component(({ infuseActions }) => {

  // Turn our data fetcher into an action prop on the component.
  infuseActions({
    getUsers: getUsers
  })

  // Pull the data api and our action into the render function.
  return ({ data, getUsers }) => (
    <div>

      {/* When a user clicks this `a` tag, the data is fetched. */}
      <a onClick={getUsers}>Click me to add users!</a>

      {
        (() => {

          {/* Check to see if `USER_LIST` has successfully completed. */}
          if (data.ok('USER_LIST')) {
            return (
              <ul>

                {/* Grab the actual data and loop over it. */}
                {data.value('USER_LIST').map((user, index) => {
                  return <li key={index}>{user.name}</li>
                })}
              </ul>
            )

          } else {

            {/* Don't make a `ul` until we have data. */}
            return <div>No users yet!</div>

          }
        })()
      }


    </div>
  )

})

// And of course, let's render the app.
render(<App />, { target: '#app' })
```

### Safety In Constants

One thing we ought to consider is that with all of these state actions and data manipulations, there are a lot of strings involved and with that comes an increased risk of error via typo.

One way around this is to use Sequoia's built-in system for handling constants. To do that, start by specifying a list of application-wide constants when you render the app into the DOM:

```jsx
render(<App />, {
  target: '#app',
  constants: [ 'USER_LIST' ]
})
```

Next, wherever you'd like to use one of these constants, import it and call it like a function:

```jsx
import { component, getData, render, constants } from 'sequoia';

function getUsers() {
  // Let's identify this data thunk with a constant instead of a string.
  return getData(constants.USER_LIST(), '/api/users')
}

const App = component(({ infuseActions }) => {

  infuseActions({
    getUsers: getUsers
  })

  return ({ data, getUsers }) => (
    <div>

      <a onClick={getUsers}>Click me to add users!</a>

      {
        (() => {

          {/* Now we can reference the data with a constant as well */}
          if (data.ok(constants.USER_LIST())) {

            return (
              <ul>
                {data.value(constants.USER_LIST()).map((user, index) => {
                  return <li key={index}>{user.name}</li>
                })}
              </ul>
            )

          } else {
            return <div>No users yet!</div>

          }
        })()
      }


    </div>
  )

})
```

Using this technique is nice because if you ever make a spelling mistake, you'll get an error in the console rather than unexpected `undefined` references in your application.

There are a couple of caveats though.

Because your constants are created upon render, they won't be available if you try to use them somewhere _before_ actually rendering the app. In other words, your constants will be available within your components' render functions, but not outside of them. They will also be available within any functionality that runs post-render such as within event handlers or within triggered actions.

If you need to circumvent this and manually create some constants, you can do that with the `createConstant` function:

```javascript
import { createConstant, constants } from 'sequoia';

const FOO = createConstant('FOO');

const ALSO_FOO = constants.FOO();

FOO === ALSO_FOO // <- true
```

Please note that Sequoia's constants are symbols and not strings. As such, they are not serializable. If you need to retrieve the constant's string name, you can use the `getConstantName` function:

```javascript
import { createConstant, getConstantName } from 'sequoia';

const FOO = createConstant('FOO');

getConstantName(FOO) // <- 'FOO'
```

# Sequoia

**SEQUOIA IS CURRENTLY AN ALPHA TECHNOLOGY, STILL IN ACTIVE DEVELOPMENT. USE AT YOUR OWN RISK.**

[![Build Status](https://travis-ci.org/jgnewman/sequoia.svg?branch=master)](https://travis-ci.org/jgnewman/sequoia)

Sequoia is a full-featured JavaScript application framework. It's powered by React and common React-based tools but you can quickly learn Sequoia without having ever touched React in your life. By the same token, it's similar enough to standard React techniques that, if you are already familiar with React best practices, migrating to a Sequoia mindset can be done extremely quickly.

## Why?

Because the "right way" to structure a scalable React app is arduous. For many would-be users, the sheer amount of independent tools that have to be pulled in and strung together in various ways can present a significant barrier to entry.

Sequoia seeks to provide a single, installable library that assembles each of the best tools in a form that feels like they were all written together, with exponentially less time spent by you learning how to connect components to react-redux, combine reducers, create and dispatch redux thunk actions, etc. Instead, you can pick up Sequoia and get all of those benefits in a single, simple, clean, intuitive package.

## How It Works

A Sequoia app is a combination of 3 main pieces: composable components, application state, and restful data. You get all of this simply by including Sequoia in your build. There is no need to install multiple disjointed tools.

In it's simplest form, a Sequoia app looks like this:

```jsx
import { application } from 'sequoiajs';

application(appKit => {
  appKit.renderIn('#app');
  return () => (
    <div>Hello, world!</div>
  )
})
```

As you can see, Sequoia makes use of React's ["JSX"](https://facebook.github.io/jsx/) dialect. It allows you to think of your components in terms of how they will be rendered into the DOM and is therefore quite convenient.

The above snippet will create a full-fledged Sequoia app that renders a single div. The `renderIn` method tells the application to find the DOM element with the id "app" and render itself within that element.

### Composing Components

In Sequoia, your application is broken down into components – small packages of HTML and controlling code that can be instantiated and and nested within other components. In fact the call to `application` generates a component, but it's a special one, intended to live at the top level. To create all of your other components, you'll call the `component` function instead.

In order to illustrate the power of component-based architecture, let's add 1 more level of complexity to the above application.

```jsx
import { application, component } from 'sequoiajs';

const TextBlock = component(() => {
  return props => (
    <div className="text-block">{props.text}</div>
  )
})

application(appKit => {
  appKit.renderIn('#app');
  return () => (
    <TextBlock text="Hello, world!" />
  )
})
```

This version of the application produces the same effect, but this time we're nesting our components. Notice that the `TextBlock` component returns a function that renders out a `div`. However, rather than hard-coding in the text that appears inside the div, we're making it dynamic by pulling it from an argument object called `props`. In the application component, we render out an instance of `TextBlock` and populate its `props.text` property by specifying `text="Hello, world!"`. In this way, everything that looks like an HTML attribute becomes a value in that component's `props` object.

### Assurances About Props

It may not be immediately clear why components take the form of a function returning another function. The reason why is because the top-level function has access to a kit of component tools that will help you shape your component. For now we'll talk about a tool called `ensure`.

In the case of our `TextBlock` component from above, there's always a risk that we might create an instance of that component, and forget to provide a "text" prop. The `ensure` tool will help us catch those kinds of mistakes. Here's how we might use it in our `TextBlock` component:

```jsx
const TextBlock = component(kit => {

  kit.ensure({
    text: kit.ensure.string.isRequired
  })

  return props => (
    <div className="text-block">{props.text}</div>
  )
})
```

In this case, we've used the `ensure` method to guarantee that every time this component is instantiated, it will have a prop called "text" taking the form of a string. If that doesn't happen, we'll get a useful error about it in the console.

This constitutes the basics of component composition in Sequoia. If you are already familiar with React, you should know that Sequoia components create extremely light wrappers over React components. Because Sequoia provides built-in state management, all Sequoia components are stateless. In this way, Sequoia helps you avoid distributed state spaghetti.

### State Management

Every Sequoia application is supported by a single, global state object. Rather than trying to spaghetti together strange ways for components to communicate with each other and share data, all components will store data on the state and the state will pass that data down as props to all components that need it. Whenever the state changes, those props will update and the components will automatically re-render.

In order to help you avoid getting lost doing all kinds of crazy state transformations, Sequoia lets you create rules for updating a given piece of the state and provides functions for triggering those rules. This way the state is always predictable.

```jsx
import { application, component } from 'sequoiajs';

// Create a TexBlock component
const TextBlock = component(kit => {

  // Observe state values and map `state.app.text`
  // to a prop on this component called `text`.
  kit.infuseState(state => ({
    text: state.app.text
  }))

  // Make sure our `text` prop is ALWAYS provided
  // and is ALWAYS a string.
  kit.ensure({
    text: kit.ensure.string.isRequired
  })

  // Render the HTML and display the text.
  return props => (
    <div className="text-block">{props.text}</div>
  )
})

// Initialize our application.
application(appKit => {

  // Define the selector where the app should render itself.
  appKit.renderIn('#app');

  // Create rules for a namespace on the state we're calling
  // "app". Rules always apply to state namespaces.
  appKit.createRules('app', {

    // The DEFAULT rule defines the initial shape of this
    // state namespace. Here, the `text` property will
    // become `state.app.text`.
    DEFAULT: (update, namespace) => update(namespace, {
      text: 'Hello, world!'
    })
  })

  // This time, we don't need to manually pass a `text`
  // prop to the TextBlock because the value is
  // being infused from the state instead.
  return () => (
    <TextBlock />
  )
})
```

#### Modifying State

Now that we know how to set up default values on a state, and also how to get state values into components, let's take a look at updating values on the state. Remember, by updating a value on the state, any component infusing that value into itself will automatically update to reflect the change.

If we want to update the state, we'll need to define a rule for how that can happen. Let's add a new rule to our `createRules` call from the previous example:

```jsx
appKit.createRules('app', {

  DEFAULT: (update, namespace) => update(namespace, {
    text: 'Hello, world!'
  }),

  // When this new rule is triggered, we expect it to be triggered with
  // a new value for the `text` property.
  UPDATE_TEXT: (update, namespace, payload) => update(namespace, {
    text: payload
  })
})
```

Note that we can create as many rules as we want for as many namespaces as we want. Each rule is arbitrarily named, except `DEFAULT` which is necessary for defining the initial shape of this piece of the state.

Now that we have a rule that allows updating the text, let's create a function that triggers it. Functions that trigger rules are called "actions" so, in our component definition, we'll need to call a new kit method called `infuseActions`:

```jsx
const TextBlock = component(kit => {

  // Calling this method gives us a prop on our
  // component called `actions` which contains
  // each of the functions we define here.
  kit.infuseActions(actions => ({

    // The object returned by this function identifies
    // which rule to trigger via the `type` property
    // and a new value to pass into that rule via the
    // `payload` property.
    updateText: newText => ({
      type: actions.state.UPDATE_TEXT,
      payload: newText
    })

  }))

  kit.infuseState(state => ({
    text: state.app.text
  }))

  kit.ensure({
    text: kit.ensure.string.isRequired
  })

  // Here, we add a click handler to our div that, when triggered,
  // will call the updateText action we created. That will in turn
  // trigger the UPDATE_TEXT rule and the state will be updated.
  // When the user clicks this div, they will see the value update
  // automatically from 'Hello, world!' to 'Goodbye, world!' because
  // this component is observing that property.
  return props => (
    <div
      className="text-block"
      onClick={() => props.actions.updateText('Goodbye, world!')}>
      {props.text}
    </div>
  )
})
```



#### Summing Up State

If you are familiar with common React/Redux architecture, this will all make perfect sense to you. If not, it may feel a bit new. If that's the case, here is a brief conclusion tying everything together:

The general idea is that all of your application state is stored in one global state object under various namespaces. Components observe values on the state and pass those values down to their nested children. Whenever observed values change, all components using them will automatically update. To change those values, we define rules for how values are allowed to update and then infuse actions that trigger those rules into our components so that we can call them whenever we need to.



> Everything after this line is outdated. Need to finish updating the readme to reflect the new paradigm.

---


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

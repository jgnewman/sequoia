# Sequoia

**SEQUOIA IS CURRENTLY AN ALPHA TECHNOLOGY, STILL IN ACTIVE DEVELOPMENT. USE AT YOUR OWN RISK.**

[![Build Status](https://travis-ci.org/jgnewman/sequoia.svg?branch=master)](https://travis-ci.org/jgnewman/sequoia)

Sequoia is a full-featured JavaScript application framework. It's powered by React and common React-based tools but you can quickly learn Sequoia without having ever touched React in your life. By the same token, it's similar enough to standard React techniques that, if you are already familiar with React best practices, migrating to a Sequoia mindset can be done extremely quickly.

## Why?

Because the "right way" to structure a scalable React app is arduous. For many would-be users, the sheer amount of independent tools that have to be pulled in and strung together in various ways can present a significant barrier to entry.

Sequoia seeks to provide a single, installable library that assembles each of the best tools in a form that feels like they were all written together, with exponentially less time spent by you learning how to connect components to react-redux, combine reducers, create and dispatch redux thunk actions, etc. Instead, you can pick up Sequoia and get all of those benefits in a single, simple, scalable, intuitive package.

## How It Works

A Sequoia app is a system of composable components backed up by a predictable application state. It can be as simple or as complex as you want, allowing you to add in things like http requests and routing at your leisure. All of it comes packaged together when you install Sequoia. There is no need to download and learn multiple disjointed tools.

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

In Sequoia, your application is broken down into components – small packages of HTML and controlling code that can be instantiated and nested within other components. In fact the call to `application` generates a component, but it's a special component, intended to live at the top level that has access to specific, configuration tools like `renderIn`. To create all of your other components, you'll call the `component` function instead.

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

This version of the application produces the same effect, but this time we're nesting our components. Notice that the `TextBlock` component returns a function that renders out a `div`. However, rather than hard-coding in the text that appears inside the div, we're making it dynamic by pulling it from an argument object called `props`. Props are populated by the attributes we put into the JSX when we instantiate the component. In this case, the application renders out an instance of `TextBlock` and populates its `props.text` property by specifying `text="Hello, world!"`.

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

const TextBlock = component(kit => {

  // Observe state values and map `state.app.text`
  // to a prop on this component called `text`.
  kit.infuseState(state => ({
    text: state.app.text
  }))

  kit.ensure({
    text: kit.ensure.string.isRequired
  })

  return props => (
    <div className="text-block">{props.text}</div>
  )
})

application(appKit => {

  appKit.renderIn('#app');

  // Create rules for a namespace on the state.
  appKit.createRules('app', {

    // The DEFAULT rule defines the initial shape of this
    // state namespace.
    DEFAULT: (update, namespace) => update(namespace, {
      text: 'Hello, world!'
    })
  })

  return () => (
    <TextBlock />
  )
})
```

In this example, the application component doesn't need to pass a prop down to the TextBlock because the TextBlock is pulling that prop in from the state. Check out (the right way)[https://sequoiajs.com/the-right-way] docs for more info on when to do this and when not to.

When we create the application, we'll create a namespace on our state called "app" and define rules for how it can be transformed. The `DEFAULT` rule is a special rule that is automatically triggered when the app loads and hydrates our namespace with default values.

#### Modifying State

Now that we know how to set up default values on a state, and also how to get state values into components, let's take a look at updating values on the state. Remember, by updating a value on the state, any component using that value will automatically update to reflect the change.

If we want to update the state, we'll need to define a rule for how that can happen. This allows us to keep our state from getting out of control. So let's add a new rule to our `createRules` call from the previous example:

```jsx
appKit.createRules('app', {

  DEFAULT: (update, namespace) => update(namespace, {
    text: 'Hello, world!'
  }),

  // When this new rule is triggered, we expect it to be triggered with
  // a "payload" – in this case, a new value for the `text` property.
  UPDATE_TEXT: (update, namespace, payload) => update(namespace, {
    text: payload
  })
})
```

Note that we can create as many rules as we want for as many namespaces as we want. Each rule is arbitrarily named, except `DEFAULT` which is necessary for defining the initial shape of this piece of the state.

Now that we have a rule that allows updating the text, let's create a function that triggers it. Functions that trigger rules are called "actions" so, in our component definition, we'll need to call a new kit method called `infuseActions`:

```jsx
const TextBlock = component(kit => {

  // Create a new prop called `actions` containing
  // all functions defined here.
  kit.infuseActions(actions => ({

    // Return an object with a `type` property that
    // names a state rule and a `payload` property that
    // will get passed into the rule when it's called.
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

  // Add a click handler that calls our action. Since this
  // component infuses the state value we're updating,
  // users will see the text automatically update when they click.
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

If you are familiar with common React/Redux architecture, this will likely make perfect sense to you. If not, it may feel a bit new. If that's the case, here is a brief conclusion tying everything together:

The general idea is that all of your application state is stored in one global state object under various namespaces. Components observe values on the state and can pass those values down to their nested children. Whenever observed values change, all components using them will automatically update. To change those values, we define rules for how the state can be transformed, then infuse actions that trigger those rules into our components.

## Other Cool Tricks

Sequoia comes bundled with lots of useful functionality, but not so much that it becomes overbearing. Here is a quick overview of some of the neat things it lets you do, in no particular order:

### Options for Your Actions

You already know about actions in Sequoia – functions that trigger rules for transforming the state. In the example already shown, our action returned an object with a `type` property naming the state rule and a `payload` property that sent in a new value. There are a few other ways you can trigger actions as well. Here are all the options:

```javascript
kit.infuseActions((rules, reqs) => ({

  // No need for a payload? Just name the rule.
  foo: rules.namespace.FOO,

  // Sending a payload? Make a function returning an object.
  bar: payload => ({ type: rules.namespace.BAR, payload: payload }),

  // Need to trigger multiple rules? Return a "thunk" and
  // pass objects to the `trigger` function.
  baz: payload => {
    return trigger => {
      trigger({ type: rules.namespace.FOO })
      trigger({ type: rules.namespace.BAR })
    }
  },

  // Need to make an http request? Make a function
  // that calls one of the `reqs`. More on this later.
  qux: () => reqs.get('MY_DATA', '/api/v1/my-data')

}))
```

### Nicer Event Handlers

Let's say you wanted to capture the click event on an `a` tag and trigger an action. In a simple case, you could do something like this:

```jsx
<a onClick={props.actions.foo}>Click me!</a>
```

When the user clicks the link, an action called `foo` will run and, as you might expect, it will be passed the event object. However, it's extremely likely that you will want to access more than just the event object within your handlers. The obvious solution to that problem looks like this:

```jsx
<a onClick={(evt) => props.actions.foo(evt, props.bar)}>Click me!</a>
```

The problem with this solution, however, is not only that it looks kind of gross. Also, every time props change and the component re-renders, you'll be generating a brand new function and throwing the old one a way for no reason.

To make this whole experience just a bit nicer, Sequoia gives you a component kit method called `infuseHandlers`:

```jsx
const Clickable = component(kit => {

  kit.infuseHandlers({
    handleClick: (evt, props) => {
      evt.preventDefault();
      props.actions.foo();
    }
  })

  return props => (
    <a onClick={props.handlers.handleClick}>Click me!</a>
  )
})

```

In this example, we create a new prop called `handlers` containing as many functions as we want to define. These functions can be attached to events in our JSX and, when called, they will be handed both the event object itself and the full collection of all of the props available to the component where they were defined.

### Data Requests

### Routing && Decisions

### Collections On-the-Fly

If you are familiar with Backbone.js, you have a concept of a "collection" – an array of similar objects that tends to be the result of a data fetch. For example, if you were to query an API for a list of users, you would get back an array of user objects.

Many other frameworks would have you do something like instantiate a Collection class in order to perform functions on this list and to make it DOM-bindable. However, Sequoia allows you to handle this in a much simpler way.

For one, you don't need to do anything special to an array of objects in order to make it DOM bindable as long as it ends up in your props somehow:

```jsx
<ul>
  {props.users.map((user, index) => {
    return <li key={index}>{user.name}</li>
  })}
</ul>
```

In terms of performing cool manipulations on a list like this, Sequoia provides the `collect` function at a global level.

```jsx
import { component, collect } from 'sequoiajs';

const List = component(kit => {

  kit.infuseState(state => ({ users: state.app.users }))

  return props => {
    const activeUsers = collect(props.users).getAllWhere({ isActive: true });

    return (
      <ul>
        {activeUsers.map((user, index) => {
          return <li key={index}>{user.name}</li>
        })}
      </ul>
    )
  }

})
```

In this example, we use `collect` to create a super-fast, super-light collection on the fly and use the resulting collection's `getAllWhere` method to reduce the users list down to a smaller list containing only the objects that have an `isActive` property set to true.

For more info on collection methods, check out the [docs](https://sequoiajs.com/docs).

### Constants




> Everything after this line is outdated. Need to finish updating the readme to reflect the new paradigm.

---

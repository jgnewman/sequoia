# Sequoia

**SEQUOIA IS CURRENTLY AN ALPHA TECHNOLOGY, STILL IN ACTIVE DEVELOPMENT. USE AT YOUR OWN RISK.**

[![Build Status](https://travis-ci.org/jgnewman/sequoia.svg?branch=master)](https://travis-ci.org/jgnewman/sequoia)

![Sequoia Banner](./banner.png)

Sequoia is a natural, progressive, full-featured JavaScript application framework. It's powered by React and common React-based tools but you can quickly learn Sequoia without having ever touched React in your life. By the same token, it's similar enough to standard React techniques that, if you are already familiar with React best practices, migrating to a Sequoia mindset can be done extremely quickly.

For an example, checkout the [Sequoia implementation](https://github.com/jgnewman/sequoia-todomvc) of TodoMVC.

## Why?

Because the "right way" to structure a scalable React app is arduous. For many would-be users, the sheer amount of independent tools that have to be pulled in and strung together in various ways can present a significant barrier to entry.

Sequoia seeks to provide a single, installable library that assembles each of the best tools in a form that feels like they were all written together, with exponentially less time spent by you learning how to connect components to react-redux, combine reducers, create and dispatch redux thunk actions, etc. Instead, you can pick up Sequoia and get all of those benefits in a single, simple, scalable, intuitive package.

## How It Works

A Sequoia app is a system of composable components (powered by React) backed up by a registry of observable values (powered by Redux). It can be as simple or as complex as you want, allowing you to add in things like http requests and routing at your leisure. All of it comes packaged together when you install Sequoia. There is no need to download and learn multiple disjointed tools.

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

In Sequoia, your application is broken down into components – small packages of HTML and controlling code that can be instantiated and nested within other components. In fact, the call to `application` generates a component, but it's a special component, intended to house the rest of your app and get access to special configuration tools like `renderIn`. To create all of your other components, you'll call the `component` function instead.

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

This constitutes the basics of component composition in Sequoia. If you are already familiar with React, you should know that Sequoia components create extremely light wrappers over React components. Because Sequoia provides a form of built-in state management, all Sequoia components are stateless. In this way, Sequoia helps you avoid distributed state spaghetti.

### Observables (i.e. State Management)

Every Sequoia application is supported by a single, global state object. The state can be namespaced and values within each namespace are observable. Rather than trying to spaghetti together strange ways for components to communicate with each other and share data, all components will store data on the state and the state will pass that data down as props to all components observing it. Whenever the state changes, those props will update and the components will automatically re-render.

In order to help you avoid getting lost doing all kinds of crazy state transformations, Sequoia lets you create rules for updating observable values and provides functions for triggering those rules. This way the state is always predictable and observables don't end up causing more trouble than they're worth.

```jsx
import { application, component } from 'sequoiajs';

const TextBlock = component(kit => {

  // Observe the state value `state.app.text` and
  // map it to a prop on this component called `text`.
  kit.observe(state => ({
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

  // Create rules for a namespace on the state called 'app'.
  appKit.createRules('app', {

    // The DEFAULT rule defines the initial shape of this
    // state namespace, providing default values to all of
    // its observables.
    DEFAULT: currentNamespace => Object.assign({}, currentNamespace, {
      text: 'Hello, world!'
    })
  })

  return () => (
    <TextBlock />
  )
})
```

In this example, the application component doesn't need to pass a prop down to the TextBlock because the TextBlock is observing that prop on from the state. Check out (the right way)[https://sequoiajs.com/the-right-way] docs for more info on when to do this and when not to.

When we create the application, we'll create a namespace on our state called "app" and define rules for how it can be transformed. The `DEFAULT` rule is a special rule that is automatically triggered when the app loads and hydrates our namespace observables with default values.

Notice that every rule we create needs to return a **new** copy of the state namespace being updated. This allows you to update multiple observables at once without inconsistencies if need be, and helps you make sure everything remains sane and predictable.

#### Updating Observables

Now that we know how to set up default values on a state, and also how to get observable values into components, let's take a look at updating those observable values on the state. Remember, our components are reactive, so when we update an observable value, any component observing it will automatically update to reflect the change.

If we want to update an observable, we'll need to define a rule that transforms our namespace. This allows us to keep our state from getting out of control. So let's add a new rule to our `createRules` call from the previous example:

```jsx
appKit.createRules('app', {

  DEFAULT: namespace => Object.assign({}, namespace, {
    text: 'Hello, world!'
  }),

  // When this new rule is triggered, we expect it to be triggered with
  // a "payload" – in this case, a new value for the `text` property.
  UPDATE_TEXT: (namespace, payload) => Object.assign({}, namespace, {
    text: payload
  })
})
```

Note that we can create as many rules as we want for as many namespaces as we want. Each rule is arbitrarily named, except `DEFAULT` which is necessary for defining the initial shape of this piece of the state.

Now that we have a rule that allows updating the "text" observable, let's create a function that triggers it. Functions that trigger rules are called "actions" so, in our component definition, we'll need to call a new kit method called `actions`:

```jsx
const TextBlock = component(kit => {

  // Create a new prop called `actions` containing
  // all functions defined here.
  kit.actions(rules => ({

    // Return an object with a `rule` property that
    // names a state rule and a `payload` property that
    // will get passed into the rule when it's called.
    updateText: newText => ({
      rule: rules.app.UPDATE_TEXT,
      payload: newText
    })

  }))

  kit.observe(state => ({
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

The general idea is that all of your application state is stored in one global state object under various namespaces. Components observe values on these namespaces and can pass those values down to their nested children. Whenever observed values change, all components using them will automatically update. To change those values, we define rules for how the state can be transformed, then create actions that trigger those rules within our components.

## Other Cool Tricks

Sequoia comes bundled with lots of useful functionality, but not so much that it becomes overbearing. Here is a quick overview of some of the neat things it lets you do, in no particular order:

### Options for Your Actions

You already know about actions in Sequoia – functions that trigger rules for transforming the state. In the example already shown, our action returned an object with a `type` property naming the state rule and a `payload` property that sent in a new value. There are a few other ways you can trigger actions as well. Here are all the options:

```javascript
kit.actions((rules, reqs) => ({

  // No need for a payload? Just name the rule.
  foo: rules.namespace.FOO,

  // Sending a payload? Make a function returning an object.
  bar: payload => ({ rule: rules.namespace.BAR, payload: payload }),

  // Need to trigger multiple rules? Return a "thunk" and
  // call all the action functions you need.
  baz: payload => {
    return actions => {
      actions.foo()
      actions.bar(payload)
    }
  },

  // Need to make an http request? Create a function
  // that returns one of the "reqs". More on this later.
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

The problem with this solution, however, is not only that it looks kind of gross. Also, every time props change and the component re-renders, you'll be generating a brand new function and throwing the old one away for no reason.

To make this whole experience just a bit nicer, Sequoia gives you a component kit method called `handlers`:

```jsx
const Clickable = component(kit => {

  kit.handlers({
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

To add just one more layer of icing, Sequoia allows you to add _even more_ values to your handler functions. For example:

```jsx
const Clickable = component(kit => {

  kit.handlers({
    handleClick: (evt, props, extraVal1, extraVal2) => {
      evt.preventDefault();
      console.log(extraVal1, extraVal2); // <- 'foo', 'bar'
      props.actions.foo();
    }
  })

  return props => (
    <a onClick={props.handlers.handleClick.with('foo', 'bar')}>Click me!</a>
  )
})
```

In this example, the `with` function allows you to add as many values as you'd like to a click handler _in addition to_ the event and the component props.

### Decisions & Routing

In standard ES6 + JSX, there's a bit of syntactical grossness when it comes to working with conditions. For example:

```jsx
<div>
  {
    (() => {
      if (someCondition) {
        return (
          <div>Hello</div>
        )
      }
    })()
  }
</div>
```

To make this a whole lot nicer, Sequoia gives you a pre-made component called `When` for dealing with conditions. Here's how you'd use it to restructure the above code:

```jsx
<div>
  <When ok={someCondition}>
    <div>Hello</div>
  </When>
</div>
```

`When` works like an `if` statement, **not** like an `if...else` statement. In other words, you can create as many instances of `When` as you like and each one will render independently of all the others.

However, there _is_ a way to create an `if...else` situation using the `When` component. To do it, you'll just need to pull in a couple other pre-made components, namely `Switch` and `Otherwise`:

```jsx
<div>
  <Switch>

    <When ok={ifCase}>
      <div>Hello</div>
    </When>

    <When ok={elseIfCase}>
      <div>Goodbye</div>
    </When>

    <Otherwise>
      <div>I'm the else case!</div>
    </Otherwise>

  </Switch>
</div>
```

The `Switch` component takes instances of `When` and `Otherwise` as its children and will execute the first one that resolves truthily. This way, you can check as many conditions as you like, knowing that only one of them will ever get executed. `Otherwise` always resolves truthily so you'll want to make sure it falls at the end, just like in a standard `else` case.

What's interesting is that you have lots of other options besides just `ok` for `When` component props, and some of them can turn this combination of decision-making components into a pretty nice little router. For example:

```jsx
import { application, Switch, When } from 'sequoiajs';

// Import some components that render out different page content.
import { HomePage } from './homepage';
import { AboutPage } from './aboutpage';
import { ContactPage } from './contactpage';

application(appKit => {

  appKit.renderIn('#app');

  return () => (
    <Switch>
      <When path="/" component={HomePage} />
      <When path="/about" component={AboutPage} />
      <When path="/contact" component={ContactPage} />
    </Switch>
  )
})
```

This, of course, is a fairly basic example, but it should serve to illustrate how easy routing can be in Sequoia. For more info on what you can do with `When` or on how to set up routing with hash paths, redirects, and other cool stuff, check out the [docs](https://sequoiajs.com/docs).

### Data Requests

Sequoia uses [axios](https://github.com/mzabriskie/axios) under the hood for http requests. You'll eventually need to know that if you want to take full advantage of Sequoia's more advanced ajax functionality. But in terms of a basic overview, Sequoia has a very particular idea about how you ought to be working with your data in order for your application to be scalable.

Specifically, fetched data ought to be observable through the state just like all other data. This way, things can automatically re-render when the data changes and you can deal with it nicely throughout your nested components.

However, fetching data can be a bit like Schrödinger's cat. You might get success or you might get an error. At any given time, you may or may not have data in the state. There's even that weird limbo to account for after a request has been made but before the response has come back. It would be extremely cumbersome to have to set up rules to handle all of the possibilities so Sequoia has handled it for you.

To begin, you'll want to know that data is always fetched via special actions called "reqs" (short for "requests"). When you create actions for a component, you get access to all of these reqs:

```javascript
kit.actions((rules, reqs) => ({
  getUsers: () => reqs.get('USER_LIST', '/api/v1/users')
}))
```

In this example, we're creating an action called `getUsers` that returns an instance of `reqs.get`. The first argument we pass to every req is a unique string that singles it out from all other data requests in the application. In this case, our second argument is the URL we want to make a GET request to.

Because data may or may not exist at any given time, it doesn't make sense for it to flow directly down to your components through the props. It would make things especially complicated when trying to ensure your prop types and so forth. So instead, every component kit comes with a data api for working with data. To illustrate...

```jsx
import { component, When } from 'sequoiajs';
import { Spinner } from './my-spinner';

const UserList = component(kit => {

  kit.actions((rules, reqs) => ({
    getUsers: () => reqs.get('USER_LIST', '/api/v1/users')
  }))

  kit.handlers({
    handleClick: (evt, props) => {
      evt.preventDefault();
      props.actions.getUsers()
    }
  })

  return (
    <div>

      <a onClick={props.handlers.handleClick}>
        Click me to get users!
      </a>

      {/* Once data has been fetched, display a list of users. */}
      <When ok={kit.data.ok('USER_LIST')}>
        <ul>
          {kit.data.value('USER_LIST').map(user => {
            return <li>{user.name}</li>
          })}
        </ul>
      </When>

      {/* If the request failed, display the resulting error message. */}
      <When ok={kit.data.notOk('USER_LIST')}>
        <span>{kit.data.errorMsg('USER_LIST')}</span>
      </When>

      {/* While the request is pending, display a spinner. */}
      <When ok={kit.data.pending('USER_LIST')}>
        <Spinner />
      </When>

    </div>
  )

})
```

In this example, we provide an `a` tag the user can click to fetch data. Based on the state of that data, we'll display different things. Even though the data isn't a direct prop of the component, the component will still automatically re-render when the state of the data changes!

When the request was successful and we have data, we'll display a list of users. When the request failed, we'll display the resulting error message. While the request is pending, we'll display a spinner component (not included with the package).

There is a lot more that can be done with data requests. But I'll leave you to explore that in the [docs](https://sequoiajs.com/docs).

### Collections On-the-Fly

If you are familiar with Backbone.js, you have a concept of a "collection" – an array of similar objects that tends to be the result of a data fetch. For example, if you were to query an API for a list of users, you would get back an array of user objects.

Many other frameworks would have you do something like instantiate a Collection "model" class in order to perform functions on this list and to make it DOM-bindable. However, Sequoia allows you to handle this in a much simpler way.

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

const UserList = component(kit => {

  kit.observe(state => ({ users: state.app.users }))

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

In this example, we use `collect` to create a super-fast, super-light collection on-the-fly and use the resulting collection's `getAllWhere` method to reduce the users list down to a smaller list containing only the objects that have an `isActive` property set to true.

For more info on collection methods, check out the [docs](https://sequoiajs.com/docs).

### Refs

Every so often you'll need to perform a direct manipulation on an actual DOM element. Though this should be avoided as much as possible, sometimes there's just no way around it, such as when needing to trigger a `focus` event.

To help you do this, Sequoia provides a nice technique for referencing actual DOM elements via an automatic prop available to every component called `ref`. You'll use this with the `ref=` attribute in your JSX tags. Following is an example of a component that uses `ref` to allow you to trigger a focus on an `input` tag by clicking an `a` tag.

```jsx
component(kit => {

  kit.handlers({

    handleClick: (evt, props) => {
      evt.preventDefault();
      props.ref.get('myInput').focus()
    }

  })

  return props => (
    <div>

      <a onClick={props.handlers.handleClick}>
        Click me to trigger focus on the input!
      </a>

      <input type="text" ref={props.ref('myInput')} />

    </div>
  )
})
```

In this example, we created a reference to the `input` tag by calling `props.ref('myInput')` within its `ref` attribute. Having done this, we are free to reference this DOM node elsewhere by calling `props.ref.get('myInput')`. In this case, we've put a click handler on the a tag that, when executed, will grab a reference to the `input` tag and trigger a focus on it.

### Constants

Sometimes it can be nice to reference a set of unchanging values, rather than identifying things with strings all over the place and risking weird bugs resulting from typos.

To assist you with a scalable application architecture, Sequoia provides you with a nice way to create and retrieve constants – in other words, Symbol instances that never change, that produce errors if you try to reference them incorrectly, and can be used just about anywhere a string can be used in Sequoia.

Here's how you'd create a constant:

```javascript
import { constants } from 'sequoiajs';

const FOO = constants('FOO');
```

And here's how you'd reference that same constant after you create it:

```javascript
import { constants } from 'sequoiajs';

constants.FOO() // <- Symbol
```

Constants themselves are Symbols and are retrievable in the form of a function. This way if you try to reference a constant and spell something wrong, you'll get an error rather than an unexpected result due to an undefined value.

On the topic of values that shouldn't ever be equal to other values, sometimes you'll need to generate unique identifiers. In these cases, it's worth noting that Sequoia comes with a nice UUID generator.

```javascript
import { uuid } from 'sequoiajs';

console.log(uuid()) // <- '5dd8a17d-84f3-46d8-a1ac-8fa186155d77'
```


## Installing Sequoia

Sequoia is available over npm and Yarn under the package name "sequoiajs".

> Note that the framework is called "Sequoia", **not** "Sequoia jay ess". The package name has "js" on the end of it for literally no other reason than that there is a guy in Japan who owns the "sequoia" package name on npm and won't respond to my emails about it even though he hasn't touched it in years.

To download it, simply run the bash one-liner `$ yarn add sequoiajs` or `$ npm install sequoiajs`.

From here, you'll probably want to use ES6 features and JSX. Luckily, Sequoia doesn't add any complexity to that process. Following is an example of a Gulp task that uses Browserify and Babel to compile a Sequoia app. Note that _this exact same task_ will also compile a React app so, if you're not a Gulp fan, the important takeaway is that if you can compile ES6 and JSX, you can compile a Sequoia app. There's nothing _more special_ about it.

```javascript
import gulp from 'gulp';
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';

gulp.task('compile', () => {
  return browserify(['src/javascript/app-index.js'])
    .transform('babelify', {presets: ['es2015', 'react']})
    .bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('public/javascript'));
});
```

Although Sequoia is a framework that provides a core of commonly-needed application features, you will likely end up adding more packages. The great thing is, any package that is compatible with React ought to be compatible with Sequoia as well. Sequoia components are just React components after all. So there is already an extensive amount of cool add-ons you can try out with Sequoia. Just remember to have fun while you're at it!

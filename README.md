# Sequoia

**SEQUOIA IS CURRENTLY AN ALPHA TECHNOLOGY, STILL IN ACTIVE DEVELOPMENT. USE AT YOUR OWN RISK.**

[![Build Status](https://travis-ci.org/jgnewman/sequoia.svg?branch=master)](https://travis-ci.org/jgnewman/sequoia)

<img src="https://github.com/jgnewman/sequoia/raw/master/banner.png" alt="Sequoia Banner" width="400"/>

Sequoia is what you'd get if React and Vue had a baby.

It's a progressive JavaScript application framework, naturally. But it's a _smooth_ one, providing all the best features of a React architecture, but allowing you to handle them in a simpler, somewhat more Vue-like way.

You can get almost everything you need from the core Sequoia library – from rendering to routing, from state management to data fetching. There is no need to smash together a ton of disjointed tools just to account for the basic, bare necessities.

For an example, checkout the [Sequoia implementation](https://github.com/jgnewman/sequoia-todomvc) of TodoMVC.

## Why did you make this?

**Ostensibly,** because it's sad to see the community so bitterly divided into the React and Vue camps. We get enough of that in politics. This is an experiment hoping to bring the family back together.

**In reality,** because the "right way" to structure a scalable React app is ridiculously arduous, and because mutable state and DSLs (like Vue templates) are the reasons we all left Angular in the first place. This is an experiment hoping to combine good ideas from both worlds into a great framework.

## How It Works

A Sequoia app is a system of composable components (powered by React) backed up by an immutable, observable state. It can be as simple or as complex as you want, allowing you to add in things like http requests and routing at your leisure.

In it's simplest form, a Sequoia app looks like this:

```jsx
import { component } from 'sequoiajs';

component({

  el: '#app',
  
  render() {
    return <div>Hello, world!</div>
  }

})
```

As you can see, Sequoia makes use of React's ["JSX"](https://facebook.github.io/jsx/) dialect but it also takes a tip from Vue in terms of UX.

The above snippet will create a full-fledged Sequoia app that renders a single div. The `el` property tells the component to find the DOM element with the id "app" and render itself within that element. Normally you'll only need to use this property once, on your top-level component.

> React users: Note that you don't have to import React in order for the JSX to work.

### Composing Components

In Sequoia, your application is broken down into many components – small packages of HTML and controlling code that can be instantiated and nested within other components.

In order to illustrate the power of component-based architecture, let's add 1 more level of complexity to the above application.

```jsx
import { component } from 'sequoiajs';

const TextBlock = component({
  render(props) {
    return <div className="text-block">{props.text}</div>
  }
})

const App = component({
  el: '#app',
  render() {
    return <TextBlock text="Hello, world!" />
  }
})
```

This version of the application produces the same effect, but this time we're nesting our components. Notice that the `TextBlock` now renders out our `div`. However, rather than hard-coding in the text that appears inside the div, we're making it dynamic by pulling it from an argument object called `props`. Props are populated by the attributes we put into the JSX when we instantiate the component. In this case, `App` renders out an instance of `TextBlock` and populates its `text` prop by specifying `text="Hello, world!"`.

### Assurances About Props

In the case of our `TextBlock` component from above, there's always a risk that we might create an instance of that component and forget to provide a "text" prop. The `ensure` tool will help us catch those kinds of mistakes. Here's how we might use it in our `TextBlock` component:

```jsx
const TextBlock = component({

  ensure(types) {
    return {
      text: types.string.isRequired
    }
  },

  render(props) {
    return <div className="text-block">{props.text}</div>
  }

})
```

In this case, we've used the `ensure` method to guarantee that every time this component is instantiated, it will have a prop called "text" taking the form of a string. If that doesn't happen, we'll get a useful error about it in the console.

> React users: Sequoia components generate real React components. Because Sequoia provides a form of built-in state management, all Sequoia components are stateless. In this way, Sequoia helps you avoid distributed state spaghetti.

### Observables (i.e. State Management)

Every Sequoia app is backed up by a state object. The state can be namespaced and all state values are observable. Rather than trying to spaghetti together strange ways for components to communicate with each other and share data, all components will store data on the same state and the state will pass that data down as props to all components observing it. Whenever the state changes, those props will update and the components will automatically re-render.

To update the state, you will create rules. Each rule is a function that gets passed down through props and has the job of generating a new copy of the state. This way the state is always predictable and observables don't end up causing more trouble than they're worth.

Here's a visualization.

![Components observing and reacting to observables](https://github.com/jgnewman/sequoia/raw/master/visualization.png)

And here's a practical example.

```jsx
import { component } from 'sequoiajs';

const TextBlock = component({

  // Observe the state value `state.app.text` and
  // map it to a prop on this component called `text`.
  observe(state) {
    return {
      text: state.app.text
    }
  },

  ensure(types) {
    return {
      text: types.string.isRequired
    }
  },

  render(props) {
    return <div className="text-block">{props.text}</div>
  }

})

const App = component({

  el: '#app',

  // Create rules for a transforming the state
  createRules(state) {
    return {

      // The "initial" rule is special and defines
      // default values on the state. It gets called
      // automatically. The "state.update" method generates
      // a new copy of the state.
      initial: () => state.update({
        app: {
          text: 'Hello, world!'
        }
      })

    }
  },

  render() {
    return <TextBlock />
  }

})
```

In this example, the App component doesn't need to pass a prop down to the TextBlock because the TextBlock is observing that prop on the state. Check out [the right way](https://sequoiajs.com/the-right-way) docs for best practices on when to do this and when not to.

We can create rules for transforming the state at any point. All rules we create are added to the component's props as a collection called `rules` so that we can call them at any time. If one of our rules is named `initial`, Sequoia will call it automatically and use it to set initial, default values for the state.

It doesn't matter what our rules return. What matters most is that each rule makes at least one call to `state.update` or `state.set`. Both of these methods generate a new copy of the state but you'll use `update` more often because it allows for more granular control. See [the docs](https://sequoiajs.com/docs).

#### Updating Observables

Now that we know how to set up default values on a state, and also how to get observable values into components, let's take a look at updating those observables. Remember, our components are reactive, so when we update an observable value, any component observing it will automatically update to reflect the change.

If we want to update an observable, we'll need to define a rule that generates a new copy of the state with new values. This allows us to keep our state from getting out of control. So let's add a new rule to our `createRules` call from the previous example:

```javascript
createRules(state) {
  return {

    initial: () => state.update({
      app: {
        text: 'Hello, world!'
      }
    }),

    // We expect this rule to be triggered with
    // a new value for "text". By passing "app"
    // to the update method, we can more easily
    // update select values on a single namespace.
    updateText: newText => state.update('app', {
      text: newText
    })

  }
},
```

Now that we have a rule that allows updating the "text" observable, let's trigger it!

In this case, we'll have the text update when the user clicks it. To make that happen we'll need to do two things. First, we'll need to pass our rules down to the TextBlock. So let's modify our App's render function like this:

```jsx
// App
render(props) {
  return <TextBlock rules={props.rules} />
}
```

Now the TextBlock has access to the rules in its props as well.

Next, we'll need to actually call that function when the text gets clicked. So let's modify the TextBlock's render function like this:

```jsx
// TextBlock
render(props) {
  return (
    <div
      className="text-block"
      onClick={() => props.rules.updateText('Goodbye, world!')}>
      {props.text}
    </div>
  )
}
```

Now, when we click the text, it'll trigger our `updateText` rule. That rule will create a new copy of the state where the "text" property has a new value. Since our TextBlock component is observing that value, it will update automatically to display the new value.

**And that's how Sequoia works!**


## Other Cool Tricks

Sequoia comes bundled with lots of useful functionality, but not so much that it becomes overbearing. Here is a quick overview of some of the neat things it lets you do, in no particular order:


### Nicer Event Handlers

Let's say you wanted to do something when a user clicks an `a` tag. In a simple case, you could do something like this:

```jsx
<a onClick={evt => props.rules.foo('some value')}>Click me!</a>
```

There are some problems with this solution, however. One, it's ugly. Two, if you need to manage the event object, you probably don't want to do that inside a state rule. Three, you're needlessly generating a new function every time the component renders. I could go on.

To make this whole experience just a bit nicer, Sequoia gives you a component property called `handlers`:

```jsx
const Clickable = component({

  handlers: {

    example: kit => {
      kit.evt.preventDefault()
      kit.props.rules.foo('some value')
    }

  },

  render(props) {
    return <a onClick={props.handlers.example}>Click me!</a>
  }

})
```

In this example, we use `handlers` to create a new collection in our props called "handlers". Handler functions can be attached to events in our JSX and, when called, they will be handed a "handler kit" that contains the event object, the component's props, and any "refs" you may have created (which will be discussed later).

To add just one more layer of icing, Sequoia allows you to add _even more_ useful values to your handler functions. For example:

```jsx
const Clickable = component({

  handlers: {

    example: (kit, extra1, extra2) => {
      kit.evt.preventDefault()
      console.log(extra1, extra2) // <- 'bar', 'baz'
      kit.props.rules.foo('some value')
    }

  },

  render(props) {
    return <a onClick={props.handlers.example.with('bar', 'baz')}>Click me!</a>
  }

})
```

In this example, the `with` function allows you to add as many values as you'd like to an event handler _in addition to_ the kit that already gets passed in.


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

Nobody likes having to create that self-invoking function just to use an `if` statement. So to make this a whole lot nicer, Sequoia gives you a function called `when` for dealing with conditions. Here's how you'd use it to restructure the above code:

```jsx
import { when } from 'sequoiajs';

...

<div>
  {when.ok(someCondition).then(() => (
    <div>Hello</div>
  ))}
</div>
```

If the condition passed to `ok` resolves truthily, the block will return an execution of the function passed to `then`. If not, it will return null. Pretty simple.

The `when` function works works kind of like an `if` statement in this way, but it **does not** work like an `if...else` statement. In other words, you can call `when` as many times as you like and each one will render independently of all the others.

If you need to create an `if...else` situation, you just need to combine the `when` function with a couple other tools called `pick` and `choose`.

```jsx
import { when, pick } from 'sequoiajs';

...

<div>
  {pick(
    
    when.ok(ifCase).choose(() => (
      <div>Hello</div>
    )),

    when.ok(elseIfCase).choose(() => (
      <div>Goodbye</div>
    )),

    when.otherwise().choose(() => (
      <div>I'm the else case!</div>
    ))

  )}
</div>
```

If you read over this example, it ought to be immediately clear what the effect will be. Rather than chaining `.then` off of our `when` function, we're chaining `.choose`. These two functions work the same way, except that `choose` doesn't immediately render its function when its condition is truthy. Instead, it tells `pick` to render its function. The `pick` function will render its first truthy argument and none of the others.

What's neat is that you have lots of other options besides just `ok` for `when`, and some of them can turn this combination of decision-making components into a pretty nice little router. For example:

```jsx
import { component, pick, when } from 'sequoiajs';

// Import some components that render out different page content.
import { HomePage } from './homepage';
import { AboutPage } from './aboutpage';
import { ContactPage } from './contactpage';

component({

  el: '#app',

  render() {
    return pick(
      when.path('/').choose(() => <HomePage />),
      when.path('/about').choose(() => <AboutPage />),
      when.path('/contact').choose(() => <ContactPage />)
    )
  }

})
```

This, of course, is a fairly basic example, but it should serve to illustrate how easy routing can be in Sequoia. For more info on what you can do with `when` or on how to set up routing with hash paths, redirects, and other cool stuff, check out the [docs](https://sequoiajs.com/docs).

### Data Requests

Sequoia uses [axios](https://github.com/mzabriskie/axios) under the hood for http requests. You'll eventually need to know that if you want to take full advantage of Sequoia's more advanced ajax functionality. But in terms of a basic overview, Sequoia has a very particular idea about how you ought to be working with your data in order for your application to be scalable.

Specifically, fetched data ought to be observable through the state just like all other data. This way, things can automatically re-render when the data changes and you can deal with it nicely throughout your nested components.

As such, Sequoia provides easy access to http calls only when you are creating rules. Here's an example.

```javascript
createRules(state, http) {
  return {

    updateUsers: () => {
      http.get('/api/v1/users')
          .then(response => state.update({
            users: response.data
          }))
    }

  }
}
```

> You do have access to the `http` api outside of this structure, but using it elsewhere is discouraged if it is avoidable. You can read about it in the [docs](https://sequoiajs.com/docs).

Note that the `http` api is passed in as the second argument to the `createRules` function.

In this example, we're creating a rule called `updateUsers` that fetches some data and then drops it into the state.

There is a lot more that can be done with data requests. But I'll leave you to explore that in the [docs](https://sequoiajs.com/docs).

### Collections On-the-Fly

If you are familiar with Backbone.js, you have a concept of a "collection" – an array of similar objects that tends to be the result of a data fetch. For example, if you were to query an API for a list of users, you would get back an array of user objects.

Many frameworks would have you do something like create a Collection "model" in order to perform functions on this list and to make it DOM-bindable. However, Sequoia allows you to handle this in a much simpler way.

For one, you don't need to do anything special to an array of objects in order to make it DOM bindable as long as it ends up in your props somehow:

```jsx
<ul>
  {props.users.map((user, index) => {
    return <li key={index}>{user.name}</li>
  })}
</ul>
```

But in terms of performing cool manipulations on a list like this, Sequoia provides the `collect` function at a global level.

```jsx
import { component, collect } from 'sequoiajs';

const UserList = component({

  observe(state) {
    return {
      activeUsers: collect(state.app.users).getAllWhere({
        isActive: true
      })
    }
  },

  render(props) {
    return (
      <ul>
        {props.activeUsers.map((user, index) => {
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

To help you do this, Sequoia provides a nice way to reference elements from within your handlers. Following is an example of a component that uses a `ref` to allow you to trigger a focus on an `input` tag by clicking an `a` tag.

```jsx
component({

  handlers: {

    handleClick: ({ evt, refs }) => {
      evt.preventDefault()
      refs.myInput.focus()
    }

  },

  render(props) {
    return (
      <div>

        <input type="text" ref="myInput" />

        <a onClick={props.handlers.handleClick}>
          Click me to trigger focus on the input!
        </a>

      </div>
    )
  }

})
```

In this example, we created a reference to the `input` tag by using the `ref` attribute and naming it "myInput". Having done this, we are free to reference this DOM node within our handlers as `refs.myInput`. In this case, we've put a click handler on the a tag that, when executed, will grab a reference to the `input` tag and trigger a focus on it.


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
    // The 'react' preset handles the JSX
    .transform('babelify', {presets: ['es2015', 'react']})
    .bundle()
    .pipe(source('app.js'))
    .pipe(buffer())
    .pipe(gulp.dest('public/javascript'));
});
```

Although Sequoia is a framework that provides a core of commonly-needed application features, you will likely end up adding more packages. The great thing is, any pre-made React component ought to be compatible with Sequoia! Sequoia components are just React components after all. So there is already an extensive amount of cool add-ons you can try out with Sequoia. Just remember to have fun while you're at it!

## Server Side Rendering (Isomorphism)

One of the "must-have" features of progressive web applications is server-side rendering. With this technique, you can pre-render your application on the server and thereby receive benefits in the form of better SEO, less time waiting for the first meaningful paint, and an ability to pre-fetch data before the server hands the page to the browser.

In Sequoia, this is super easy. Here is the basic gist:

- We only need one application that lives both on the server and in the browser.
- The server-side pieces are minimal. The app just gets an initial render on the server so that the browser gets some meaningful content right away. Once the app is live in the browser, the client side will take over.
- If you want to pre-fetch data and make it available to your application on the client side, you will need a way to serialize it and put it into the server's response to the browser's request.
- There are going to be implications for routing since client side routing is based on the `location` object and the server does not have a `location` object. The good news is, Sequoia makes tackling this a breeze.

### The Basic Idea

> Note: We'll use some pseudo code in this section for handling server routes. The point is to illustrate a concept, not to teach you how to use a particular Node library.

Sequoia components are isomorphic, meaning they can exist both on a server and in the browser. This is great because it means you can write your app once, and then allow it to both pre-render on the server when the browser makes a request, and pick up where the server left off once the app is running live on the client side.

To illustrate, let's create a few very simple components that will comprise a simple application.

```jsx
const Home = component({
  render: () => <div>This is home page content.</div>
})

const About = component({
  render: () => <div>This is about page content.</div>
})

const NotFound = component({
  render: () => <div>This is 404 page content.</div>
})

const Router = component({
  render: () => pick(
    // Note we can pass the component in directly
    // to the choose function if we want. It's
    // the same as doing `.choose(() => <Home />)`
    when.path('/').choose(Home),
    when.path('/about').choose(About),
    when.otherwise().choose(NotFound)
  )
})

const ClientApp = component({
  el: '#root',
  render: () => <Router />
})
```

Here we have a completely normal Sequoia app that chooses one of 3 pages to display based on path name. So far, we haven't done anything special geared toward server side rendering.

> Note: We'll assume that, as part of our build process, these components will be bundled and put into a file called "bundle.js".

#### Adding SSR

To enable server side rendering, we just need to add a little layer on top of what we've already built. And here it is:

```jsx
const Html = component({
  render: () => (
    <html>
      <head>
        <title>My Cool App</title>
      </head>
      <body>
        <div id="root">
          <Router />
        </div>
        <script src="/bundle.js"></script>
      </body>
    </html>
  )
})

const ServerApp = component({
  render: () => <Html />
})
```

Here, we've built a component that generates an entire html structure as well as a second application that instantiates it. Notice that our `Router` component is placed directly inside the "root" div. This is how the server will be able to perform the initial render of the rest of our application. Once the app is live on the page, our `ClientApp` component will kick in and take over handling the content inside of the "root" div. The `ClientApp` will exist on the page because it gets pulled in as part of "bundle.js".

#### Hooking Up To A Server

You may have noticed that our `Router` makes decisions based on "path" which doesn't exist on the server. We'll fix that in this step. Here, we're going to use a little pseudo code to handle an incoming request from the browser. The rest of the code is real.

```jsx
import { setLocationContext } from 'sequoiajs';
import { renderToStaticMarkup } from 'sequoiajs/server';
import { ServerApp } from './wherever-you-put-it';

// Pseudo request handler
onBrowserRequest('/', (request, response) => {

  // Since no "location" object exists on the server,
  // we can fake one using setLocationContext.
  setLocationContext({ pathname: request.url });

  // We can now convert our app to static markup
  // and send it back to the browser.
  response.send(renderToStaticMarkup(<ServerApp />))

})
```

In this step, when the browser requests the "/" path, we render our `ServerApp` component to static markup and serve it back to the browser. In order to help out our router, we manually provide a location context first, before trying to render. Since our current router setup only cares about the path, we only need to mock the `location.pathname` property.

Tada! That's all you need.

#### Pre-Fetching Data

If you'd like to fetch some data and make that available to your app as part of server side rendering, Sequoia has your back. Let's revisit our pseudo server request.

```jsx
// Pseudo request handler
onBrowserRequest('/', (request, response) => {

  // Pseudo database query
  database.getUsers().then(users => {

    setLocationContext({ pathname: request.url });

    response.send(renderToStaticMarkup(
      <ServerApp users={users} />
    ))

  })

})
```

In this case, we make a database request for users before sending back a response. When we render the app to markup, we pass that data down as a prop. In terms of making it available to the client side app, we need one more step. Let's revisit our `Html` and `ServerApp` components so we can get them to handle this prop.

First, we'll quickly pass our new `ServerApp` prop down to the `Html`.

```jsx
const ServerApp = component({
  render: props => <Html users={props.users} />
})
```

Then we'll hand it to Sequoia's pre-made `Preload` component.

```jsx
import { Preload } from 'sequoiajs';

...

const Html = component({
  render: props => (
    <html>
      <head>
        <title>My Cool App</title>
      </head>
      <body>
        <div id="root">
          <Router />
        </div>

        <Preload state={{ users: props.users }} />

        <script src="/bundle.js"></script>
      </body>
    </html>
  )
})
```


Here, we add in a new, pre-made component to our html called `Preload`. It takes a single prop, `state`, that allows you to name all of the data that should be preloaded into the client-side state. When the live app loads up, all of that data will be ready for you to use. 

> It's important to note that `Preload` renders out a `script` tag so it's best if you keep it near the bottom of your Html.

# And that's it!

Well, not _all_ of it. But there's always the [docs](https://sequoajs.com/docs) for more info.

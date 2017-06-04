# To Do

- [x] Easier component creation
  - [x] All components are dumb
  - [x] Easier prop type assurances
  - [x] Easier prop infusing
- [x] Easier rendering of application
- [x] Easier store creation
  - [x] Add redux dev tools
  - [x] Easily disable dev tools
  - [x] Simplify reducing
  - [x] Automatically create the store
  - [x] Automatic thunk Middleware
  - [x] Easy addition of more Middleware
  - [x] Automatic state saving?
- [x] Configure the app for things like state saving and use of redux dev tools
- [x] Router
  - [x] Anywhere you are going to have Routes, wrap them in a Router. This can be nested in whatever way.
  - [x] Every route is associated with a location or maybe a function that returns true when it should render.
  - [x] Every route is associated with a component to render.
  - [x] Every instance of router should only render 1 of its children under any circumstance.
  - [x] Nested instances of router should be able to care only about sub paths
- [x] Easier actions
- [x] Data layer
- [x] test requestThunk, ok, notok
- [x] Allow data api to work when state has not been configured
- [x] Allow infuseActions/Binders/Modules to include a single prop by name or a whole pack
- [x] Make sure components update when data comes through
- [x] Constants
- [x] write tests
- [x] change infuseValues to infuseState
- [x] allow multiple apps on one page
- [x] queriable.countWhere
- [x] queriable.updateWhere
- [x] queriable.subtractWhere
- [x] updateWhere should be able to take a function
- [x] more queriable methods
- [x] is there a nicer way to update state than Object.assign?
- [x] queriable.updateOneWhere
- [x] queriable.subtractOneWhere

- [ ] update live reloader with something that works with node 7
- [ ] create phantomjs or some such tests

v0.0.8/v0.0.9

- [x] rename queriable to collect
- [x] better ref handling via `capture` prop
- [x] make sure keyPrefix works for autopersistConfig
- [x] internalize react-pathway
  - [x] hook it into state
  - [x] add native hash path handling

v0.0.10

- [x] `capture` becomes `referencer`
  - [x] calling referencer creates a referencer instance
  - [x] referencer.capture creates a reference
  - [x] referencer.get retrieves a reference immediately
  - [x] referencer.getAsync retrieves a reference with a callback after time
- [x] fix react-unknown-prop error

v0.0.11

- [x] make `referencer` a component tool instead of a prop
- [x] make `data` a component tool instead of a prop (need to update docs)
- [x] smarter `window` referencing
- [x] more When attributes
  - [x] `ok` replaced isTrue (need to update docs)
  - [x] `notOk` replaced isFalse
  - [x] `populated` (object or array)
  - [x] `empty` (object or array)

v0.1.0

- [x] a whole new paradigm - much stronger
  - [x] app configuration
  - [x] app rendering
  - [x] easier state setup via "rules"
  - [x] infusing state
  - [x] ensuring props
  - [x] infusing actions
  - [x] infusing handlers
  - [x] collections on-the-fly
  - [x] ref handling (is there a way to auto-pass refs to handlers?)
  - [x] data requests as actions
  - [x] routing/decision-making
  - [x] don't auto-rehydrate location and data
  - [x] when we infuse actions/handlers, merge packages coming from parents.
  - [x] thunk actions now have access to other actions directly instead of dispatch
  - [x] by default we delay render of app until rehydration completes
- [x] finish rewriting readme
- [x] test the various scenarios we were already testing
- [x] publish to npm
- [x] update todomvc

v0.1.1

- [x] fix a bug where actions could only take one value

v0.1.2

- [x] better handlers. can we choose what gets passed in?
- [x] the whole (update, state) => update(state) thing is overkill. just return the update.
  - [x] provide a nice `merge` function for anyone not using ES6
  - [x] update readme
- [x] update docs site (in-progress)

v0.1.3

- [x] Renames
  - [x] infuseState -> observe
  - [x] infuseActions -> actions
  - [x] infuseHandlers -> handlers
- [x] You are allowed to return pure, unwrapped JSX from components
- [x] Actions can use a "type" property or a "rule" property.
- [x] Update README

v0.1.4

- [x] Should be usable via a <script> tag

v0.2.0

- [x] Renames
  - [x] actions -> createActions
  - [x] handlers -> createHandlers
- [x] Framework is now fully isomorphic
  - [x] Provide access to `renderToString` and `renderToStaticMarkup` from react-dom/server
  - [x] Renders isomorphically
  - [x] Attach `locationContext` prop to the application props to manually set the page location for nicer routing
  - [x] You can preload state with data
    - [x] premade component to drop a preload object into our ssr html
    - [x] on load, pull all that stuff into @@DATA on the state
- [x] allow manual usage of testPath function from router
- [x] allow manual usage of test hash path function from router
- [x] Should produce good lighthouse scores
- [x] Expose getState & dispatch to actions
- [x] New When props: dataOk, dataNotOk, dataPending, dataRequested, params

v0.2.1

- [x] Fix readme

v0.2.2

- [x] Add npm keywords

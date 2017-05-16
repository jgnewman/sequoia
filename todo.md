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
- [ ] update live reloader with something that works with node 7
- [x] queriable.countWhere
- [x] queriable.updateWhere
- [x] queriable.subtractWhere
- [x] updateWhere should be able to take a function
- [x] more queriable methods
- [x] is there a nicer way to update state than Object.assign?
- [x] queriable.updateOneWhere
- [x] queriable.subtractOneWhere

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

const { component, createElement, Preload } = require('../bin/index');
const { Router } = require('./iso-shared');

function make(elem, props, children) {
  return createElement(elem, props, children);
}

const Html = component({
  render: ({ message }) => (
    make('html', {}, [
      make('head', {}, [
        make('title', {}, 'My Cool App')
      ]),
      make('body', {}, [
        make('div', {id: 'root'}, [
          make(Router, {})
        ]),
        make(Preload, { state: { message: message } }),
        make('script', {src: '/app.js'})
      ])
    ])
  )
})

const ServerApp = component({
  render: ({ message }) => make(Html, { message: message })
})

module.exports = {
  ServerApp: ServerApp
}
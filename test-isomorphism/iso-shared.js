const { component, createElement, pick, when } = require('../bin/index');

function div(...args) {
  return createElement('div', {}, args);
}

const Home = component({
  observe: state => ({ message: state.message }),
  render: ({ message }) => div('This is home page content.', message)
})

const About = component({
  render: () => div('This is about page content.')
})

const NotFound = component({
  render: () => div('This is 404 page content.')
})

const Router = component({
  render: () => pick(
    when.path('/').choose(Home),
    when.path('/about').choose(About),
    when.otherwise().choose(NotFound)
  )
})

module.exports = {
  Home: Home,
  About: About,
  NotFound: NotFound,
  Router: Router
}
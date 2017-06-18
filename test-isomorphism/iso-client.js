const { component } = require('../bin/index');
const { Router } = require('./iso-shared');

const ClientApp = component({
  el: '#root',
  render: () => <Router />
});
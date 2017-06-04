var domServer = require('react-dom/server');

module.exports = exports = {
  renderToString: domServer.renderToString,
  renderToStaticMarkup: domServer.renderToStaticMarkup
}

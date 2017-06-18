'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Preload = undefined;

var _component = require('./component');

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Writes pre-fetched data into the DOM.
 *
 * @param {Object} props The component props.
 */
var Preload = exports.Preload = (0, _component2.default)({
  name: 'Preload',

  render: function render(props) {

    /*
     * By default, render an empty object.
     */
    var toRender = "{}";

    /*
    * If we get data, pass it through if its a string or
    * stringify it if its an object.
    */
    if (props.state) {
      if (typeof props.state === 'string') {
        toRender = props.state;
      } else {
        toRender = JSON.stringify(props.state);
      }
    }

    /*
    * Spit out a script tag.
    */
    return React.createElement('script', { dangerouslySetInnerHTML: { __html: 'window[\'@@SQ_Preload\'] = ' + toRender } });
  }
});
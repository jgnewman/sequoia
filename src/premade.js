import component from './component';

/**
 * Writes pre-fetched data into the DOM.
 *
 * @param {Object} props The component props.
 */
export const Preload = component({
  name: 'Preload',
  
  render (props) {

    /*
     * By default, render an empty object.
     */
    let toRender = "{}";

    /*
    * If we get data, pass it through if its a string or
    * stringify it if its an object.
    */
    if (props.state) {
      if (typeof props.state === 'string') {
        toRender = props.state;
      } else {
        toRender = JSON.stringify(props.state)
      }
    }

    /*
    * Spit out a script tag.
    */
    return (
      <script dangerouslySetInnerHTML={{__html: `window['@@SQ_Preload'] = ${toRender}`}}></script>
    )

  }
});

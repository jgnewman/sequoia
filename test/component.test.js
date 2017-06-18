import assert from 'assert';
import { shallow } from 'enzyme';
import { component, createState } from '../bin/index';
import { renderToStaticMarkup } from '../server';

describe('Components', function () {

  it('should build a component', function () {

    const Foo = component({
      name: 'Foo',
      render() {
        return <div>'Hello, world!'</div>
      }
    })

    assert.ok(typeof Foo === 'function');

  })

  it('should instantiate a component', function () {

    const Foo = component({
      name: 'Foo',
      render() {
        return <div>'Hello, world!'</div>
      }
    })

    assert.ok(<Foo />)

  })

  it('should mount a component', function () {

    const Foo = component({
      name: 'Foo',
      render() {
        return <div>'Hello, world!'</div>
      }
    })

    const mounted = shallow(<Foo />)

    assert.ok(mounted);

  })

  it('should correctly collect passed in props', function () {
    let result;

    const Foo = component({
      name: 'Foo',
      render(props) {
        result = props.result;
        return <div>'Hello, world!'</div>
      }
    })

    const mounted = shallow(<Foo result="bar" />)

    assert.equal(result, 'bar');

  })

  it('should automatically build a state when necessary', function () {
    let result;

    const Foo = component({
      name: 'Foo',
      createRules(state) {
        result = state;
        return {}
      },
      render(props) {
        return <div>'Hello, world!'</div>
      }
    })

    const mounted = shallow(<Foo />)

    assert.ok(typeof result === 'object');

  })

  it('should map state values to props', function () {

    const Foo = component({
      name: 'Foo',
      state: createState({ bar: 'bar' }),
      observe(state) {
        return {
          bar: state.bar
        }
      },
      render(props) {
        return <div>{props.bar}</div>
      }
    })

    const string = renderToStaticMarkup(<Foo />);

    assert.ok(/bar/.test(string));

  })

})

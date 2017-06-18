import assert from 'assert';
import sinon from 'sinon';
import * as utils from '../bin/utils';

describe('Utils', function () {

  it('`forProps` should iterate over object props', function () {
    const action = sinon.spy();
    utils.forProps({ foo: 'bar', baz: 'quux' }, action);
    assert.ok(action.calledTwice);
  })

  it('`extend` should merge objects into a new object', function () {
    const obj1 = { foo: 'bar' };
    const obj2 = { baz: 'quux' };
    const obj3 = utils.extend(obj1, obj2);
    assert.deepEqual(obj3, { foo: 'bar', baz: 'quux' });
  })

  it('`removeProps` should remove properties from an object', function () {
    const obj = { foo: 'bar', baz: 'quux' };
    const removed = utils.removeProps(obj, ['foo']);
    assert.deepEqual(removed, { baz: 'quux' })
  })

});
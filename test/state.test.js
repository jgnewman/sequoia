import assert from 'assert';
import sinon from 'sinon';
import { createState } from '../bin/index';

describe('State', function () {

  it('should create a state', function () {
    const state = createState({});
    assert.ok(typeof state === 'object');
  })

  it('should get the current state', function () {
    const state = createState({ foo: 'bar' });
    assert.equal(state.get().foo, 'bar');
  })

  it('should get the current state by namespace', function () {
    const state = createState({ foo: { bar: 'baz' } });
    assert.equal(state.get('foo').bar, 'baz');
  })

  it('should automatically create an object if created with no args', function () {
    const state = createState();
    assert.deepEqual(state.get(), {});
  })

  it('should not allow state to be created with a non-object', function () {
    assert.throws(() => createState('foo'));
  })

  it('should detect when state is empty', function () {
    const state1 = createState({});
    const state2 = createState({ foo: 'bar' });

    assert.equal(state1.isEmpty(), true);
    assert.equal(state2.isEmpty(), false);
  })

  it('should detect when a state namespace is empty', function () {
    const state1 = createState({});
    const state2 = createState({ foo: {} });
    const state3 = createState({ foo: { bar: 'baz' } });

    assert.equal(state1.isEmpty('foo'), true);
    assert.equal(state2.isEmpty('foo'), true);
    assert.equal(state3.isEmpty('foo'), false);
  })

  it('should allow state replacement', function () {
    const state = createState();
    const replacement = {};
    state.set(replacement);
    assert.equal(state.get(), replacement);
  })

  it('should not allow direct mutation of the current state', function () {
    const state = createState();
    const vals = state.get();
    vals.foo = 'bar';
    assert.throws(() => state.set(vals));
  })

  it('should run functions before transforming state', function () {
    const state = createState();
    const action = sinon.spy();
    state.beforeTransform(action);
    state.set({});
    assert.ok(action.calledOnce);
  })

  it('should allow updating a namespace', function () {
    const state = createState({ foo: { bar: 'baz' } });
    state.update('foo', { bar: 'quux' });
    assert.equal(state.get('foo').bar, 'quux');
  })

  it('should allow subscribing to state', function (done) {
    const state = createState();
    const action = sinon.spy();
    state.watch(action);
    state.set({});
    setTimeout(() => {
      assert.ok(action.calledOnce);
      done();
    }, 10)
  })

  it('should allow un-subscribing to state', function (done) {
    const state = createState();
    const action = sinon.spy();
    state.watch(action);
    state.unwatch(action);
    state.set({});
    setTimeout(() => {
      assert.ok(!action.calledOnce);
      done();
    }, 10)
  })

});
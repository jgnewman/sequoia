import assert from 'assert';
import sinon from 'sinon';
import { pick, when, setLocationContext } from '../bin/index';

describe('Decisions', function () {

  it('should call a function when a condition is truthy', function () {
    const action = sinon.spy();
    when.ok(true).then(action);
    assert.ok(action.calledOnce);
  })

  it('should return the result of calling `then`', function () {
    const result = when.ok(true).then(() => 'foo');
    assert.equal(result, 'foo');
  })

  it('should return a falsy value when the condition was false', function () {
    const result = when.ok(false).then(() => 'foo');
    assert.ok(!result);
  })

  it('should `pick` the first truthy `when` result', function () {
    const action1 = sinon.spy();
    const action2 = sinon.spy();
    const action3 = sinon.spy();
    pick(
      when.ok(false).choose(action1),
      when.ok(true).choose(action2),
      when.ok(false).choose(action3)
    )
    assert.ok(!action1.called);
    assert.ok(action2.calledOnce);
    assert.ok(!action3.called);
  })

  it('should return the result of a `pick`', function () {
    const result = pick(when.ok(true).choose(() => 'foo'));
    assert.equal(result, 'foo');
  })

  it('should call a function when a condition is false', function () {
    const action = sinon.spy();
    when.notOk(false).then(action);
    assert.ok(action.calledOnce);
  })

  it('should call a function when an array is populated', function () {
    const action = sinon.spy();
    when.populated([1, 2, 3]).then(action);
    assert.ok(action.calledOnce);
  })

  it('should call a function when an array is empty', function () {
    const action = sinon.spy();
    when.empty([]).then(action);
    assert.ok(action.calledOnce);
  })

  it('should always resolve `otherwise` as truthy', function () {
    const action = sinon.spy();
    when.otherwise().then(action);
    assert.ok(action.calledOnce);
  })

  it('should call a function when a path matches', function () {
    const action = sinon.spy();
    setLocationContext({ pathname: '/foo' });
    when.path('/foo').then(action);
    assert.ok(action.calledOnce);
  })

  it('should call a function when a wildcard path matches', function () {
    const action = sinon.spy();
    setLocationContext({ pathname: '/foo/bar' });
    when.path('/foo/*').then(action);
    assert.ok(action.calledOnce);
  })

  it('should call a function when a sub-path matches', function () {
    const action = sinon.spy();
    setLocationContext({ pathname: '/foo/bar' });
    when.path('*/bar').then(action);
    assert.ok(action.calledOnce);
  })

  it('should call a function when a hash matches', function () {
    const action = sinon.spy();
    setLocationContext({ hash: '#foo' });
    when.hash('#foo').then(action);
    assert.ok(action.calledOnce);
  })

  it('should call a function when a wildcard hash matches', function () {
    const action = sinon.spy();
    setLocationContext({ hash: '#foo/bar' });
    when.hash('#foo/*').then(action);
    assert.ok(action.calledOnce);
  })

  it('should call a function when a sub-hash matches', function () {
    const action = sinon.spy();
    setLocationContext({ hash: '#foo/bar' });
    when.hash('#/*/bar').then(action);
    assert.ok(action.calledOnce);
  })

  it('should call a function when query params are matched', function () {
    const action = sinon.spy();
    setLocationContext({ search: '?foo=bar' });
    when.params({ foo: 'bar' }).then(action);
    assert.ok(action.calledOnce);
  })

});
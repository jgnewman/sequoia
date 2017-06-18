import assert from 'assert';
import axios from 'axios';
import { getHttpApi } from '../bin/index';

describe('Http', function () {

  it('should retrieve the http api', function () {
    const api = getHttpApi();
    assert.ok(typeof api === 'object');
  })

  it('should populate the http api', function () {
    const api = getHttpApi();
    assert.ok(Object.keys(api).length);
  })

  it('should use methods that correspond to axios methods', function () {
    const apiKeys = Object.keys(getHttpApi());
    apiKeys.forEach(key => {
      assert.ok(typeof axios[key] === 'function');
    })
  })

});
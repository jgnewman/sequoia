import assert from 'assert';
import sinon from 'sinon';
import { Preload } from '../bin/index';
import { renderToStaticMarkup } from '../server';

describe('Premade', function () {

  it('`Preload` should render a script tag', function () {
    const preload = <Preload state={{ foo: 'bar' }} />;
    const string = renderToStaticMarkup(preload);
    assert.ok(/\<script\>/.test(string));
  })

});
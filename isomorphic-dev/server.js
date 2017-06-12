import React from 'react';
import express from 'express';
import http from 'http';
import path from 'path';
import { application, component, Preload } from '../bin/index';
import { Router, Page1, Page2 } from './components';
import { renderToString, renderToStaticMarkup } from '../server';


const isoApp = express();
const isoServer = http.Server(isoApp);


const Html = component(kit => {
  return ({ path }) => {
    return (
      <html>
        <head>
          <title>
            React Server Rendering
          </title>
        </head>
        <body>
          <div id="root">
            <Router path={path} />
          </div>
          <div id="root2"></div>
          <Preload data={{MY_DATA: "The data came in!"}} />
          <script src="/bundle.js"></script>
        </body>
      </html>
    )
  }
})


const SSRApplication = application(appKit => {
  return () => <Html />
})


isoApp.get('/bundle.js', (req, res) => {
  res.sendFile(path.resolve(__dirname, './', 'client-compiled.js'));
})

isoApp.get('/*', (req, res) => {
  res.send(renderToStaticMarkup(<SSRApplication locationContext={{ pathname: req.url }} />))
});

export { isoServer, isoApp };

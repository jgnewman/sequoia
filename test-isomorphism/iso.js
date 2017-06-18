const path = require('path');
const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const uglify = require('gulp-uglify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const express = require('express');
const http = require('http');

const { createElement, setLocationContext } = require('../bin/index');
const { renderToStaticMarkup } = require('../server');
const { ServerApp } = require('./iso-server');

process.env.NODE_ENV = 'production';

browserify(['./iso-client.js'])
  .transform('babelify')
  .bundle()
  .pipe(source('iso-compiled.js')) // First create a named file package
  .pipe(buffer()) // Then turn that fracker into a gulp-compatible package
  .pipe(uglify())
  .pipe(gulp.dest('./'));

const app = express();

app.get('/app.js', (req, res) => {
  res.sendFile(path.resolve(__dirname, './iso-compiled.js'));
});

app.get('/*', (req, res) => {
  setLocationContext({ pathname: req.url });
  res.send(renderToStaticMarkup(createElement(ServerApp, {message: 'Hello, world!'})));
})

const server = http.createServer(app);
server.listen(8080);
console.log('Listening on 8080');
import gulp from 'gulp';
import clean from 'gulp-clean';
import babel from 'gulp-babel';
import mocha from 'gulp-mocha';
import { server, app } from './dev/server/server';
import { isoServer, isoApp } from './isomorphic-dev/server';
import livereload from 'express-livereload';
import browserify from 'browserify';
import babelify from 'babelify';
import uglify from 'gulp-uglify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import { log } from 'gulp-util';


gulp.task('build:clean', () => {
  return gulp.src('./bin').pipe(clean({ read: false }));
});

gulp.task('build:compile', ['build:clean'], () => {
  return gulp.src('./src/**/*.js')
             .pipe(babel())
             .pipe(gulp.dest('bin'));
});

gulp.task('build', ['build:clean', 'build:compile']);

gulp.task('bundle', ['build'], () => {
  return browserify(['bin/index.js'])
    .bundle()
    .pipe(source('sequoia-min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(gulp.dest('dev/client'))
})

gulp.task('serve:build-client-app', ['build', 'bundle'], () => {
  return browserify(['dev/client/app/dev-app.js'])
    .transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(source('app.js')) // First create a named file package
    .pipe(buffer()) // Then turn that fracker into a gulp-compatible package
    .pipe(gulp.dest('dev/client'));
});

gulp.task('serve', ['build', 'serve:build-client-app'], () => {
  server.listen(8080, () => {
    livereload(app, {
      watchDir: './dev/client'
    });
    log('Dev server listening on port', 8080);
    gulp.watch(['./src/**/*.js', './dev/client/app/**/*.js'], ['serve:build-client-app']);
  });
});

gulp.task('serve:build-iso-app', ['build'], () => {
  return browserify(['isomorphic-dev/client-src.js'])
    .transform('babelify', {presets: ['es2015']})
    .bundle()
    .pipe(source('client-compiled.js')) // First create a named file package
    .pipe(buffer()) // Then turn that fracker into a gulp-compatible package
    .pipe(gulp.dest('isomorphic-dev'));
})

gulp.task('serve-isomorphic', ['build', 'serve:build-iso-app'], () => {
  isoServer.listen(8080, () => {
    gulp.watch(['./src/**/*.js'], ['build', 'serve:build-iso-app']);
    gulp.watch(['./isomorphic-dev/client-src.js'], ['serve:build-iso-app'])
  })
})


gulp.task('test', ['build', 'bundle'], () => {
  return gulp.src(['./test/**/*.js'], { read: false })
             .pipe(mocha({
               reporter: 'spec',
               compilers: ['js:babel-core/register']
             }));
});

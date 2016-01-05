'use sctrict';

/* --------------------------------------------------------
 * IMPORTS
 ---------------------------------------------------------- */
var gulp       = require('gulp');
var plug       = require('gulp-load-plugins')();
var bytediff   = require('gulp-bytediff');
var concat     = require('gulp-concat');
var connect    = require('gulp-connect');
var del        = require('del');
var gulpif     = require('gulp-if');
var jade       = require('gulp-jade');
var jscs       = require('gulp-jscs');
var jshint     = require('gulp-jshint');
var Karma      = require('karma').Server;
var notify     = require('gulp-notify');
var path       = require('path');
var plumber    = require('gulp-plumber');
var rename     = require('gulp-rename');
var replace    = require('gulp-replace');
var sourcemaps = require('gulp-sourcemaps');
var stylus     = require('gulp-stylus');
var uglify     = require('gulp-uglify');
var watch      = require('gulp-watch');
var wrap       = require('gulp-wrap');
var argv       = require('minimist')(process.argv.slice(2));

/* --------------------------------------------------------
 * SETTINGS
 ---------------------------------------------------------- */
var aux = {};
var DEV  = true;
var PATHS = new function() {
  this._root = __dirname;
  this._html = this._root + '';
  this._dist = this._root + '/dist';
  this._src = this._root + '/src';
  this.dist = {
    js: this._dist + '/js',
    css: this._dist + '/css',
    maps: './maps',
    html: this._root + '',
  };
  this.src = {
    js: this._src + '/scripts',
    css: this._src + '/styles',
    html: this._src + '/markup',
  };
};

var BUNDLES = {
  example: {
    js: [
      PATHS.src.js + '/zipgeo.js',
      PATHS.src.js + '/example.js',
    ],
    css: [
      PATHS.src.css + '/base.normalize.styl',
      PATHS.src.css + '/base.scafolding.styl',
      PATHS.src.css + '/+example.styl'
    ],
    html: {
      js: PATHS.src.html + '/index.jade',
      css: PATHS.src.html + '/index.jade'
    }
  }
};

// Error notification settings for plumber
var plumberErrorHandler = {errorHandler: notify.onError({
    title: 'Gulp',
    message: 'Error: <%= error.message %>'
  })
};

var options = {
  env: process.env.NODE_ENV || 'production',
  debug: argv.debug,
  jade: {
    doctype: 'html',
    pretty: DEV ? true : false
  }
};

/* --------------------------------------------------------
 * Pre and Post Compile
 ---------------------------------------------------------- */
function preCompile(bundle, type, stamp) {
  var filename = 'bundle.' + bundle + '_';
  var template = BUNDLES[bundle].html[type];

  // Delete previous file
  del([PATHS.dist[type] + '/**/' + filename + '*.{' + type + ',map}']);

  // Change filename in the markup
  gulp.src(template)
    .pipe(
      replace(
        new RegExp(filename + '([0-9]*)\.' + type),
                   filename + stamp + '.' + type)
                  )
    .pipe(
      gulp.dest(
        path.dirname(template)
      )
    );

  return filename + stamp + '.' + type;
}

/* --------------------------------------------------------
 * HTML Related Tasks
 ---------------------------------------------------------- */
gulp.task('html', function() {
  gulp.src(PATHS.src.html + '/*.{jade,html}')
    .pipe(jade(options.jade))
    .pipe(gulp.dest(PATHS._root))
    .pipe(connect.reload());
});

/* --------------------------------------------------------
 * Styles Compile
 ---------------------------------------------------------- */
function css(bundle) {
  var stamp = timestamp();
  var filename = preCompile(bundle, 'css', stamp);

  // Compile styles
  gulp.src(BUNDLES[bundle].css)
    .pipe(plumber(plumberErrorHandler))
    .pipe(stylus({
      compress: true
    }))
    .pipe(concat(filename))
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write(PATHS.dist.maps))
    .pipe(gulp.dest(PATHS.dist.css))
    .pipe(connect.reload());
}

/* --------------------------------------------------------
 * Scripts Compile
 ---------------------------------------------------------- */
function js(bundle) {
  var stamp = timestamp();
  var filename = preCompile(bundle, 'js', stamp);

  // Compile
  gulp.src(BUNDLES[bundle].js)
    .pipe(plumber(plumberErrorHandler))
    .pipe(concat(filename))
    .pipe(gulpif(!DEV,
      // wrap('(function(){"use strict";<%= contents %>})();'),
      uglify()
    ))
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write(PATHS.dist.maps))
    .pipe(gulp.dest(PATHS.dist.js))
    .pipe(connect.reload());
}

/* --------------------------------------------------------
 * JS Profiling and Tests
 ---------------------------------------------------------- */
gulp.task('jshint', function() {
  gulp.src('website/static/js/**/*.js')
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'))
    .pipe(notify({
      title: 'JSHint',
      message: 'JSHint Passed.',
    }));
});

gulp.task('jscs', function() {
  gulp.src('website/static/js/*.js')
    .pipe(jscs())
    .pipe(notify({
      title: 'JSCS',
      message: 'JSCS Passed.'
    }));
});

gulp.task('lint', ['jshint', 'jscs'], function() {
  gulp.src('/')
    .pipe(notify({
      title: 'Task JS',
      message: 'Successfully linted js.'
    }));
});

gulp.task('jstest', function() {
  new Karma({
    configFile: __dirname + '/.karma.conf.js'
  }).on('error', function(err) {
    throw err;
  }).start();
});

/* --------------------------------------------------------
 * Bundle Tasks
 ---------------------------------------------------------- */
gulp.task('css-example', function() { css('example'); });
gulp.task('js-example', function() { js('example'); });

/* --------------------------------------------------------
 * General Tasks
 ---------------------------------------------------------- */
/**
 * List all available gulp tasks
 */
gulp.task('help', plug.taskListing);

// Compile new source content
gulp.task('watch', function() {
  gulp.watch(BUNDLES.example.js, ['js-example']);
  gulp.watch(BUNDLES.example.css, ['css-example']);
  gulp.watch(PATHS.src.html + '/*.*', ['html']);
});

gulp.task('webserver', function() {
  connect.server({
    port: 8101,
    livereload: {
      port: 35720
    },
    root: ['.', PATHS._dist]
  });
});

gulp.task('bundling', [
  'css-example', 'js-example'
]);

gulp.task('default', ['bundling','watch','webserver']);

/* --------------------------------------------------------
 * Utils
 ---------------------------------------------------------- */
/**
 * Formatter for datetime to rename
 * bundle filenames and avoid cache
 */
function timestamp() {
  var date = new Date();

  // always returns a string
  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  return date.getFullYear() +
         pad2(date.getMonth() + 1) +
         pad2(date.getDate()) +
         pad2(date.getHours()) +
         pad2(date.getMinutes()) +
         pad2(date.getSeconds());
};

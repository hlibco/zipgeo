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
var nano       = require('gulp-cssnano');
var notify     = require('gulp-notify');
var plumber    = require('gulp-plumber');
var rename     = require('gulp-rename');
var replace    = require('gulp-replace');
var sass       = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify     = require('gulp-uglify');
var watch      = require('gulp-watch');
var wrap       = require('gulp-wrap');
var argv       = require('minimist')(process.argv.slice(2));

/* --------------------------------------------------------
 * SETTINGS
 ---------------------------------------------------------- */
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
      PATHS.src.css + '/base.normalize.scss',
      PATHS.src.css + '/base.scafolding.scss',
      PATHS.src.css + '/+example.scss'
    ],
    html: {
      js: PATHS._html + '/example.html',
      css: PATHS._html + '/example.html'
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
  debug: argv.debug
};

/* --------------------------------------------------------
 * Styles Compile
 ---------------------------------------------------------- */
function css(bundle) {
  var stamp = timestamp();
  var toFile = 'bundle.' + bundle + '_' + stamp + '.css';

  // Remove old files
  del([PATHS.dist.css + '/**/bundle.' + bundle + '_*.{css,map}']);

  // Compile styles
  gulp.src(BUNDLES[bundle].css)
    .pipe(plumber(plumberErrorHandler))
    .pipe(concat(toFile))
    .pipe(sass().on('error', sass.logError))
    .pipe(gulpif(!DEV,
      bytediff.start(),
      nano(),
      bytediff.stop(bytediffFormatter)
    ))
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write(PATHS.dist.maps))
    .pipe(gulp.dest(PATHS.dist.css))
    .pipe(connect.reload());

  // Cache busting
  gulp.src(BUNDLES[bundle].html.css)
    .pipe(replace(new RegExp('bundle.' + bundle + '_([0-9]*)\.css'), toFile))
    .pipe(gulp.dest(PATHS._html))
    .pipe(connect.reload());
};

/* --------------------------------------------------------
 * Scripts Compile
 ---------------------------------------------------------- */
function js(bundle) {
  var stamp = timestamp();
  var toFile = 'bundle.' + bundle + '_' + stamp + '.js';

  // Remove old files
  del([PATHS.dist.js + '/**/bundle.' + bundle + '_*.{js,map}']);

  // Compile
  gulp.src(BUNDLES[bundle].js)
    .pipe(plumber(plumberErrorHandler))
    .pipe(concat(toFile))
    .pipe(gulpif(!DEV,
      bytediff.start(),
      uglify(),
      // wrap('(function(){"use strict";<%= contents %>})();')
      bytediff.stop(bytediffFormatter)
    ))
    .pipe(sourcemaps.init())
    .pipe(sourcemaps.write(PATHS.dist.maps))
    .pipe(gulp.dest(PATHS.dist.js))
    .pipe(connect.reload());

  // Cache busting
  gulp.src(BUNDLES[bundle].html.js)
    .pipe(replace(new RegExp('bundle.' + bundle + '_([0-9]*)\.js'), toFile))
    .pipe(gulp.dest(PATHS._html))
    .pipe(connect.reload());
};

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
 * HTML Related Tasks
 ---------------------------------------------------------- */
gulp.task('html', function() {
  return gulp.src(PATHS.src.html + '/*.{jade,html}')
    .pipe(jade({
      pretty: DEV ? true : false
    }))
    .pipe(gulp.dest(PATHS._root))
    .pipe(connect.reload());
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

gulp.task('watch', function() {
  gulp.watch(BUNDLES.example.js, ['js-example']);
  gulp.watch(BUNDLES.example.css, ['css-example']);
  gulp.watch(PATHS.src.html + '/*.*', ['html']);
});

gulp.task('livereload', function() {
  gulp.src([PATHS.dist.js, PATHS.dist.css, PATHS._html])
    .pipe(connect.reload());
});

gulp.task('webserver', function() {
  connect.server({
    livereload: true,
    root: ['.', PATHS._dist]
  });

});

gulp.task('default', ['watch','livereload','webserver']);

/* --------------------------------------------------------
 * Utils
 ---------------------------------------------------------- */
/**
 * Formatter for bytediff to display the size changes after processing
 *
 * @param  {Object} data - byte data
 * @return {String}      Difference in bytes, formatted
 */
function bytediffFormatter(data) {
  var percent = ((1 - data.percent) * 100).toFixed(precision = 2);
  var difference = (data.savings > 0) ? ' smaller.' : ' larger.';
  return data.fileName + ' went from ' +
    (data.startSize / 1000).toFixed(2) +
    ' kB to ' + (data.endSize / 1000).toFixed(2) + ' kB' +
    ' and is ' + percent + '%' + difference;
}

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

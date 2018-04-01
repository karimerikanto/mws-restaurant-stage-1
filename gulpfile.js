var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var webp = require('gulp-webp');
var cssmin = require('gulp-cssmin');
var rename = require('gulp-rename');

gulp.task('default', ['images', 'styles', 'scripts'], function() {});

gulp.task('dist', [
	'copy-html',
	'copy-images',
	'styles',
	'lint',
	'scripts-dist'
]); 

gulp.task('scripts', function() {
	gulp.src(['develop/js/main.js', 'develop/js/general/*.js'])
		.pipe(babel({
			"presets": ["es2015"]
		}))
		.pipe(uglify())
		.pipe(concat('main.js'))
		.pipe(gulp.dest('js'));
		
	gulp.src(['develop/js/restaurant_info.js', 'develop/js/general/*.js'])
		.pipe(babel({
			"presets": ["es2015"]
		 }))
		.pipe(uglify())
		.pipe(concat('restaurant_info.js'))
		.pipe(gulp.dest('js'));
});

gulp.task('images', function() {
    gulp.src('develop/img/*')
        .pipe(webp())
        .pipe(gulp.dest('img'));
});

gulp.task('styles', function() {
	gulp.src('develop/css/*.css')
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
        .pipe(cssmin())
        .pipe(rename({suffix: '.min'}))
		.pipe(gulp.dest('css'));
});
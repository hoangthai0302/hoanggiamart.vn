var gulp = require('gulp');
var sass = require('gulp-sass');
var merge = require('merge-stream');
var livereload = require('gulp-livereload');

gulp.task('sass', function () {
    gulp.src('public/css/**/*.scss')
        .pipe(sass()) // Converts Sass to CSS with gulp-sass
        .pipe(gulp.dest('public/css'))
        .pipe(livereload());
});

gulp.task('default', function () {
    livereload.listen();
    gulp.watch('public/css/**/*.scss', ['sass']);
})
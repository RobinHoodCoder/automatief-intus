"use strict";
const { src, dest, parallel, series } = require('gulp');
const gulp = require('gulp');
const htmlmin = require('gulp-htmlmin');
const inject = require('gulp-inject');
var uglify = require('gulp-uglify');

// Vendors with bower
const mainBowerFiles = require('main-bower-files');

// const pug = require('gulp-pug');

const postcss = require("gulp-postcss");
const flatten = require("gulp-flatten");

const autoprefixer = require('autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const less = require('gulp-less');
const browsersync = require("browser-sync").create();
const cssnano = require("cssnano");
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const newer = require('gulp-newer');
const plumber = require("gulp-plumber");
const eslint = require("gulp-eslint");
const del = require("del");

const babel = require('gulp-babel');


const webpack = require("webpack");
const webpackconfig = require("./webpack.config.js");
const webpackstream = require("webpack-stream");


// function html() {
//     return src('src/templates/*.pug')
//         .pipe(pug())
//         .pipe(dest('build/html'))
// }

// BrowserSync
function browserSync(done) {
    browsersync.init({
        server: {
            baseDir: "./build/"
        },
        port: 3000
    });
    done();
}

// BrowserSync Reload
function browserSyncReload(done) {
    browsersync.reload();
    done();
}

function injectLinksToHTML(){
    const htmltarget = ('./src/index.html');
    return src(htmltarget)
        .pipe(inject(
            src([
                './build/assets/vendors/**/*.css',
                './build/assets/css/**/*.css',
                './build/assets/vendors/**/*.js',
                './build/assets/js/**/*.js'
            ],
                {
                    read: false
                }
                ),{
                ignorePath: 'build',
                addRootSlash: false,
                addPrefix: '.'
                }

        ))
        .pipe(dest('src/'));
}

//Kopieer all main bower files vanuit components (alleen buildfiles)
function updatevendors(){
    return src(mainBowerFiles(), { base: './components/' })
        .pipe(plumber(function (err) {
            console.log('Bower Task Error');
            console.log(err);
        }))
        .pipe(gulp.dest('./src/assets/vendors'));
}

//Copy html naar build map
function htmldest() {
    return src("./src/**/*.html")
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(dest('./build/'));
}

//Copy html naar build map
function jsonCopy() {
    return src("./src/ajax/**/*.json")
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(dest('./build/ajax/'));
}

// Lint scripts
function scriptsLint() {
    return src(["./src/vendors/**/*","./src/assets/js/**/*", "./gulpfile.js"])
        .pipe(plumber())
        .pipe(eslint())
        .pipe(eslint.format());
        // .pipe(eslint.failAfterError()); //=== Verander deze als je js niet wilt processen als er errors zijn
}

//Zet alle scripts bij elkaar met sourcemap
function scripts() {
    return src(['./src/assets/js/**/*.js'])
        // .pipe(sourcemaps.init())
        .pipe(plumber())
        /*
        * DONE: Babel werkend voor Internet Explorer
        * */
        .pipe(babel({
            presets: ['minify','@babel/env']
        }))
        .pipe(webpackstream(webpackconfig, webpack)) //Webpack is voor in de toekomst...
        // .pipe(concat('scripts.min.js'))
        // .pipe(uglify()) //Zet deze uit voor sneller compilen
        // .pipe(sourcemaps.write('.'))
        .pipe(dest('./build/assets/js'))
        .pipe(browsersync.stream());
}
// function babelMinify() {
//     return src("./build/assets/js/scripts.min.js")
//     .pipe(babel({presets: ['minify','@babel/preset-env']}))
//     .pipe(gulp.dest("./build/assets/js/min"));
// }
// gulp.task(babelMinify);



//Zet alle less files bij elkaar en exporteer naar css in build
function css() {
    return src('src/assets/styles/*.less')
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(less())
        .pipe(postcss([autoprefixer(), cssnano()])) //Minify en autoprefixer. Zet deze om voor productie
        .pipe(sourcemaps.write())
        .pipe(dest('build/assets/css'))
        .pipe(browsersync.stream());
}



//Concat and Compress Vendor .js files
// Deze moet nog bij o.a. watch komen.
// Main bower files ook nog?
function vendorjs(){
    return src(        [
        'src/assets/vendors/jquery/dist/jquery.js',
        'src/assets/vendors/**/*.js'
    ],{ sourcemaps: true })
        .pipe(uglify())
        .pipe(concat('vendorsjs.min.js'))
        .pipe(dest('build/assets/vendors', { sourcemaps: true }));
}
// Gooi alle vendorscss uit bower plugins bij elkaar en zet ze in het build mapje
function vendorcss(){
    return src(['src/assets/vendors/**/*.css'])
        .pipe(postcss([autoprefixer(), cssnano()]))
        .pipe(concat('vendorscss.min.css'))
        .pipe(dest('build/assets/vendors', { sourcemaps: true }));
}

function miscfiles(){
    return src([
        'src/site.webmanifest'
    ])
    .pipe(dest('./build', { sourcemaps: true }));
}


// Schoon alles op in assets (voor build)
function clean() {
    return del(["./build/assets/**/*"]);
}

// Optimize alle afbeeldingen in image folder en kopieer naar build
function images() {
    return gulp
        .src("src/assets/images/**")
        .pipe(newer("build/assets/images"))
        .pipe(
            imagemin([
                imagemin.gifsicle({ interlaced: true }),
                imagemin.jpegtran({ progressive: true }),
                imagemin.optipng({ optimizationLevel: 5 }),
                imagemin.svgo({
                    plugins: [                        {
                            removeViewBox: false,
                            collapseGroups: true
                        }
                    ]
                })
            ])
        )
        .pipe(gulp.dest("./build/assets/images/"));
}
// Optimize alle afbeeldingen van vendors mapje en kopieer naar build
// Nu ook met SVG's
function vendimages() {
    return gulp
        //Pak alleen de afbeeldingen... anders gaat het fout..
        .src("./src/assets/vendors/**/*.{JPG,jpg,png,gif,svg}")
        .pipe(newer("./build/assets/vendors"))
        .pipe(
            imagemin([
                imagemin.gifsicle({ interlaced: true }),
                imagemin.jpegtran({ progressive: true }),
                imagemin.optipng({ optimizationLevel: 5 }),
                imagemin.svgo({
                    plugins: [                        {
                        removeViewBox: false,
                        collapseGroups: true
                    }
                    ]
                })
            ])
        )
        //Zet alle afbeeldingen in dezelfde root map ipv in de oude vendors folder locatie
        .pipe(flatten())
        .pipe(gulp.dest("./build/assets/vendors/"));
}

// Bekijk wat er veranderd en voer taken uit
function watchFiles() {
    gulp.watch("./src/assets/styles/**/*", css);
    gulp.watch("./src/ajax/**/*", jsonCopy);
    gulp.watch("./src/assets/js/**/*", gulp.series(scriptsLint, scripts)); //Controle van alle scripts
    gulp.watch(
        [
            "./src/*.html",
        ],
        gulp.series(htmldest,browserSyncReload)
    );
    gulp.watch("./src/assets/images/**/*", images);
}


//Combineer complexe taken
const vendors = series(updatevendors,parallel(vendorcss, vendorjs, vendimages));
const js = series(scriptsLint, scripts);

//const build = gulp.series(clean, gulp.parallel(css, images, scripts)); -- original
// const build = series(clean, parallel(css, images, scripts, vendorcss, vendorjs, vendimages)); // -- custom
const build = series(clean,updatevendors,parallel(css, images, scripts, vendorcss, vendorjs, vendimages, jsonCopy, series(injectLinksToHTML,htmldest,miscfiles))); // -- custom



const watch = parallel(watchFiles, browserSync);

// Kopieër alle js & html files, then inject paths to src html file, then copy src html to dist folder
//Schoon assets op. Update alle vendor files vanuit components mapje. Combineer en process daarna alle vendor files.
//Tegelijkertijd ook alle andere css en afbeeldingen processen
//Als dit allemaal gedaan is, inject dan de paden van alle css en js files in index.html
const html =  series(clean,updatevendors,parallel(vendorcss,vendorjs,css,scripts,vendimages, images, series(injectLinksToHTML,htmldest)));


// export tasks
exports.vendors = vendors;
exports.html = html;
exports.miscfiles = miscfiles;

exports.injectHTML = injectLinksToHTML;
exports.images = images;
exports.vendimages = vendimages;
exports.css = css;
exports.js = js;

exports.vendorjs = vendorjs;

exports.clean = clean;
exports.build = build;
exports.watch = watch;
exports.default = build;
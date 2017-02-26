# Tiny Preprocessor

> A tiny DEV vs PROD preprocessor for JS and TS code

It's super annoying to have to strip out logging and debug code, or to have to clean up values and function arguments that were changed to make debugging and testing easier during development, particularly if your development-only code is necessary for ongoing development between releases.

The library exports a single function -- `preprocess` -- which takes a string argument (your source code), transforms it according to preprocessor comments you've included, then returns the result.

Insert it into your preferred build pipeline so that your source is transformed before being passed to any transpilers, compilers, or just directly copied to a distributable folder. Be sure to run your test suite after preprocessing, to make sure you haven't accidentally broken your library with erroneous preprocessor comments.

During development, compile and test using whatever regular process you use outside of production builds, and keep the
production build process separate for when you're ready to release.

## Preprocessor Syntax:

Preprocessor blocks are simply IF or IF-ELSE constructs. They start with `## DEV|PROD`, and are terminated with another
`##` token. `// ## DEV ##` comments affect the entire line. Square brackets `[[` and `]]` define the start and end of an
affected block of code. Both forms of comment syntax are supported, depending on your needs. Typically your
production-only code blocks will be contained within block comments, seeing as you don't want them to be active during
development.

```js
// --- OMIT A SINGLE LINE ----------------------------------------------------

log("This line will be excluded from the build"); // ## DEV ##

// --- OMIT A WHOLE BLOCK ----------------------------------------------------

// ## DEV [[
console.warn('This line will be excluded.');
write('This line too.');
// ]] ##

// --- USE A DIFFERENT VALUE IN PRODUCTION -----------------------------------

var value = /* ## DEV [[ */ 3 /* ]] ELSE [[ 27 ]] ## */;
// The production build for the above line will render as:
var value = 27;

// ## DEV [[
trace.silent(status1);
trace.silent(status2);
/* ]] ELSE [[
trace.verbose(status1);
trace.verbose(status2);
]] ## */

// The production build for the above lines will render as:
trace.verbose(status1);
trace.verbose(status2);

// --- PRODUCTION-ONLY CODE --------------------------------------------------

/* ## PROD [[
trace.verbose(status1);
trace.verbose(status2);
]] ## */

// The production build for the above lines will render as:
trace.verbose(status1);
trace.verbose(status2);
```

## Installation

```bash
$ npm install --save-dev tiny-preprocessor
```

or

```bash
$ yarn add --dev tiny-preprocessor
```

## Usage

```js
import {preprocess} from 'tiny-preprocessor';

const input = '... some source code ...';
const output = preprocess(input);
```

## Gulp

I like to use Gulp, so this is how I use tiny-preprocessor:

```js
// gulpfile.js

const {preprocess} = require(`tiny-preprocessor`);
const gulp = require(`gulp`);
const merge = require(`merge2`);
const plumber = require(`gulp-plumber`);
const sourcemaps = require(`gulp-sourcemaps`);
const transform = require(`gulp-transform`);

// ...

function preprocessSourceText(buffer) {
  return preprocess(buffer.toString());
}

function prebuild() {
  return merge([
    gulp.src(`src/**/*.ts`)
      .pipe(plumber())
      .pipe(transform(preprocessSourceText))
      .pipe(gulp.dest(`.build/ts`)), // copy to a temporary build folder (omitted from the repo and npm)

    gulp.src(`tests/**/*.ts`)
      .pipe(plumber())
      .pipe(transform(preprocessSourceText))
      .pipe(transform(replace(/\.\.\/src/g, `../ts`))) // fix paths so that tests will still compile
      .pipe(gulp.dest(`.build/ts.tests`)),
  ]);
}

// ...

function compile() {
  // your compile function should read from the build folder, e.g. .build/* in this case
  const src = gulp.src(`.build/ts/**/*.ts`)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    // ...
    ;
  
  const tests = gulp.src(`.build/ts.tests/**/*.ts`)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    // ...
    ;
  
  return merge([
    src,
    tests
  ]);
}

gulp.task(`prebuild`, prebuild);
gulp.task(`compile`, [`prebuild`], compile);

// ...
```
/*
  Preprocessor Directives
  =======================

  // --- OMIT A SINGLE LINE ----------------------------------------------------

  log("This line will be excluded from the build"); // ## DEV ##

  // --- OMIT A WHOLE BLOCK ----------------------------------------------------

  // ## DEV [[
  console.warn('This line will be excluded.');
  write('This line too.');
  // ]] ##

  // --- USE A DIFFERENT VALUE IN PRODUCTION -----------------------------------

  var value = ⁄* ## DEV [[ *⁄ 3 ⁄* ]] ELSE [[ 27 ]] ## *⁄;
  // The production build for the above line will render as:
  var value = 27;

  // ## DEV [[
  trace.silent(status1);
  trace.silent(status2);
  /* ]] ELSE [[
  trace.verbose(status1);
  trace.verbose(status2);
  ]] ## *⁄

  // The production build for the above lines will render as:
  trace.verbose(status1);
  trace.verbose(status2);

  // --- PRODUCTION-ONLY CODE --------------------------------------------------

  ⁄* ## PROD [[
  trace.verbose(status1);
  trace.verbose(status2);
  ]] ## *⁄

  // The production build for the above lines will render as:
  trace.verbose(status1);
  trace.verbose(status2);
*/

function preprocess(src) {
  let next = 'start', type = '';
  const rxStart = /(?:\/\*|(.*)\/\/) ## (DEV|PROD) (##|\[\[) *(?:\*\/)?/g;
  const rxElse = /(?:\/\*|\/\/ )? *\]\] (?:(ELSE) \[\[|##) *(?:\*\/)?/g;
  const rxEnd = /(?:\/\*|\/\/ )? *\]\] ##(?: \*\/)?/g;
  let rx = rxStart, out = '', i = 0;
  for(let match = rx.exec(src); match; match = rx.exec(src)) {
    switch(next) {
      case 'start': {
        type = match[2];
        out += src.substring(i, match.index);
        next = match[3] === '[[' ? 'else' : 'start';
        break;
      }
      case 'else': {
        if(type === 'PROD') {
          out += src.substring(i, match.index);
        }
        if(match[1] === 'ELSE') {
          type = type === 'PROD' ? 'DEV' : 'PROD';
          next = 'end';
        }
        else {
          next = 'start';
        }
        break;
      }
      case 'end':
        if(type === 'PROD') {
          out += src.substring(i, match.index);
        }
        next = 'start';
        break;
    }
    switch(next) {
      case 'start': rx = rxStart; break;
      case 'else': rx = rxElse; break;
      case 'end': rx = rxEnd; break;
    }
    rx.lastIndex = i = match.index + match[0].length;
  };
  out += src.substr(i);
  out = out.replace(/^(\r?\n){2,}/mg, `$1`);
  return out;
}

module.exports = {preprocess};
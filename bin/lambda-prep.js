#!/usr/bin/env node
/* eslint-disable no-console */

/*
This helper script builds a package that claudia can use to update our lambda function.
The issue is that a couple of our dependencies expect to be transpiled before use. Browserify
handles this transpilation for us in the browser, but we need to take care of it ourselves for
claudia.

This script follows the steps outlined at https://claudiajs.com/tutorials/packaging.html, but we
add a step to transpile dependencies that need transpiling. Once we've built the package,
you tell claudia to update the lambda function like so:

`claudia update --version stage --source package/ --use-local-dependencies`
*/

let fs = require('fs');
let { execSync } = require('child_process');

function exec(command) {
  return execSync(command, {encoding: 'utf-8'});
}

console.log(`packing`);
// Claudia will first run npm pack to produce the source package,
let tgz = exec(`npm pack`).trim();

console.log(`unzipping`);
// then unpack the archive in a temporary directory to generate a clean package,
// (unpacks to ./package)
exec(`tar -x -z -f ${tgz}`);

exec(`rm ${tgz}`);

process.chdir(`package`);

console.log(`transpiling`);
let babel = `../node_modules/.bin/babel`;
exec(`${babel} src -d src`); // transpile in place
// transpile the lambda.js function
exec(`${babel} lambda.js --out-file lambda.js`);

console.log(`installing`);
// then download the dependencies
exec(`yarn install --production`);

// Identify dependencies that specify a 'babelify' transform in its package.json
let babelifyPackages = fs.readdirSync(`node_modules`)
  // ignore dot files
  .filter((dir) => /^(?![.])/.test(dir))
  // find 'babelify' transforms
  .filter((dir) => {
    let { browserify = {} } = require(`${process.cwd()}/node_modules/${dir}/package`);
    let { transform = [[]] } = browserify;
    return transform[0][0] === 'babelify';
  });

// transpile each babelify dependency in place
console.log(
  babelifyPackages.map((dir) => exec(`${babel} node_modules/${dir} -d node_modules/${dir} --presets=es2015`)).join('\n\n')
);

// claudia needs the claudia.json file in the package directory
exec(`cp ../claudia.json .`);

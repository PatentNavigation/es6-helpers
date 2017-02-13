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

let fs = require('fs-extra');
let path = require('path');
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

console.log(`yarn install --production`);
// then download the dependencies
exec(`yarn install --production`);

function listFiles(dir) {
  return fs.readdirSync(dir)
    // ignore dot files
    .filter((file) => /^(?![.])/.test(file));
}
// then fix the damn .bin links
// yarn's node_modules/.bin directory is full of relative symbolic links to the global
// yarn cache. These links break when the package directory is packaged up for lambda.

function fixDamnSymlink(symLink) {
  let realFile = fs.realpathSync(symLink);
  if (realFile !== symLink) {
    fs.copySync(realFile, symLink, { overwrite: true });
    let ax = 493; // 493 is the decimal version of the verboten octal literal 0755
    fs.chmodSync(symLink, ax);
  }
}

function fixBinsInPackages(nodeModulesDir) {
  if (!fs.existsSync(nodeModulesDir)) {
    return;
  }
  console.log(`fixing bins in ${nodeModulesDir}`);
  let packageBin = path.join(nodeModulesDir, `.bin`);
  if (fs.existsSync(packageBin)) {
    listFiles(packageBin).forEach((symLink) => fixDamnSymlink(path.join(packageBin, symLink)));
  }
  let packages = listFiles(nodeModulesDir);
  // fix .bin directories in the packages
  packages.forEach((packageDir) => {
    fixBinsInPackages(path.join(nodeModulesDir, packageDir, `node_modules`));
  });
}

fixBinsInPackages(`node_modules`);

// Identify dependencies that specify a 'babelify' transform in its package.json
let babelifyPackages = listFiles(`node_modules`)
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

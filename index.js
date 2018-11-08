#!/usr/bin/env node
const shell = require("shelljs");
const colors = require("colors");
const rimraf = require("rimraf");
const { spawn } = require("child_process");
const fs = require("fs");

const APP_NAME = process.argv[2];
const APP_DIRECTORY = `${process.cwd()}/${APP_NAME}`;
const TEMPLATES = require("./templates/templates");
const SCRIPTS = {
  dev: "next -p 7777",
  build: "next build",
  start: "next start",
  test: "NODE_ENV=test jest --watch",
  "heroku-postbuild": "next build"
};

const createReactApp = () => {
  return new Promise((resolve, reject) => {
    if (APP_NAME) {
      console.log(
        `\nInstalling packages. This might take a couple of minutes.\nInstalling react, react-dom, and react-scripts...`
          .yellow
      );
      shell.exec(
        `create-react-app ${APP_NAME} --use-npm`,
        { silent: true, async: true },
        (code, stdout, stderr) => {
          // if there is an erorr code output error message
          if (code !== 0) {
            console.log(`CRA produced the following error:`.red);
            console.log("Program stderr:", stderr);
          }

          console.log("Create React App template created sucessfully.\n".green);
          resolve(true);
        }
      );
    } else {
      console.log("\nNo app name was provided.".red);
      console.log("\nProvide an app name in the following format: ");
      console.log("\ncreate-next-apollo-app", "<your-app-name>\n".cyan);
      resolve(false);
    }
  });
};

const cdIntoNewApp = () => {
  return new Promise((resolve, reject) => {
    shell.cd(APP_NAME);
    resolve();
  });
};

const installPackages = () => {
  return new Promise((resolve, reject) => {
    console.log("Installing Next and Apollo...".yellow);
    shell.exec(
      `npm install --save next next-with-apollo apollo-boost apollo-client react-apollo graphql graphql-tag styled-components prop-types`,
      { silent: true },
      (code, stdout, stderr) => {
        if (code !== 0) {
          console.log(`CRA produced the following error:`.red);
          console.log("Program stderr:", stderr);
          resolve(false);
        }
        resolve(true);
      }
    );
  });
};

const updateTemplates = () => {
  return new Promise(resolve => {
    let promises = [];
    // Delete default template src and public directory
    console.log("Replacing templates...".yellow);

    shell.rm("-rf", "src");
    shell.rm("-rf", "public");

    shell.mkdir(
      "-p",
      ["/pages", "/components", "/lib"].map(e => `${APP_DIRECTORY}/${e}`)
    );

    shell.exec(
      `json -I -f package.json -e 'this.scripts=${JSON.stringify(SCRIPTS)}'`,
      {
        silent: true
      }
    );

    // Write custom template files
    Object.keys(TEMPLATES).forEach((fileName, i) => {
      promises[i] = new Promise(resolve => {
        console.log(`Creating ${fileName}`);
        if (fileName.startsWith("_") || fileName === "index.js") {
          fs.writeFile(
            `${APP_DIRECTORY}/pages/${fileName}`,
            TEMPLATES[fileName],
            function(err) {
              if (err) {
                return console.log(err);
              }
              resolve();
            }
          );
        } else if (fileName[0] === fileName[0].toUpperCase()) {
          fs.writeFile(
            `${APP_DIRECTORY}/components/${fileName}`,
            TEMPLATES[fileName],
            function(err) {
              if (err) {
                return console.log(err);
              }
              resolve();
            }
          );
        } else if (fileName === "config.js") {
          fs.writeFile(
            `${APP_DIRECTORY}/${fileName}`,
            TEMPLATES[fileName],
            function(err) {
              if (err) {
                return console.log(err);
              }
              resolve();
            }
          );
        } else {
          fs.writeFile(
            `${APP_DIRECTORY}/lib/${fileName}`,
            TEMPLATES[fileName],
            function(err) {
              if (err) {
                return console.log(err);
              }
              resolve();
            }
          );
        }
      });
    });
    Promise.all(promises).then(() => {
      resolve();
    });
  });
};

const run = async () => {
  const success = await createReactApp();
  if (!success) {
    console.log(
      "Something went wrong while trying to create a new React app using create-react-app"
        .red
    );
    return false;
  }
  await cdIntoNewApp();
  await installPackages();
  await updateTemplates();
  console.log(`\nDone! 🎊`.green);
  console.log(`Start by typing:\n`.green);
  console.log(`cd hello`.cyan);
  console.log(`npm run dev\n`.cyan);
  console.log(`Happy hacking! 💻`.green);
};

run();

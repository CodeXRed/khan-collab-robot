"use strict"

const {login} = require("./session");
const {updateProgram} = require("./programs");
const {pollCommandsFromNotifications} = require("./poll_commands");

let username = process.env.USERNAME;
let password = process.env.PASSWORD;

function checkForNewCommands(cookies) {
    console.log("checking for new posts");

    // TODO: crappy job here
    pollCommandsFromNotifications(cookies);
}

//capture results so that they aren't printed to the console
let _ = (async function() {
    console.log("logging in...");
    let cookies = await login(username, password);
    console.log("logged in");

    checkForNewCommands(cookies);

    setInterval(() => {
        checkForNewCommands(cookies);
    }, 1000 * 10);
})();

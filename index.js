"use strict"

const axios = require("axios");
const cookieHelper = require("./cookies.js");
const {getSessionCookies, login} = require("./session.js");
const PROGRAM_DEFAULT_JSON = require("./constants").PROGRAM_SAVE_JSON_DEFAULT;

//returns the parsed program JSON from the API
async function getProgramJSON(id) {
    return axios.get("https://www.khanacademy.org/api/internal/scratchpads/" + id).then(response => { return response.data; });
}

// ?cache-numb-er??????????_(new Date()).getTime()

function getQueryTime() {
    var now = new Date();

    var timeZone = now.toTimeString();
    timeZone = timeZone.substring(timeZone.indexOf("GMT") + 3, timeZone.indexOf("GMT") + 8);
    timeZone = timeZone.substring(0, 3) + ":" + timeZone.substring(3);

    //TODO: this needs to be cleaned up, and also stablized
    return (new Date(now.getTime() - now.getTimezoneOffset() * 60000)).toISOString().substring(0, 19) + timeZone;
}

async function updateProgram(cookies, programId, programType, code, settings={}) {
    var programJson = await getProgramJSON(programId); //get the program's JSON, is this necessary?

    var jsonToSend = {
        ...PROGRAM_DEFAULT_JSON,
        ...programJson,
        "relativeUrl": "/computer-programming/_/" + programId,
        "id": parseInt(programId),
        "date": (new Date()).toISOString().substring(0, 19) + "Z",
        "revision": {
            ...PROGRAM_DEFAULT_JSON.revision,
            ...programJson.revision,
            "code": code
        },
        "trustedRevision": {
            "created": (new Date()).toISOString()
        },
        ...settings
    };
    
    return axios.put(`https://www.khanacademy.org/api/internal/scratchpads/${programId}?client_dt=${getQueryTime()}&lang=en`, jsonToSend, {
            headers: {
                Cookie: cookieHelper.cookiesToCookieString(cookies),
                "X-KA-FKey": cookieHelper.getCookieValue(cookies, "fkey")
            }});
}

async function commentAtRoot(commentURL, text, cookies) {
    var commentJSON = {
        "fromVideoAuthor": false,
        "shownLowQualityNotice": false,
        "text": text,
        "topic_slug": "computer-programming"
    }

    axios.post(commentURL + `?casing=camel&lang=en&_=190828-1155-f259d8dcd107_${Date.now()}`, commentJSON, {
        headers: {
            Cookie: cookieHelper.cookiesToCookieString(cookies),
            "X-KA-FKey": cookieHelper.getCookieValue(cookies, "fkey")
        }
    });
};

let username = process.env.USERNAME;
let password = process.env.PASSWORD;

//capture results so that they aren't printed to the console
let _ = (async function() {
    let sessionCookies = await getSessionCookies();
    console.log("got session cookies!");

    let loginCookies = await login(username, password, sessionCookies);

    let cookies = cookieHelper.mergeCookies(sessionCookies, loginCookies);

    //check that you are logged in
    console.assert((await axios.get("https://khanacademy.org", cookieHelper.genCookieHeader(cookies))).data.indexOf(username) >= 0,
        {errorMsg: "Not logged in correctly! When opening up khanacademy.org, it shows default page"});

    console.log("logged in!");

    updateProgram(cookies, process.env.TEST_PROGRAM, "pjs", "//updated from node!").then(results => {
        console.log("Got results!", results);
    }).catch(err => {
        console.log("Error in changing program: ", err);
    });
})();
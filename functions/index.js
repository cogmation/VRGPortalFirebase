'use strict';
const functions = require('firebase-functions');
const request = require('request');
const admin = require('firebase-admin');

admin.initializeApp();

const validationURL = "tokenValidation";
const addVRTUserURL = "addUserFromPortal";
//const functionsHost = "https://us-central1-virtualroboticstoolkit-9a9cb.cloudfunctions.net"; //Production Project
const functionsHost = "https://us-central1-oauthtest-61ef6.cloudfunctions.net/"; //Testing Project
const userCompsPath = "usercompetitions"; // database path for competitions for a user.
const compsPath = "competitions"; // database path for competition details.
const resultsPath = "userscores"; // database path for storing user scores.
const portalID = "-LrtYiM1kNw7CueH8dZR";// ID of Cogmation Testing Portal, your ID will be provided by Cogmation.

// Endpoint for Projects for a user.
exports.userProjects = functions.https.onRequest((req, res) => {
    return ValidateUser(req, res, GetCompetitionsForUser);
});

// Endpoint for results.
exports.submitResults = functions.https.onRequest((req, res) => {
    return ValidateUser(req, res, SubmitScoreForUser)
});


// When a new user is created, ensure VRT system has user as well.
exports.addUserToVRT = functions.auth.user().onCreate((user) => {
    var uid = user.uid;
    //return admin.database().ref("access/" + uid).once('value').then(function (snapshot) {
    return new Promise(function (resolve, reject) {
        request({
            url: functionsHost + addVRTUserURL,
            method: "POST",
            json: true,
            body: { email: user.email, pw: snapshot, portalID: portalID }
        }, (error, response, body) => {
            if (error) {
                //ret.error = error;
                console.log(error);
                reject(error);
                //return res.status(200).send(ret);
            }
            if (response.statusCode != 200) {
                //ret.error = 'Invalid status code <' + response.statusCode + '>';
                reject({ error: 'Invalid status code <' + response.statusCode + '>' })
                //return res.status(200).send(ret);
            }
            resolve(body);
            //const validation = body;
            //console.log(validation);
            //if (!validation.valid) {
            //    return res.status(200).send(validation);
            //}
        });
    });
    //});
});

// Take provided Firebase ID Token, and verifies its' validity with Cogmation System.
function ValidateUser(req, res, onSuccess) {
    var ret = { valid: false, error: "" };
    //console.log("Body: " + req.body);
    if (!req.body.token) {
        ret.error = "No Token in message";
        return res.status(200).send(ret);
    }
    if (!req.body.uid) {
        ret.error = "No UID in message";
        return res.status(200).send(ret);
    }
    return new Promise(function (resolve, reject) {
        request({
            url: functionsHost + validationURL,
            method: "POST",
            json: true,
            body: req.body
        }, (error, response, body) => {
            if (error) {
                ret.error = error;
                return res.status(200).send(ret);
            }
            if (response.statusCode != 200) {
                ret.error = 'Invalid status code <' + response.statusCode + '>';
                return res.status(200).send(ret);
            }
            const validation = body;
            //console.log(validation);
            if (!validation.valid) {
                return res.status(200).send(validation);
            }
            return admin.auth().getUserByEmail(validation.email).then(function (user) {
                //console.log(user);
                return onSuccess(req, res, user);
            }).catch(function (error) {
                console.log(error);
                ret.error = error;
                return res.status(200).send(ret);
            });
        });
    });
}

function GetCompetitionsForUser(req, res, user) {
    const uid = user.uid;
    //console.log("Found user with email: " + user.email + " has uid: " + uid);
    return admin.database().ref(userCompsPath + "/" + uid).once('value').then(function (snapshot) {
        const snapshotObject = snapshot.val();
        //console.log(snapshotObject);
        const count = snapshot.numChildren();
        var currCount = 0;
        var compsInfo = {};
        if (count == 0) {
            return res.status(200).send(compsInfo);
        }
        for (let k in snapshotObject) {
            //console.log("Key: " + k + " value: " + snapshotObject[k]);
            // do not return here... 
            admin.database().ref(compsPath + "/" + snapshotObject[k]).once('value').then(function (compSnapshot) {
                compsInfo[snapshotObject[k]] = compSnapshot;
                currCount++;
                if (currCount === count) {
                    //console.log("done");
                    return res.status(200).send(compsInfo);
                }
            }).catch(function (error) {
                console.log(error);
                return res.status(200).send(error);
            });
        }
    }).catch(function (error) {
        console.log(error);
        return res.status(200).send(compsInfo);
    });
}

function SubmitScoreForUser(req, res, user) {
    var uid = user.uid;
    return admin.database().ref(resultsPath + "/" + uid).push(req.body.result).then(function (dbRef) {
        return res.status(200).send(dbRef);
    }).catch(function (error) {
        console.log(error);
        return res.status(200).send(error);
    });
}
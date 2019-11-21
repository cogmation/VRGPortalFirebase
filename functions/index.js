'use strict';
const functions = require('firebase-functions');
const request = require('request');
const admin = require('firebase-admin');

admin.initializeApp();

const validationURL = "https://us-central1-virtualroboticstoolkit-9a9cb.cloudfunctions.net/tokenValidation";
const addVRTUserURL = "https://us-central1-oauthtest-61ef6.cloudfunctions.net/addUserFromPortal";
const userCompsPath = "usercompetitions";
const compsPath = "competitions";
const resultsPath = "userscores";
const portalID = "-LrtYiM1kNw7CueH8dZR";

exports.userProjects = functions.https.onRequest((req, res) => {
    ValidateUser(req, res, GetCompetitionsForUser);
});

exports.submitResults = functions.https.onRequest((req, res) => {
    ValidateUser(req, res, SubmitScoreForUser)
});

exports.addUserToVRT = functions.auth.user().onCreate((user) => {
    var uid = user.uid;
    return new Promise(function (resolve, reject) {
        request({
            url: addVRTUserURL,
            method: "POST",
            json: true,
            body: { email: user.email, pw: user.emailVerified, portalID: portalID }
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
});

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
            url: validationURL,
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
            admin.auth().getUserByEmail(validation.email).then(function (user) {
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
    //console.log("Found user with email: " + validation.email + " has uid: " + uid);
    return admin.database().ref(userCompsPath + "/" + uid).once('value').then(function (snapshot) {
        const snapshotObject = snapshot.val();
        const count = snapshot.numChildren();
        var currCount = 0;
        var compsInfo = {};
        if (count == 0) {
            return res.status(200).send(compsInfo);
        }
        for (let k in snapshotObject) {
            //console.log("Key: " + k + " value: " + snapshotObject[k]);
            return admin.database().ref(compsPath + "/" + snapshotObject[k]).once('value').then(function (compSnapshot) {
                compsInfo[snapshotObject[k]] = compSnapshot;
                currCount++;
                if (currCount === count) {
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
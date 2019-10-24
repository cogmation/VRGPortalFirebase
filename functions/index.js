'use strict';
const functions = require('firebase-functions');
const request = require('request');
const admin = require('firebase-admin');

admin.initializeApp();

const validationURL = "https://us-central1-virtualroboticstoolkit-9a9cb.cloudfunctions.net/tokenValidation";
const userCompsPath = "usercompetitions";
const compsPath = "competitions";
const resultsPath = "userscores";

exports.userProjects = functions.https.onRequest((req, res) => {
    ValidateUser(req, res, GetCompetitionsForUser);
});

exports.submitResults = functions.https.onRequest((req, res) => {
    ValidateUser(req, res, SubmitScoreForUser)
});

function ValidateUser(req, res, onSuccess) {
    var ret = { valid: false, error: "" };
    //console.log("Body: " + req.body);
    if (!req.body.token) {
        ret.error = "No Token in message";
        res.status(200).send(ret);
        return;
    }
    if (!req.body.uid) {
        ret.error = "No UID in message";
        res.status(200).send(ret);
        return;
    }

    request({
        url: validationURL,
        method: "POST",
        json: true,
        body: req.body
    }, (error, response, body) => {
        if (error) {
            ret.error = error;
            res.status(200).send(ret);
            return;
        }
        if (response.statusCode != 200) {
            ret.error = 'Invalid status code <' + response.statusCode + '>';
            res.status(200).send(ret);
            return;
        }
        const validation = body;
        //console.log(validation);
        if (!validation.valid) {
            res.status(200).send(validation);
            return;
        }
        admin.auth().getUserByEmail(validation.email).then(function (user) {
            onSuccess(req, res, user);
        }).catch(function (error) {
            console.log(error);
            ret.error = error;
            res.status(200).send(ret);
        });
    });
}

function GetCompetitionsForUser(req, res, user) {
    const uid = user.uid;
    //console.log("Found user with email: " + validation.email + " has uid: " + uid);
    admin.database().ref(userCompsPath + "/" + uid).once('value').then(function (snapshot) {
        const snapshotObject = snapshot.val();
        const count = snapshot.numChildren();
        var currCount = 0;
        var compsInfo = {};
        if (count == 0) {
            res.status(200).send(compsInfo);
            return;
        }
        for (let k in snapshotObject) {
            //console.log("Key: " + k + " value: " + snapshotObject[k]);
            admin.database().ref(compsPath + "/" + snapshotObject[k]).once('value').then(function (compSnapshot) {
                compsInfo[snapshotObject[k]] = compSnapshot;
                currCount++;
                if (currCount === count) {
                    res.status(200).send(compsInfo);
                }
            }).catch(function (error) {
                console.log(error);
                res.status(200).send(error);
            });
        }
    }).catch(function (error) {
        console.log(error);
        res.status(200).send(compsInfo);
    });
}

function SubmitScoreForUser(req, res, user) {
    var uid = user.uid;
    admin.database().ref(resultsPath + "/" + uid).push(req.body.result).then(function (dbRef) {
        res.status(200).send(dbRef);
    }).catch(function (error) {
        console.log(error);
        res.status(200).send(error);
    });
}
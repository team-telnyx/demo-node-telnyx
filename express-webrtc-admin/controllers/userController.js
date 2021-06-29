const express  = require('express');
const router = module.exports = express.Router();
const User = require('../models/User');
const telynx = require('../packages/telnyxFunctions');

/**
 * Checks to see if email is Telnyx Domain before proceeding
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
const validateUser = (req, res, next) =>  req.body.email.endsWith('@telnyx.com') ?
    next() :
    res.send('Email domain not allowed').status(409);

const createTelephonyCredentials = async (req, res, next) => {
    const userEmail = req.body.email;
    const {data, ok} = await telynx.createTelephonyCredential(userEmail);
    res.locals.telnyxCredential = data;
    ok ? next() : res.send('Error Creating Telephony Creds').status(500);
}

/**
 * Saves user to database
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const saveUserToDataBase = async (req, res) => {
    try {
        const telnyxCredential = res.locals.telnyxCredential;
        const userEntry = {
            telnyxTelephonyId: telnyxCredential.id,
            telnyxTelephonyUserId: telnyxCredential.sip_username,
            telnyxTelephonyPassword: telnyxCredential.sip_password,
            telnyxTelephonySipUri: `sip:${telnyxCredential.sip_username}@sip.telnyx.com`,
            email :req.body.email
        }
        const user = new User(userEntry);
        const dbResult = await user.save();
        res.json(dbResult);
    }
    catch (e) {
        console.error(e);
        res.send('Error Saving To Database').status(500);
    }
};

/**
 * Looks up user by ID
 * @param req
 * @param res
 * @param next
 * @returns {Promise<void>}
 */
const fetchUserFromDataBase = async (req, res, next) => {
    const userId = req.params.uid;
    try {
        res.locals.user = User.findById(userId);
        next();
    }
    catch (e) {
        console.error(e);
        res.send('User not found').status(404);
    }
}

/**
 * Creates JWT for user
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const createTokenForUser = async (req, res) => {
    const telnyxTelephonyId = res.locals.user.telnyxTelephonyId;
    const {ok, data} = await telynx.createJWTFromCredential(telnyxTelephonyId);
    ok ? res.json({token: data}) : res.send('Error creating token').status(500);
};

/**
 * Sets user status to online / offline
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const updateUserStatus = async(req, res) => {
    const status = req.body.status;
    const user = res.locals.user;
    user.online = (status === 'online')
    try {
        const dbResult = await user.save();
        res.json(dbResult);
    }
    catch (e) {
        console.error(e);
        res.send('Error updating user status');
    }
}

router.route('/:uid/status').post(
    fetchUserFromDataBase,
    updateUserStatus)

router.route('').post(
    validateUser,
    createTelephonyCredentials,
    saveUserToDataBase);

router.route('/:uid/token').get(
    fetchUserFromDataBase,
    createTokenForUser)

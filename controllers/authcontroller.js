'use strict';

const controller = {};
const passport = require('./passport');
const models = require('../models');
const { where } = require('sequelize');


controller.show = (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    }
    res.render('login', { loginMessage: req.flash('loginMessage'), reqUrl: req.query.reqUrl, registerMessage: req.flash('registerMessage') });
}

controller.login = (req, res, next) => {
    let keepSignedIn = req.body.keepSignedIn;
    let cart = req.session.cart;
    let reqUrl = req.body.reqUrl ? req.body.reqUrl : '/users/my-account';

    passport.authenticate('local-login', (error, user) => {
        if (error) {
            return next(error);
        }
        if (!user) {
            return res.redirect(`/users/login?reqUrl=${reqUrl}`);
        }
        req.logIn(user, (error) => {
            if (error) { return next(error); }
            req.session.cookie.maxAge = keepSignedIn ? (24 * 60 * 60 * 1000) : null;
            req.session.cart = cart;
            return res.redirect(reqUrl);
        })
    })(req, res, next);
}

controller.logout = (req, res, next) => {
    let cart = req.session.cart;
    req.logout((error) => {
        if (error) {
            return next(error);
        }
        req.session.cart = cart;
        res.redirect('/');
    })
}

controller.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect(`/users/login?reqUrl=${req.originalUrl}`);
}

controller.register = (req, res, next) => {
    let reqUrl = req.body.resUrl ? req.body.reqUrl : '/users/my-account';
    let cart = req.session.cart;

    passport.authenticate('local-register', (error, user) => {
        if (error) {
            return next(error);
        }
        if (!user) {
            return res.redirect(`/users/login?reqUrl=${reqUrl}`);
        }

        req.logIn(user, (error) => {
            if (error) {
                return next(error);
            }
            req.session.cart = cart;
            return res.redirect(reqUrl);
        })
    })(req, res, next);
}

controller.showForgotPassword = (req, res) => {
    res.render('forgot-password');
}

controller.forgotPassword = async (req, res) => {
    let email = req.body.email;
    // kiem tra email ton tai 
    let user = await models.User.findOne({
        where: { email }
    });

    if (user) {
        // tao link 
        const { sign } = require('./jwt');
        const host = req.header('host');
        const resetLink = `${req.protocol}://${host}/users/reset?token=${sign(email)}&email=${email}`;
        // gui email 
        const { sendForgotPassword } = require('./mail');
        sendForgotPassword(user, host, resetLink)
            .then((result) => {
                console.log('email has been sent');
                return res.render('forgot-password', { done: true })
            })
            .catch(error => {
                console.log(error.statusCode);
                return res.render('forgot-password', { message: 'An error has occured when sending to your email. Please your email address!' });
            })
        // thong bao thanh cong 
        return res.render('forgot-password', { done: true });
    } else {
        // nguoc lai 
        // thong email khong ton tai 
        return res.render('forgot-password', { message: 'email does not exist!' });
    }
}

controller.showResetPassword = (req, res) => {
    let token = req.query.token;
    let email = req.query.email;
    let { verify } = require('./jwt');
    // kiem tra token co hop le hay khong 
    if (!token || !verify(token)) {
        return res.render('reset-password', { expired: true });
    }
    return res.render('reset-password', { email, token });
}

controller.resetPassword = async (req, res) => {
    let email = req.body.email;
    let token = req.body.token;
    let bcrypt = require('bcrypt');
    let password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(8));
    let confirmPassword = req.body.confirmPassword;
    let user = await models.User.update({ password }, { where: { email } });
    res.render('reset-password', { done: true });
}

module.exports = controller;
#!/usr/bin/env nodejs

'use strict';

//nodejs dependencies
const fs = require('fs');
const process = require('process');

//external dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mustache = require('mustache');
const https = require('https');

//local dependencies
const users = require('./users/users');
const options = require('./options').options;

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

const USER_COOKIE = 'userInfo';

/*************************** Route Handling ****************************/

function setupRoutes(app) {
  app.get('/', rootRedirectHandler(app));
  app.get('/register', registerUserHandler(app));
  app.get('/login', loginUserHandler(app));
  app.get('/account',accountHandler(app));
  app.get('/logout',logoutUserHandler(app));
}

function rootRedirectHandler(app) {
  return function(req, res) {
    res.redirect('/login');
  };
}

function registerUserHandler(app) {
  var errorObj = {};
  var errCount = 0;
  return function(req, res) {
    const isDisplay = (typeof req.query.submit === 'undefined');
    if (isDisplay) {
      res.send(doMustache(app, 'register', {}));
    }
    else {
        ['fname', 'lname', 'email', 'pwd', 'cpwd'].forEach((name) => {
        const val = req.query[name];
        if (typeof val === 'undefined' || val.trim().length === 0) {
          const temp = name+"Error";
          errorObj[temp] = 'Please provide a value';
          errCount++;
        }
      });
        if(req.query.pwd !== req.query.cpwd) {
          errorObj['cpwdError'] = 'The passwords do not match';
          errCount++;
        }
        if(!/^\S+@\S+$/g.test(req.query.email)) {
          errorObj['emailError'] = 'Please provide a valid email address';
          errCount++;
        }
        if((req.query.pwd).length<8) {
          errorObj['pwdError'] = 'Password should consist of atleast 8 characters';
          errCount++;
        }
        if(!/^(?=.*\d)/g.test(req.query.pwd)) {
          errorObj['pwdError'] = 'Password should consist of atleast 1 digit';
          errCount++;
        }
        if(!/^\S+$/g.test(req.query.pwd)) {
          errorObj['pwdError'] = 'Password should not contain whitespaces';
          errCount++;
        }
        if(errCount > 0) {
            errorObj['fname'] = req.query.fname; errorObj['lname'] = req.query.lname; errorObj['email'] = req.query.email;          
          res.send(doMustache(app, 'register', errorObj));
          errCount=0;
          errorObj = {};
        }
        else {
          const registerParams = {'email':req.query.email.trim(),'pwd':req.query.pwd.trim(),'fname':req.query.fname.trim(), 'lname':req.query.lname.trim()};
          app.users.registerUser(registerParams,options.wsUrl)
          .then((result) => {
            if(result.status == 201) {
              const cookieBody = {'auth':result.authToken, 'email':registerParams.email};
              res.cookie('USER_COOKIE',cookieBody);
              res.redirect('/account');
            }
            else if(result.status == 303) {
              const errorMsg = {'qError': 'This user already exists. Please provide a different email address','fname':req.query.fname, 'lname':req.query.lname, 'email':req.query.email};
              res.send(doMustache(app, 'register', errorMsg));
            }
          })
          .catch((err) => {
            console.error(err);
          });
        }
      }
  }
}

function loginUserHandler(app) {
  return function(req,res) {
    if(typeof req.cookies.USER_COOKIE === 'undefined' || req.cookies.USER_COOKIE == '') {
      const email = req.query.email;
      const pwd = req.query.pwd;
      const isDisplay = (typeof req.query.submit === 'undefined');
        if (isDisplay) {
          res.send(doMustache(app, 'login', {}));
      }
    else {
      if((email=== 'undefined' || email.trim().length === 0) || (pwd === 'undefined' || pwd.trim().length === 0)) {
          const msg = {'email': req.query.email, 'pwd':req.query.pwd, 'qError': 'Please provide all the values'};
            res.send(doMustache(app, 'login', msg));
      }
      else if(!/.+@.+/.test(req.query.email)) {
          const msg =  {'email': req.query.email, 'pwd':req.query.pwd, 'qError': 'Please provide a valid email address'};
          res.send(doMustache(app, 'login', msg));
      }
      else {
        const loginParams = {'email':req.query.email.trim(), 'pwd':req.query.pwd.trim()};
        app.users.loginUser(loginParams,options.wsUrl)
        .then((result) => {
          if(result.status == 200) {
              const cookieBody = {'auth':result.authToken, 'email':loginParams.email};
              res.cookie('USER_COOKIE',cookieBody);
              res.redirect('/account');
          }
          else if(result.status == 404) {
            const msg = {'email': req.query.email, 'qError': 'This email address is not present. Please try again'};
            res.send(doMustache(app, 'login', msg));
          }
          else if(result.status == 401) {
            const msg = {'email': req.query.email, 'qError': 'Invalid password. Please try again'};
            res.send(doMustache(app, 'login', msg));
          }
        })
      .catch((err) => console.error(err));
      }
    }

    }
    else {
      res.redirect('/account');
    }
  } 
}

function accountHandler(app) {
  return function(req, res) {
    if(typeof req.cookies.USER_COOKIE === 'undefined') {
      res.redirect('/');
    }
    else {
      const email = req.cookies.USER_COOKIE.email;
      const authToken = req.cookies.USER_COOKIE.auth;
      app.users.getUser(email,authToken,options.wsUrl)
              .then((userData) => {
                if(userData.data) {
                  const userName = userData.data.fname+" "+userData.data.lname;
                  res.send(doMustache(app, 'account', {name:userName}));
                }
                else if(userData.status == 401) {
                  const msg = {'email': req.query.email, 'qError': 'Session expired. Please login again'};
                  res.clearCookie('USER_COOKIE');
                  res.redirect('/');
                }
              })
              .catch((err) => console.error(err));
    }
  }
}

function logoutUserHandler(app) {
  return function(req, res) {
    res.clearCookie('USER_COOKIE');
    res.redirect('/');
  };
}





/************************ Utility functions ****************************/

function doMustache(app, templateId, view) {
  // const templates = { footer: app.templates.footer };
  const templates = {};
  return mustache.render(app.templates[templateId], view, templates);
}

  
/*************************** Initialization ****************************/

function setupTemplates(app) {
  app.templates = {};
  for (let fname of fs.readdirSync(TEMPLATES_DIR)) {
    const m = fname.match(/^([\w\-]+)\.ms$/);
    if (!m) continue;
    try {
      app.templates[m[1]] =
	String(fs.readFileSync(`${TEMPLATES_DIR}/${fname}`));
    }
    catch (e) {
      console.error(`cannot read ${fname}: ${e}`);
      process.exit(1);
    }
  }
}

function setup() {
  const app = express();
  process.chdir(__dirname);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  app.locals.port = options.port;
  const certOptions = {
  key: fs.readFileSync(options.sslDir+'/key.pem'),
  cert: fs.readFileSync(options.sslDir+'/cert.pem')
  };
  app.users=users;
  app.use(express.static(STATIC_DIR));
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(cookieParser());
  setupTemplates(app);
  setupRoutes(app);
  https.createServer(certOptions, app).listen(app.locals.port);
  console.log("Listening");
}

setup();

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

const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';

const USER_COOKIE = 'userInfo';

/*************************** Route Handling ****************************/

function setupRoutes(app) {
  app.get('/', rootRedirectHandler(app));
  app.get('/register', registerUserHandler(app));
  app.get('/login', loginUserHandler(app));
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
      //Validate Email
      //Validate Password
        if(errCount > 0) {
          errorObj['fname'] = req.query.fname; errorObj['lname'] = req.query.lname; errorObj['email'] = req.query.email;
          res.send(doMustache(app, 'register', errorObj));
          errCount=0;
          errorObj = {};
        }
        else {
        app.users.registerUser(req.query)
        .then((result) => {
          if(result.status == 201) {
            res.cookie('USER_COOKIE',result.name, {path: '/'});
            res.send(doMustache(app, 'account', {name:result.name}));
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
    console.log("Inside login");
    console.log(req.cookies.USER_COOKIE);
    if(typeof req.cookies.USER_COOKIE === 'undefined' || req.cookies.USER_COOKIE == {}) {
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
      //check for valid email
      else {
        app.users.loginUser(req.query)
        .then((result) => {
          if(result.status == 200) {
            app.users.getUser(email,result.authToken)
            .then((userData) => {
              if(userData.data) {
                const userName = userData.data.fname+" "+userData.data.lname;
                res.cookie('USER_COOKIE',userName,{path: '/'});
                res.send(doMustache(app, 'account', {name:userName}));
              }
              else if(userData.status == 401) {
                const msg = {'email': req.query.email, 'qError': 'Auth Token not valid. Cannot login.'};
                res.send(doMustache(app, 'login', msg));
              }
            })
            .catch((err) => console.error(err));
          }
          else if(result.status == 404) {
            const msg = {'email': req.query.email, 'qError': 'This email address is not present. Please try again'};
            res.send(doMustache(app, 'login', msg));
          }
        })
      .catch((err) => console.error(err));
      }
    }

    }
    else {
      res.send(doMustache(app, 'account', {name:req.cookies.USER_COOKIE}));
    }
  } 
}

function logoutUserHandler(app) {
  return function(req, res) {
    console.log("Entering logout");
    res.clearCookie(USER_COOKIE,{path: '/'});
    res.redirect('/login');
  };
}





/************************ Utility functions ****************************/

function getPort(argv) {
  let port = null;
  if (argv.length !== 3 || !(port = Number(argv[2]))) {
    console.error(`usage: ${argv[1]} PORT`);
    process.exit(1);
  }
  return port;
}

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
  process.chdir(__dirname);
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const app = express();
  const port = 3000;
  const certOptions = {
  // key: fs.readFileSync(sslDir+'/key.pem'),
  // cert: fs.readFileSync(sslDir+'/cert.pem')
  key: fs.readFileSync('/home/dchopde1/Desktop/certificates/proj4/key.pem'),
  cert: fs.readFileSync('/home/dchopde1/Desktop/certificates/proj4/cert.pem')
  };
  app.users=users;
  app.use(express.static(STATIC_DIR));
  app.use(bodyParser.urlencoded({extended: true}));
  app.use(cookieParser());
  setupTemplates(app);
  setupRoutes(app);
  https.createServer(certOptions, app).listen(port);
  console.log("Listening");
}

setup();

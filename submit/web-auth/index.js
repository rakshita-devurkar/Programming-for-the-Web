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

const CART_COOKIE = 'cartId';

/*************************** Route Handling ****************************/

function setupRoutes(app) {
  app.get('/', rootRedirectHandler(app));
  app.get('/login', loginUserHandler(app));
  app.get('/register', registerUserHandler(app));
  // app.post('/account', viewAccountHandler(app));
}

function rootRedirectHandler(app) {
  return function(req, res) {
    res.redirect('/login');
  };
}

function registerUserHandler(app) {
  const errorObj = {};
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
        errorObj[temp] = 'Please provide this value';
        errCount++;
      }
    });
      if(req.query.pwd !== req.query.cpwd) {
        errorObj['cpwdError'] = 'Both the passwords should match';
        errCount++;
      }
      //Validate Email
      //Validate Password
        if(errCount > 0) {
          errorObj['fname'] = req.query.fname; errorObj['lname'] = req.query.lname; errorObj['email'] = req.query.email;
          res.send(doMustache(app, 'register', errorObj));
          errCount=0;
          errObj = {};
        }
        else {
        app.users.registerUser(req.query)
        .then((result) => {
          if(result.status == 201) {
            res.send(doMustache(app, 'account', {name:result.name}));
          }
          else if(result.status == 303) {
            const errorMsg = {qError: 'This user already exists. Please provide a different email ID'};
            // res.send(doMustache(app, 'register', errorMsg));
            res.send(doMustache(app, 'register', errorArray));
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
    const isDisplay = (typeof req.query.submit === 'undefined');
    if (isDisplay) {
      res.send(doMustache(app, 'login', {}));
    }
    else {
      app.users.loginUser(req.query)
      .then((result) => {
       if(result.status == 200) {
          const userName = "Rakshita Devurkar"
          // const userName = getUserHandler(req.query.email);
          app.users.getUser(req.query.email,result.authToken)
          .then((res) => {
            res.send(doMustache(app, 'account', {name:userName}))
          })
          .catch((err) => {

          });
        }
      })
      .catch((err) => console.error(err));
      }
    }
}


/*function processSearchResults(app, q, json, res) {
  let template, view;
  if (json.length === 0) {
    template = 'search';
    view = { msg: `No results found for ${q}`, q: q };
  }
  else {
    template = 'results';
    const results =
      json.map((j) => Object.assign({}, j, { _details: JSON.stringify(j) }));
    view = { results: results };
  }
  const html = doMustache(app, template, view);
  res.send(html);
}

function viewCartHandler(app) {
  return function(req, res) {
    cartIdPromise(app, req, res)
      .then((cartId) => {
	return app.shop.getCart(cartId)
      })
      .then((items) => {
	const html = doMustache(app, 'cart', { items: items });
	res.send(html)})	
      .catch((err) => console.error(err));
  }
}

function cartIdPromise(app, req, res) {
  const cartCookie = req.cookies[CART_COOKIE];
  let cartPromise = null;
  if (typeof cartCookie === 'undefined') {
    cartPromise = app.shop.newCart(app);
    cartPromise.then((cartId) => {
      res.cookie(CART_COOKIE, cartId, { maxAge: 86400*1000 });
    });
  }
  else {
    cartPromise = Promise.resolve(cartCookie);
  }
  return cartPromise;
}

function addProductHandler(app) {
  return function(req, res) {
    let errors = [];
    ['id', 'details'].forEach((name) => {
      const val = req.body[name];
      if (typeof val === 'undefined' || val.trim().length === 0) {
	errors.put({ msg: `product ${name} undefined` });
      }
    });
    if (errors.length > 0) {
      errorPage(app, errors, res);
    }
    else {
      cartIdPromise(app, req, res)
	.then((cartId) => {
	  const details = JSON.parse(req.body.details);
	  return app.shop.addItem(cartId, details, req.body.id);
	})
	.then(function() {
	  res.redirect('/shop/cart');	   
	})
	.catch((err) => console.error(err));
    }
  }
}

function deleteItemHandler(app) {
  return function(req, res) {
    const itemId = req.body.itemId;
    if (typeof itemId === 'undefined' || itemId.trim().length === 0) {
      errorPage(app, { msg: `cart itemId undefined` }, res);
    }
    else {
      const cartId = req.cookies[CART_COOKIE];
      const hasCart = (typeof cartId !== 'undefined')
      const p =
	(hasCart) ? app.shop.deleteItem(cartId, itemId) : Promise.resolve();
      p.then(() => res.redirect('/shop/cart'));
    }
  };
}*/


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

function errorPage(app, errors, res) {
  if (!Array.isArray(errors)) errors = [ errors ];
  const html = doMustache(app, 'errors', { errors: errors });
  res.send(html);
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
  setupTemplates(app);
  setupRoutes(app);
  https.createServer(certOptions, app).listen(port);
  console.log("Listening");

  // OLD code 
  // process.chdir(__dirname);
  
  // // const port = getPort(process.argv);
  // //const app = express();
  // //app.use(cookieParser());
  // setupTemplates(app);
  // // app.shop = shop;
  // app.use(express.static(STATIC_DIR));
  // app.use(bodyParser.urlencoded({extended: true}));
  // setupRoutes(app);
  // app.listen(port, function() {
  //   console.log(`listening on port ${port}`);
  // });
  //End of old code
}

setup();

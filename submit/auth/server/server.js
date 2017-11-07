const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const fs = require('fs');

const USERS = 'users';

const app = express();

const OK = 200;
const CREATED = 201;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;
const SEE_OTHER = 303;
const UNAUTHORIZED = 401; 


var authTimeOut;

function Users(db) {
  this.db = db;
  this.users = db.collection(USERS);
}

function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}

function serve(port,authTime,sslDir,model) {
  const certOptions = {
  key: fs.readFileSync(sslDir+'/key.pem'),
  cert: fs.readFileSync(sslDir+'/cert.pem')
  };
  app.locals.model = model;
  authTimeOut = authTime
  https.createServer(certOptions, app).listen(port);
  setupRoutes(app);
}


function setupRoutes(app) {
  app.use(bodyParser.json());
  app.put('/users/:ID', handleNewUser(app));
  app.put('/users/:ID/auth',handleLogin(app));
  app.get('/users/:ID',handleGet(app));
}


function handleNewUser(app) {
  return function(request, response) {
    request.app.locals.model.users.find(request.params).
      then(function(result) { 
          if(result.length === 1) {
                response.append('Location', requestUrl(request)+'/'+request.params.ID);
                response.status(SEE_OTHER).send({ "status": "EXISTS", "info": "user "+ request.params.ID +" already exists"});
          }
          else {
            request.app.locals.model.users.newUser(request.body, request.params, request.query.pw, authTimeOut).
              then(function(token){
                if(token) {
                  response.append('Location', requestUrl(request)+'/'+request.params.ID);
                  response.status(CREATED).send({"status": "CREATED", "authToken": token});
                }
              }).
              catch((err) => {
                console.error(err);
                response.send("SERVER_ERROR");
              });
          }
      }).
      catch((err) => {
      console.error(err);
        response.sendStatus(SERVER_ERROR);
      });
  };
}

function handleLogin(app) {
  return function(request, response) {
    request.app.locals.model.users.find(request.params).
      then(function(result) {
          if(!request.body.pw) {
            response.status(UNAUTHORIZED);
            response.send({ "status": "ERROR_UNAUTHORIZED", "info": "/users/"+request.params.ID+"/auth requires a valid 'pw' password query parameter"});        
          } 
          if(result.length === 1) {
                request.app.locals.model.users.loginUser(request.body, request.params, authTimeOut).
                then(function(token){
                    if(token) {
                      response.status(OK);
                      response.send({"status": "OK", "authToken": token});
                    }
                    else {
                      response.status(UNAUTHORIZED);
                      response.send({ "status": "ERROR_UNAUTHORIZED","info": "/users/"+request.params.ID+"/auth requires a valid 'pw' password query parameter"});
                    }
                }).
                catch((err) => {
                  console.error(err);
                  response.send("SERVER_ERROR");
                });
          }
          else {
            response.status(NOT_FOUND);
            response.send({ "status": "ERROR_NOT_FOUND", "info": "user "+request.params.ID+" not found"});
          }
      }).
      catch((err) => {
      console.error(err);
        response.sendStatus(SERVER_ERROR);
      });
  };
}

function handleGet(app) {
  return function(request, response) {
    request.app.locals.model.users.find(request.params).
      then(function(result) {
          if(!request.headers['authorization']) {
            response.status(UNAUTHORIZED);
            response.send({ "status": "ERROR_UNAUTHORIZED", "info": "/users/"+request.params.ID+" requires a bearer authorization header"});       
          }  
          if(result.length === 1) {
                request.app.locals.model.users.getUser(request.params, request.headers['authorization']).
                  then(function(user){
                    if(user) {
                      response.send(user);
                    }
                    else {
                      response.status(UNAUTHORIZED);
                      response.send({ "status": "ERROR_UNAUTHORIZED", "info": "/users/"+request.params.ID+" requires a bearer authorization header"});
                    }
                  }).
                  catch((err) => {
                    console.error(err);
                    response.send("SERVER_ERROR");
                  });
          }
          else {
            response.status(NOT_FOUND);
            response.send({ "status": "ERROR_NOT_FOUND", "info": "user "+request.params.ID+" not found"});
          }
      }).
      catch((err) => {
      console.error(err);
        response.sendStatus(SERVER_ERROR);
      });
  };
}

module.exports = {
  serve: serve
}


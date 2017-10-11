const express = require('express');
const bodyParser = require('body-parser');

const USERS = 'users';

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const SERVER_ERROR = 500;
const SEE_OTHER = 303;
const NO_CONTENT = 204;

const app = express();

function Users(db) {
  this.db = db;
  this.users = db.collection(USERS);
}

function serve(port, model) {
  const app = express();
  app.locals.model = model;
  app.locals.port = port;
  setupRoutes(app);
  app.listen(port, function() {
    console.log(`listening on port ${port}`);
  });
}

function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}


function setupRoutes(app) {
  app.use(bodyParser.json());
  app.get('/users/:ID', handleGet(app));
  app.put('/users/:ID', handlePut(app));
  app.post('/users/:ID', handlePost(app));
  app.delete('/users/:ID', handleDelete(app));
}



function handleGet(app) {
  return function(request, response) {
    if (request.params === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      request.app.locals.model.users.getUser(request.params).
      then(function(results) {
        if(results.length === 1) {
          response.json(results[0].data);
        }
        else {
          response.sendStatus(NOT_FOUND);
        }
      }).
      catch((err) => {
        console.error(err);
        response.sendStatus(SERVER_ERROR);
      });
    }
  };
}

function handlePut(app) {
  return function(request, response) {
    request.app.locals.model.users.find(request.params).
      then(function(result) { 
          if(result.length === 1) {
            request.app.locals.model.users.updateUser(request.body, request.params).
            then(function(result) {
              if(result.modifiedCount === 1){
                response.sendStatus(NO_CONTENT);
              }
            }).
            catch((err) => {
              console.error(err);
              response.sendStatus(SERVER_ERROR);
            });
          }
          else {
            request.app.locals.model.users.newUser(request.body, request.params).
            then(function(id){
                if(id) {
                  // response.append('Location', requestUrl(request) + '/' + id);
                  response.sendStatus(CREATED);
                }
            }).
            catch((err) => {
              console.error(err);
              response.sendStatus(SERVER_ERROR);
            });
          }
      }).
      catch((err) => {
      console.error(err);
        response.sendStatus(SERVER_ERROR);
      });
  };
}

  function handlePost(app) {
  return function(request, response) {
    if (request.body === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      request.app.locals.model.users.find(request.params).
      then(function(result) {
        if(result.length === 1) {
            request.app.locals.model.users.updateUser(request.body, request.params).
            then(function(id) {
              // response.append('Location', requestUrl(request) + '/' + id);
              
              response.sendStatus(SEE_OTHER);
            }).
            catch((err) => {
              console.error(err);
              response.sendStatus(SERVER_ERROR);
            });
        }
        else {
          response.sendStatus(NOT_FOUND);
        }
      }).
      catch((err) => {
        console.error(err);
        response.sendStatus(SERVER_ERROR);
      });
    }
  };
}

function handleDelete(app) {
  return function(request, response) {
    if (typeof request.params === 'undefined') {
      response.sendStatus(BAD_REQUEST);
    }
    else {
      request.app.locals.model.users.find(request.params).
      then(function(result) {
        if(result.length === 1) {
            request.app.locals.model.users.deleteUser(request.params).
            then(() => response.end()).
            catch((err) => {
              console.error(err);
              response.sendStatus(SERVER_ERROR);
            });
        }
        else {
          response.sendStatus(NOT_FOUND);
        }
      }).
      catch((err) => {
        console.error(err);
        response.sendStatus(SERVER_ERROR);
      });
    }
  };
}

module.exports = {
  serve: serve
}


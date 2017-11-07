#!/usr/bin/env nodejs

const assert = require('assert');
const mongo = require('mongodb').MongoClient;
const process = require('process');
const options = require('./options');

const users = require('./model/users');
const model = require('./model/model');
const server = require('./server/server');

const DB_URL = 'mongodb://localhost:27017/users';


mongo.connect(DB_URL).
  then(function(db) {
    const model1 = new model.Model(db);
    console.log(options.options);
    server.serve(options.options.port,options.options.authTimeout,options.options.sslDir,model1);
    // db.close();
  }).
  catch((e) => console.error(e));



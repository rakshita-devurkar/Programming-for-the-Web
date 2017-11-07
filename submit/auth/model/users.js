const assert = require('assert');
const bcrypt = require('bcryptjs');
const md5 = require('md5');
const jwt = require('jsonwebtoken');
const ObjectId = require('mongodb').ObjectId;
const USERS = 'users';

function Users(db) {
  this.db = db;
  this.users = db.collection(USERS);
}

Users.prototype.find = function(query) {
  return this.users.find(query).toArray().
        then((result) => Promise.resolve(result));
}


Users.prototype.newUser = function(reqBody, reqParams, pw, authTimeOut) {
  const hashedPassword = md5(pw);
  const insertQuery = {ID: reqParams.ID, password: hashedPassword, data: reqBody};
  return this.users.insertOne(insertQuery).
      then(function(result) {
        return new Promise(function(resolve, reject) {
          if(result.insertedId) {
            const token = jwt.sign({ id: result.insertedId}, "secret", {expiresIn: authTimeOut});
            resolve(token);
          }
          else {
            reject(new Error(`cannot create user`));
          }
        });
      });
}

Users.prototype.loginUser = function(reqBody, reqParams, authTimeOut) {
  return this.users.findOne(reqParams).
    then(function(user) {
        return new Promise(function(resolve, reject) {
              const hash = md5(reqBody.pw);
              if(hash === user.password) {
                const token = jwt.sign({ id: user._id }, "secret", {expiresIn: authTimeOut});
                resolve(token);
              }
              else {
                resolve(null);
              }
         
        });
    });
  
}

Users.prototype.getUser = function(reqParams, authToken) {
  var decodedId;
  if(authToken) {
    const token = authToken.split(" ")[1];
  }
  jwt.verify(token, "secret", function(err, decoded) {
    if (err) {
      decodedId = null;
      console.log(err);
    }
    else {
      decodedId = decoded.id;
    }
  });
  return this.users.findOne({"_id": ObjectId(decodedId)}).
        then(function(user) {
            return new Promise(function(resolve, reject) {
              if(user && (user.ID === reqParams.ID)) {
                  resolve(user.data);
              }
              else {
                  resolve(null);
              }
        });
    });
}


module.exports = {
  Users: Users,
};

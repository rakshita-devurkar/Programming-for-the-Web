const assert = require('assert');

const USERS = 'users';

function Users(db) {
  this.db = db;
  this.users = db.collection(USERS);
}

Users.prototype.find = function(query) {
  return this.users.find(query).toArray().
        then((result) => Promise.resolve(result));
}

Users.prototype.getUser = function(reqParams) {
  return this.users.find(reqParams).toArray().
    then(function(result) {
      return new Promise(function(resolve, reject) {
        resolve(result);
      });
  });
}

Users.prototype.newUser = function(reqBody, reqParams) {
  const insertQuery = {ID: reqParams.ID, data: reqBody};
  return this.users.insertOne(insertQuery).
      then(function(result) {
        return new Promise(function(resolve, reject) {
          if(result.insertedId) {
            resolve(result.insertedId);
          }
          else {
            reject(new Error(`cannot create user`));
          }
        });
      });
}


Users.prototype.updateUser = function(reqBody, reqParams) {
  const updateQuery = {ID: reqParams.ID, data: reqBody};
  return this.users.replaceOne(reqParams, updateQuery).
  then(function(result) {
    return new Promise(function(resolve, reject) {
      if(result.modifiedCount === 1) {
        resolve(result.modifiedCount);
      }
      else {
        reject(new Error(`updated ${result.modifiedCount} users`));
      }
    });
  });
}

Users.prototype.deleteUser = function(reqParams) {
  return this.users.deleteMany(reqParams).
  then(function(result) {
    return new Promise(function(resolve, reject) {
      if(result.deletedCount === 1) {
        resolve();
      }
      else {
        reject(new Error(`deleted ${result.deletedCount} users`));
      }
    });
  });
}

module.exports = {
  Users: Users,
};

'use strict';

const assert = require('assert');
const mongo = require('mongodb').MongoClient;


//used to build a mapper function for the update op.  Returns a
//function F = arg => body.  Subsequently, the invocation,
//F.call(null, value) can be used to map value to its updated value.
function newMapper(arg, body) {
  return new (Function.prototype.bind.call(Function, Function, arg, body));
}

//print msg on stderr and exit.
function error(msg) {
  console.error(msg);
  process.exit(1);
}

//export error() so that it can be used externally.
module.exports.error = error;


//auxiliary functions; break up your code into small functions with
//well-defined responsibilities.

//perform op on mongo db specified by url.
function dbOp(url, op) {
	const opObj = JSON.parse(op);
	if(opObj.op === "create") {
		dbCreate(url, opObj);	
	}
	if(opObj.op === "read") {
		dbRead(url, opObj);
	}
	if(opObj.op === "delete") {
		dbDelete(url, opObj);							
	}
	if(opObj.op === "update") {
		dbUpdate(url, opObj);	
	}
}

function dbCreate(url, opObj) {
	mongo.connect(url, function(err, db) {
		if(err) {
		   db.close();
		   error(err);		
		}
		db.collection(opObj.collection).insertMany(opObj.args, function(err, res) {
			db.close();
			if(err) error(err);		
		});
	});

}

function dbRead(url, opObj) {
	mongo.connect(url, function(err, db) {
		if(err) {
		  db.close();
		  error(err);		
		}
		db.collection(opObj.collection).find(opObj.args).toArray (function(err, res) {
			if(err) {
			   db.close();
			   error(err);
			}
			console.log(res);
			db.close();
		});
	});

}

function dbUpdate(url, opObj) {
	mongo.connect(url, function(err, db) {
		if(err) {
		   db.close();
		   error(err);		
		}
		var mapper = newMapper(opObj.fn[0], opObj.fn[1]);
			
		db.collection(opObj.collection).find({}).toArray( function (err,res) {
			if(err) {
			   db.close();
			   error(err);				
			}
			res.forEach(function(value,index) {
				db.collection(opObj.collection).updateOne(value, mapper.call(null,value), function(err, res) {
					if(err) {
						db.close();
						error(err);
					}
					db.close();
				});
			});
		});
		
	});

}

function dbDelete(url, opObj) {
	mongo.connect(url, function(err, db) {
		if(err) {
		   db.close();
		   error(err);		
		}
		db.collection(opObj.collection).deleteMany(opObj.args , function(err, res) {
			if(err) {
			  db.close();
			  error(err);
			}
			db.close();
		});
	});

}

//make main dbOp() function available externally
module.exports.dbOp = dbOp;


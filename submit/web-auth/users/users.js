'use strict';

const axios = require('axios');


// const WS_URL = 'https://localhost:443';

function Users() {
  
}

Users.prototype.registerUser = function(reqQuery,baseUrl) {
    console.log("Inside registerUser");
    const ID = reqQuery.email;
    const pwd = reqQuery.pwd;
    const data = Object.assign({}, {'fname': reqQuery.fname, 'lname':reqQuery.lname});
    return axios.put(`${baseUrl}/users/${ID}?pw=${pwd}`, data, { maxRedirects: 0 })
      .then((response) => {
        const resObj = {"status":response.status, "name":reqQuery.fname+" "+reqQuery.lname};
        return resObj;
      })
      .catch((err) => {
          const errStatus = err.toString().substr(err.toString().lastIndexOf(' ')+1);
          return {"status":errStatus};
      });
}

Users.prototype.loginUser = function(reqQuery,baseUrl) {
  const email = reqQuery.email;
  const data = Object.assign({}, {'pw':reqQuery.pwd});
  return axios.put(`${baseUrl}/users/${email}/auth`, data, { maxRedirects: 0 })
      .then((response) => {
        return {"status":response.status, "authToken":response.data.authToken};
      })
      .catch((err) => {
          const errStatus = err.toString().substr(err.toString().lastIndexOf(' ')+1);
          return {"status":errStatus};
      });
}

Users.prototype.getUser = function(email, authToken,baseUrl) {
  const AuthStr = 'Bearer '.concat(authToken);
  return axios.get(`${baseUrl}/users/${email}`, {headers: { Authorization: AuthStr }})
    .then((response) => {
      return {data: response.data};
    })
    .catch((err) => {
        const errStatus = err.toString().substr(err.toString().lastIndexOf(' ')+1);
        return {"status":errStatus};
    });
}

module.exports = new Users();

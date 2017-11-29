'use strict';

const axios = require('axios');


const WS_URL = 'https://localhost:443';

function Users() {
  this.baseUrl = WS_URL;
}

//All action functions return promises.

// Shop.prototype.search = function(q) {
//   return axios.get(`${this.baseUrl}/products?q=${q}`)
//     .then((response) => response.data);
// }

Users.prototype.registerUser = function(reqQuery) {
    const ID = reqQuery.email;
    const pwd = reqQuery.pwd;
    const data = Object.assign({}, {'fname': reqQuery.fname, 'lname':reqQuery.lname});
    return axios.put(`${this.baseUrl}/users/${ID}?pw=${pwd}`, data, { maxRedirects: 0 })
      .then((response) => {
        const resObj = {"status":response.status, "name":reqQuery.fname+" "+reqQuery.lname};
        return resObj;
      })
      .catch((err) => {
          const errStatus = err.toString().substr(err.toString().lastIndexOf(' ')+1);
          return {"status":errStatus};
      });
}

Users.prototype.loginUser = function(reqQuery) {
  const email = reqQuery.email;
  const data = Object.assign({}, {'pw':reqQuery.pwd});
  return axios.put(`${this.baseUrl}/users/${email}/auth`, data, { maxRedirects: 0 })
      .then((response) => {
        return {"status":response.status, "authToken":response.data.authToken};
      })
      .catch((err) => {
          const errStatus = err.toString().substr(err.toString().lastIndexOf(' ')+1);
          return {"status":errStatus};
      });
}

Users.prototype.getUser = function(email, authToken) {
  return axios.get(`${this.baseUrl}/users/${email}`)
    .then((response) => {
      console.log("progress");
      // console.log(response.data);
    })
    .catch((err) => {
      console.log("Error");
      console.log(err);
    });
}

/*Shop.prototype.getCart = function(cartId) {
  return axios.get(`${this.baseUrl}/carts/${cartId}`)
    .then((response) => response.data.items);
}

Shop.prototype.addItem = function(cartId, item, itemId, quantity) {
  quantity = (typeof quantity === 'undefined') ? 1 : quantity;
  const data =
    Object.assign({}, item, { productId: itemId, quantity: quantity });
  return axios.post(`${this.baseUrl}/carts/${cartId}/items`,
		    data, { maxRedirects: 0 })
    .then((response) => {
      const location = response.headers.location;
      const itemId = location.substr(location.lastIndexOf('/') + 1);
      return itemId;
    });
}

Shop.prototype.deleteItem = function(cartId, itemId) {
  return axios.delete(`${this.baseUrl}/carts/${cartId}/items/${itemId}`);
}*/

module.exports = new Users();

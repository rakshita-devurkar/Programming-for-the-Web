<!DOCTYPE html>
<html>
  <head>
    <title>Register</title>
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
    <h1>Registration</h1>
    <p class="error">{{msg}}</p>
    <form method="GET" action="/register">
      <label>
	<span class="label">First Name</span>
	<input name="fname" class="control" value="{{fname}}"><br>
  {{#fnameError}}<span class="error">{{fnameError}}<br></span>{{/fnameError}}
  <span class="label">Last Name</span>
  <input name="lname" class="control" value="{{lname}}"><br>
  {{#lnameError}}<span class="error">{{lnameError}}<br></span>{{/lnameError}}
  <span class="label">Email Address</span>
  <input name="email" class="control" value="{{email}}"><br>
  {{#emailError}}<span class="error">{{emailError}}<br></span>{{/emailError}}
  <span class="label">Password</span>
  <input type="password" name="pwd" class="control" value="{{pwd}}"><br>
  {{#pwdError}}<span class="error">{{pwdError}}<br></span>{{/pwdError}}
  <span class="label">Confirm Password</span>
  <input type="password" name="cpwd" class="control" value="{{cpwd}}"><br>
  {{#cpwdError}}<span class="error">{{cpwdError}}<br></span>{{/cpwdError}}
      </label>
      <input name="submit" type="submit" value="Register" class="control">
      {{#qError}}<span class="error">{{qError}}<br></span>{{/qError}}
    </form> 
    {{>footer}}
  </body>
</html>
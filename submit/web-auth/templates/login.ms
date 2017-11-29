<!DOCTYPE html>
<html>
  <head>
    <title>Login</title>
    <link rel="stylesheet" href="/css/style.css">
  </head>
  <body>
    <h1>Welcome</h1>
    <p class="error">{{msg}}</p>
    <form method="GET" action="/login">
      <label>
	<span class="label">Email Address</span>
	<input name="email" class="control" value="{{email}}"><br>
  <span class="label">Password</span>
  <input type="password" name="pwd" class="control" value="{{pwd}}"><br>
      </label>
      <input name="submit" type="submit" value="Login" class="control">
      {{#qError}}<span class="error">{{qError}}<br></span>{{/qError}}
    </form> 
    {{>footer}}
  </body>
</html>
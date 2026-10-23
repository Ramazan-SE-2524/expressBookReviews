const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const { authenticated: customer_routes, JWT_SECRET } = require('./router/auth_users.js');
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());
app.set('json spaces', 4); // pretty-print JSON responses

// Sessions are used for every route under /customer
app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

// Authentication mechanism: every /customer/auth/* route requires a logged-in user.
// The login route stores a signed JWT in the session; here we check it.
app.use("/customer/auth/*", function auth(req, res, next) {
  const authorization = req.session && req.session.authorization;
  if (!authorization) {
    return res.status(403).json({ message: "User not logged in" });
  }

  jwt.verify(authorization.accessToken, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "User not authenticated" });
    }
    req.user = user; // { username, iat, exp }
    next();
  });
});

const PORT = process.env.PORT || 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

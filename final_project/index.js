const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

// Set up session for customer routes
app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

// Utility functions
let users = [];

const doesExist = (username) => {
    let userswithsamename = users.filter((user) => user.username === username);
    return userswithsamename.length > 0;
};

const authenticatedUser = (username, password) => {
    let validusers = users.filter((user) => user.username === username && user.password === password);
    return validusers.length > 0;
};

// Register endpoint
app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (username && password) {
        if (!doesExist(username)) {
            users.push({ "username": username, "password": password });
            return res.status(200).json({ message: "User successfully registered. Now you can login" });
        } else {
            return res.status(404).json({ message: "User already exists!" });
        }
    }

    return res.status(404).json({ message: "Unable to register user." });
});

// Login endpoint
app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(404).json({ message: "Error logging in" });
    }

    if (authenticatedUser(username, password)) {
        let accessToken = jwt.sign({ data: password }, 'access_secret', { expiresIn: 60 * 60 });
        req.session.authorization = { accessToken, username };
        return res.status(200).send("User successfully logged in");
    } else {
        return res.status(208).json({ message: "Invalid Login. Check username and password" });
    }
});

// Middleware to authenticate requests for "/customer/auth/*"
app.use("/customer/auth/*", function auth(req, res, next) {
    if (req.session.authorization) {
        let token = req.session.authorization['accessToken'];

        jwt.verify(token, "access_secret", (err, user) => {
            if (!err) {
                req.user = user;
                next(); // Proceed to the next middleware or route handler
            } else {
                return res.status(403).json({ message: "User not authenticated" });
            }
        });
    } else {
        return res.status(403).json({ message: "User not logged in" });
    }
});

// Set up routes
app.use("/customer", customer_routes);
app.use("/", genl_routes);

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log("Server is running"));

const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

// In-memory users array
let users = [];

// Function to validate usernames
const isValid = (username) => {
    const validUsernameRegex = /^[a-zA-Z0-9_]+$/;
    return typeof username === "string" && username.trim().length > 0 && validUsernameRegex.test(username);
};

// Function to check if user exists
const authenticatedUser = (username, password) => {
    return users.some(user => user.username === username && user.password === password);
};

// Middleware for authentication
const authenticateToken = (req, res, next) => {
    // Check if authorization is present in the session
    if (!req.session.authorization) {
        return res.status(401).json({ message: "User not authenticated" });
    }

    const token = req.session.authorization.accessToken; // Retrieve the token from session

    // Verify the token
    jwt.verify(token, "access", (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
        req.user = decoded; // Attach decoded data (e.g., username) to the request
        next(); // Proceed to the next middleware/route handler
    });
};

// Register a new user
regd_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (!isValid(username)) {
        return res.status(400).json({ message: "Invalid username format" });
    }

    if (users.some(user => user.username === username)) {
        return res.status(409).json({ message: "Username already exists" });
    }

    users.push({ username, password });
    return res.status(201).json({ message: "User registered successfully" });
});

// Login route
regd_users.post("/login", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (!authenticatedUser(username, password)) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ username }, "access", { expiresIn: "1h" });
    req.session.authorization = { accessToken: token, username: username };

    return res.status(200).json({ message: "Login successful", token });
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", authenticateToken, (req, res) => {
    const isbn = req.params.isbn; // Extract ISBN from the URL
    const { review } = req.body; // Extract the review content from the request body
    const username = req.user.username; // Get username from the decoded token

    const book = books[isbn];
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (!book.reviews) {
        book.reviews = {}; // Initialize reviews if not already present
    }

    book.reviews[username] = review; // Add or update the user's review
    return res.status(200).json({
        message: "Review added/updated successfully",
        reviews: book.reviews,
    });
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", authenticateToken, (req, res) => {
    const isbn = req.params.isbn; // Extract ISBN from the URL
    const username = req.user.username; // Get username from the decoded token

    const book = books[isbn];
    if (!book) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (book.reviews && book.reviews[username]) {
        delete book.reviews[username]; // Delete the review for this user
        return res.status(200).json({
            message: "Review deleted successfully",
            reviews: book.reviews,
        });
    } else {
        return res.status(404).json({ message: "No review found for this user" });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;

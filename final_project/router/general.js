const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

// User registration route
public_users.post("/register", (req, res) => {
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

// Task 10: Get the list of books (Async/Await with Axios)
public_users.get('/', async (req, res) => {
    try {
        const response = await axios.get('http://localhost:5000/internal/books');
        res.status(200).json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving books", error: error.message });
    }
});

// Task 11: Get book details by ISBN (Promise-based with Axios)
public_users.get('/isbn/:isbn', (req, res) => {
    const isbn = req.params.isbn;

    axios.get(`http://localhost:5000/internal/books/${isbn}`)
        .then(response => res.status(200).json(response.data))
        .catch(error => res.status(404).json({ message: "Book not found", error: error.message }));
});

// Task 12: Get book details by author (Async/Await with Axios)
public_users.get('/author/:author', async (req, res) => {
    const author = req.params.author;
    try {
        const response = await axios.get(`http://localhost:5000/internal/books/author/${author}`);
        res.status(200).json(response.data);
    } catch (error) {
        res.status(404).json({ message: "No books found for the given author", error: error.message });
    }
});

// Task 13: Get book details by title (Promise-based with Axios)
public_users.get('/title/:title', (req, res) => {
    const title = req.params.title;

    axios.get(`http://localhost:5000/internal/books/title/${title}`)
        .then(response => res.status(200).json(response.data))
        .catch(error => res.status(404).json({ message: "No books found with the given title", error: error.message }));
});

// Get book reviews by ISBN
public_users.get('/review/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];

    if (book) {
        res.status(200).json(book.reviews);
    } else {
        res.status(404).json({ message: "Book not found" });
    }
});

module.exports.general = public_users;

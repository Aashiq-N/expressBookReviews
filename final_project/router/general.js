const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();
const axios = require('axios');

public_users.post("/register", (req, res) => {
    const { username, password } = req.body;

    // Check if username or password is missing
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    // Check if the username is valid
    if (!isValid(username)) {
        return res.status(400).json({ message: "Invalid username format" });
    }

    // Check if username already exists
    const userExists = users.some(user => user.username === username);
    if (userExists) {
        return res.status(409).json({ message: "Username already exists" });
    }

    // Register the new user
    users.push({ username, password });
    return res.status(201).json({ message: "User registered successfully" });
});

// Get the book list available in the shop using Promises and Axios
public_users.get('/', (req, res) => {
    axios.get('https://api.example.com/books') // Replace with a valid API endpoint
        .then(response => {
            res.status(200).json(response.data); // Return the data received
        })
        .catch(error => {
            res.status(500).json({ message: "Error retrieving books", error: error.message });
        });
});

// Promise-based implementation for fetching book details by ISBN
public_users.get('/isbn/:isbn', (req, res) => {
    const isbn = req.params.isbn; // Extract the ISBN from the request parameters

    // Simulate fetching book details asynchronously
    new Promise((resolve, reject) => {
        const book = books[isbn]; // Retrieve book from the books object
        if (book) {
            resolve(book); // Resolve the Promise with the book data
        } else {
            reject("Book not found"); // Reject the Promise if the book is not found
        }
    })
        .then(book => {
            res.status(200).json(book); // Return book details if found
        })
        .catch(error => {
            res.status(404).json({ message: error }); // Handle errors (e.g., book not found)
        });
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
    const author = req.params.author; // Extract the author from the request parameters
    const booksByAuthor = []; // Array to store books by the specified author

    // Iterate through the books object
    for (let key in books) {
        if (books[key].author.toLowerCase() === author.toLowerCase()) {
            booksByAuthor.push(books[key]); // Add the book to the results if the author matches
        }
    }

    if (booksByAuthor.length > 0) {
        // If books are found, return them
        res.status(200).json(booksByAuthor);
    } else {
        // If no books are found, return a 404 error
        res.status(404).json({ message: "No books found for the given author" });
    }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
    const title = req.params.title; // Extract the title from the request parameters
    const booksByTitle = []; // Array to store books with the specified title

    // Iterate through the books object
    for (let key in books) {
        if (books[key].title.toLowerCase() === title.toLowerCase()) {
            booksByTitle.push(books[key]); // Add the book to the results if the title matches
        }
    }

    if (booksByTitle.length > 0) {
        // If books are found, return them
        res.status(200).json(booksByTitle);
    } else {
        // If no books are found, return a 404 error
        res.status(404).json({ message: "No books found with the given title" });
    }
});

// Get book review
public_users.get('/review/:isbn', function (req, res) {
    const isbn = req.params.isbn; // Extract the ISBN from the request parameters
    const book = books[isbn]; // Find the book in the 'books' object

    if (book) {
        // If the book exists, return its reviews
        res.status(200).json(book.reviews);
    } else {
        // If the book does not exist, return a 404 error
        res.status(404).json({ message: "Book not found" });
    }
});

module.exports.general = public_users;

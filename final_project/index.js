const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;
let books = require('./router/booksdb.js'); // Importing books data

const app = express();

app.use(express.json());

// Session setup for customer routes
app.use("/customer", session({ secret: "fingerprint_customer", resave: true, saveUninitialized: true }));

// Authentication middleware for customer routes
app.use("/customer/auth/*", function auth(req, res, next) {
    if (req.session.authorization) {
        let token = req.session.authorization['accessToken']; // Access Token

        // Verify JWT token
        jwt.verify(token, "access", (err, customer) => {
            if (!err) {
                req.customer = customer; // Set authenticated customer data on the request object
                next(); // Proceed to the next middleware
            } else {
                return res.status(403).json({ message: "Customer not authenticated" });
            }
        });
    } else {
        return res.status(403).json({ message: "Customer not logged in" });
    }
});

// Internal helper endpoints for Axios calls
app.get('/internal/books', (req, res) => {
    res.status(200).json(books); // Return all books
});

app.get('/internal/books/:isbn', (req, res) => {
    const isbn = req.params.isbn;
    const book = books[isbn];
    if (book) {
        res.status(200).json(book); // Return the book with the given ISBN
    } else {
        res.status(404).json({ message: "Book not found" });
    }
});

app.get('/internal/books/author/:author', (req, res) => {
    const author = req.params.author;
    const booksByAuthor = Object.values(books).filter(
        book => book.author.toLowerCase() === author.toLowerCase()
    );
    if (booksByAuthor.length > 0) {
        res.status(200).json(booksByAuthor); // Return books by the given author
    } else {
        res.status(404).json({ message: "No books found for the given author" });
    }
});

app.get('/internal/books/title/:title', (req, res) => {
    const title = req.params.title;
    const booksByTitle = Object.values(books).filter(
        book => book.title.toLowerCase() === title.toLowerCase()
    );
    if (booksByTitle.length > 0) {
        res.status(200).json(booksByTitle); // Return books with the given title
    } else {
        res.status(404).json({ message: "No books found with the given title" });
    }
});

// Use routes for customers and general users
app.use("/customer", customer_routes);
app.use("/", genl_routes);

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

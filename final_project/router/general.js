const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
const { isValid, addUser } = require("./auth_users.js");
const public_users = express.Router();

/* ------------------------------------------------------------------
   Data source
   The book catalog is published at GET /catalog (the JSON from booksdb.js).
   The public routes below read it with Axios, asynchronously, so the server
   can keep answering other requests while a lookup is in progress.
------------------------------------------------------------------- */
public_users.get('/catalog', (req, res) => {
  return res.status(200).json(books);
});

// Axios call to our own /catalog endpoint. Returns a Promise of the books object.
// req.socket.localPort is the port this server is actually listening on.
const fetchBooks = (req) =>
  axios.get(`http://127.0.0.1:${req.socket.localPort}/catalog`).then((response) => response.data);

const hasBook = (allBooks, isbn) => Object.prototype.hasOwnProperty.call(allBooks, isbn);
const sameText = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

/* ------------------------------------------------------------------
   Registration
------------------------------------------------------------------- */
public_users.post("/register", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password || !String(username).trim()) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!isValid(username)) {
    return res.status(409).json({ message: "User already exists!" });
  }

  addUser(username, password);
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

/* ------------------------------------------------------------------
   Get the book list available in the shop  (async/await + Axios)
------------------------------------------------------------------- */
public_users.get('/', async (req, res) => {
  try {
    const allBooks = await fetchBooks(req);
    return res.status(200).json(allBooks);
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve the list of books" });
  }
});

/* ------------------------------------------------------------------
   Get book details based on ISBN  (Promise callbacks + Axios)
------------------------------------------------------------------- */
public_users.get('/isbn/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  fetchBooks(req)
    .then((allBooks) => {
      if (!hasBook(allBooks, isbn)) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
      }
      return res.status(200).json({ isbn, ...allBooks[isbn] });
    })
    .catch(() => res.status(500).json({ message: "Unable to retrieve the book" }));
});

/* ------------------------------------------------------------------
   Get book details based on author  (async/await + Axios)
------------------------------------------------------------------- */
public_users.get('/author/:author', async (req, res) => {
  const author = req.params.author;

  try {
    const allBooks = await fetchBooks(req);
    const booksbyauthor = Object.entries(allBooks)
      .filter(([, book]) => sameText(book.author, author))
      .map(([isbn, book]) => ({ isbn, title: book.title, reviews: book.reviews }));

    if (booksbyauthor.length === 0) {
      return res.status(404).json({ message: `No books found for the author ${author}` });
    }
    return res.status(200).json({ booksbyauthor });
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve books by author" });
  }
});

/* ------------------------------------------------------------------
   Get all books based on title  (async/await + Axios)
------------------------------------------------------------------- */
public_users.get('/title/:title', async (req, res) => {
  const title = req.params.title;

  try {
    const allBooks = await fetchBooks(req);
    const booksbytitle = Object.entries(allBooks)
      .filter(([, book]) => sameText(book.title, title))
      .map(([isbn, book]) => ({ isbn, author: book.author, reviews: book.reviews }));

    if (booksbytitle.length === 0) {
      return res.status(404).json({ message: `No books found with the title ${title}` });
    }
    return res.status(200).json({ booksbytitle });
  } catch (error) {
    return res.status(500).json({ message: "Unable to retrieve books by title" });
  }
});

/* ------------------------------------------------------------------
   Get book review  (Promise callbacks + Axios)
------------------------------------------------------------------- */
public_users.get('/review/:isbn', (req, res) => {
  const isbn = req.params.isbn;

  fetchBooks(req)
    .then((allBooks) => {
      if (!hasBook(allBooks, isbn)) {
        return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
      }
      return res.status(200).json(allBooks[isbn].reviews);
    })
    .catch(() => res.status(500).json({ message: "Unable to retrieve the reviews" }));
});

module.exports.general = public_users;

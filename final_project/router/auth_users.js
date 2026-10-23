const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
let books = require("./booksdb.js");
const regd_users = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "access";

// Registered users: [{ username, password }]. Passwords are stored as "salt:hash", never as plain text.
let users = [];

const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) =>
  `${salt}:${crypto.scryptSync(password, salt, 32).toString('hex')}`;

const passwordMatches = (password, stored) => {
  const [salt, hash] = stored.split(':');
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, 32);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

// Returns true when the username can be used for a NEW account:
// it must be a non-empty string that nobody has registered yet.
const isValid = (username) => {
  return typeof username === 'string'
    && username.trim().length > 0
    && !users.some((user) => user.username === username);
};

// Adds a new user to the records (used by POST /register in general.js)
const addUser = (username, password) => {
  users.push({ username, password: hashPassword(password) });
};

// Returns true when the username and password match a registered user
const authenticatedUser = (username, password) => {
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  const user = users.find((u) => u.username === username);
  return Boolean(user) && passwordMatches(password, user.password);
};

const findBook = (isbn) =>
  Object.prototype.hasOwnProperty.call(books, isbn) ? books[isbn] : undefined;

// Only registered users can login
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({ message: "Invalid login. Check username and password" });
  }

  // Sign a JWT and keep it in the session so later requests are authenticated
  const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "User successfully logged in", username });
});

// Add or modify a book review (the review text comes from ?review=... or from the JSON body)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const book = findBook(isbn);
  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  const review = req.query.review ?? (req.body && req.body.review);
  if (typeof review !== 'string' || review.trim() === '') {
    return res.status(400).json({ message: "A review is required, e.g. ?review=Great%20book" });
  }

  const username = req.user.username;
  const alreadyReviewed = Object.prototype.hasOwnProperty.call(book.reviews, username);
  book.reviews[username] = review.trim(); // one review per user per book

  return res.status(200).json({
    message: `Review for the book with ISBN ${isbn} was ${alreadyReviewed ? "modified" : "added"} successfully`,
    reviews: book.reviews
  });
});

// Delete the logged-in user's review of a book
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const book = findBook(isbn);
  if (!book) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }

  const username = req.user.username;
  if (!Object.prototype.hasOwnProperty.call(book.reviews, username)) {
    return res.status(404).json({ message: `No review by ${username} found for the ISBN ${isbn}` });
  }

  delete book.reviews[username]; // users can only delete their own review
  return res.status(200).json({ message: `Review for the ISBN ${isbn} posted by the user ${username} deleted.` });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
module.exports.addUser = addUser;
module.exports.JWT_SECRET = JWT_SECRET;

# Bookshop – Express Book Reviews (final project)

Server-side application for an online bookstore, built with Node.js and Express.
Forked from `ibm-developer-skills-network/expressBookReviews`.

## Features
- List all books, search by ISBN, author or title (Axios + Promises / async-await, see `final_project/router/general.js`)
- Read the reviews of a book
- Register and log in (session + JWT, passwords are stored hashed)
- Registered users can add, modify and delete their own review of a book

## Run
```bash
cd final_project
npm install
npm start          # nodemon index.js  (or: node index.js) – server on http://localhost:5000
```

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | all books |
| GET | `/isbn/:isbn` | book by ISBN |
| GET | `/author/:author` | books by author |
| GET | `/title/:title` | books by title |
| GET | `/review/:isbn` | reviews of a book |
| POST | `/register` | `{ "username", "password" }` |
| POST | `/customer/login` | `{ "username", "password" }` |
| PUT | `/customer/auth/review/:isbn?review=...` | add / modify own review (login required) |
| DELETE | `/customer/auth/review/:isbn` | delete own review (login required) |

## Assignment outputs
Files `getallbooks`, `getbooksbyISBN`, `getbooksbyauthor`, `getbooksbytitle`, `getbookreview`, `register`,
`login`, `reviewadded`, `deletereview` (and `githubrepo`) contain each cURL command and its output.
They are produced by `generate_outputs.sh` while the server is running.

#!/bin/bash
# Runs the cURL commands for Tasks 2-10 against the running server (npm start / node index.js
# in final_project, port 5000) and saves "command + output" into the files required by the
# assignment: getallbooks, getbooksbyISBN, getbooksbyauthor, getbooksbytitle, getbookreview,
# register, login, reviewadded, deletereview. With GITHUB_USER set it also creates githubrepo.
#
# Usage:  bash generate_outputs.sh      (the server must already be running)

HOST="http://localhost:5000"
JSON="Content-Type: application/json"
CREDS='{"username":"testuser","password":"test1234"}'

# save <file> <command...>: writes "$ <command>" and then the command's output into <file>
save() {
  local file="$1"; shift
  { echo "\$ $*"; eval "$@"; echo; } > "$file"
  echo "saved $file"
}

save getallbooks      "curl -s $HOST/"
save getbooksbyISBN   "curl -s $HOST/isbn/1"
save getbooksbyauthor "curl -s '$HOST/author/Jane%20Austen'"
save getbooksbytitle  "curl -s '$HOST/title/Pride%20and%20Prejudice'"
save getbookreview    "curl -s $HOST/review/1"
save register         "curl -s -X POST $HOST/register -H '$JSON' -d '$CREDS'"
save login            "curl -s -c cookies.txt -X POST $HOST/customer/login -H '$JSON' -d '$CREDS'"
save reviewadded      "curl -s -b cookies.txt -X PUT '$HOST/customer/auth/review/1?review=A%20timeless%20classic'"
save deletereview     "curl -s -b cookies.txt -X DELETE $HOST/customer/auth/review/1"

rm -f cookies.txt

# Task 1 (githubrepo): proves that YOUR repository is a fork of ibm-developer-skills-network/expressBookReviews.
# Run it after you forked the repo:   GITHUB_USER=your-github-username bash generate_outputs.sh
if [ -n "$GITHUB_USER" ]; then
  URL="${GITHUB_API:-https://api.github.com}/repos/$GITHUB_USER/expressBookReviews"
  PATTERN='"full_name"|"fork": true|"parent"|"source"'
  RESPONSE=$(curl -s "$URL")
  { echo "\$ curl -s $URL | grep -E '$PATTERN'"; echo "$RESPONSE" | grep -E "$PATTERN"; echo; } > githubrepo
  if echo "$RESPONSE" | grep -q '"fork": true'; then
    echo "saved githubrepo"
  else
    echo "WARNING: githubrepo does not show \"fork\": true. GitHub answered: $(echo "$RESPONSE" | grep '"message"')"
    echo "         Check that the fork exists, wait a few minutes (API rate limit) and run the script again."
  fi
fi

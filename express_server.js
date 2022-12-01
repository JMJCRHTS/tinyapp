const express = require("express");
const app = express();
const PORT = 8080;
const cookie = require('cookie-parser');

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookie());

const {addUser, checkIfAvail, generateRandomString, verifyShortUrl, getUserInfo, currentUser, urlsForUser} = require('./extraFunctions');

const urlDatabase = {
  "b2xVn2": {longURL: "http://www.lighthouselabs.ca", userID: "noor1997"},
  "9sm5xK": {longURL: "http://www.google.com", userID: "noor1997" },
};

const userDatabase = {
  "noor1997": {id: "noor1997", "email-address": "noor@chasib.com", password: "noor1997"},
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  templateVars = { current_user: currentUser(req.cookies['user_id'], userDatabase)};
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const {password} = req.body;
  const email = req.body['email-address'];
  if (email === '') {
    res.status(400).send('Email is required');
  } else if (password === '') {
    res.status(400).send('Password is required');
  } else if (!checkIfAvail(email, userDatabase)) {
    res.status(400).send('This email is already registered');
  } else {
    const newUser = addUser(req.body, userDatabase);
    res.cookie('user_id', newUser.id);
    res.redirect('/urls');
  }
});

app.get("/login", (req, res) => {
  templateVars = { current_user: currentUser(req.cookies['user_id'], userDatabase) };
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  const emailUsed = req.body['email-address'];
  const pwdUsed = req.body['password'];
  if (getUserInfo(emailUsed, userDatabase)) {
    const password = getUserInfo(emailUsed, userDatabase).password;
    const id = getUserInfo(emailUsed, userDatabase).id;
    if (password !== pwdUsed) {
      res.status(403).send('Error 403... re-enter your password');
    } else {
      res.cookie('user_id', id);
      res.redirect('/urls');
    }
  } else {
    res.status(403).send('Error 403... email not found');
  }
});

app.get("/urls", (req, res) => {
  const current_user = currentUser(req.cookies['user.id'], userDatabase);
  if (!current_user) {
    res.send("<html><body>Please sign in or register</body></html");
  }
  const userLinks = urlsForUser(current_user, urlDatabase);
  let templateVars = { urls: urlDatabase, current_user: currentUser(req.cookies['user_id'], userDatabase) };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const newURL = req.body.longURL;
  const user = currentUser(req.cookie['user_id'], userDatabase);
  urlDatabase[shortURL] = { longURL: newURL, userID: user};
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  const current_user = currentUser(req.cookies['user_id'], userDatabase);
  if (!current_user) {
    res.redirect('/login');
  }
  let templateVars = { current_user: current_user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const current_user = currentUser(req.cookies['user_id'], userDatabase);
  if (!urlDatabase[shortURL]) {
    res.send("The link does not exist");
  } else if (current_user !== urlDatabase[shortURL].userID) {
    res.send('This id does not belong to you');
  }
  if (verifyShortUrl(shortURL, urlDatabase)) {
    let longURL = urlDatabase[req.params.shortURL].longURL;
    let templateVars = { shortURL: shortURL, longURL: longURL, current_user: currentUser(req.cookies['user_id'], userDatabase)};
    res.render("urls_show", templateVars);
  } else {
    res.send('does not exist');
  }
});

app.get("/u/:id", (req, res) => {
  let shortURL = req.params.id;
  if (verifyShortUrl(shortURL, urlDatabase)) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404);
    res.send('Does not exist');
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const current_user = currentUser(req.cookies['user_id'], userDatabase);
  const shortURL = req.params.id;
  if (current_user !== urlDatabase[shortURL].userID) {
    res.send('This id does not belong to you');
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

app.post("/urls/:id/edit", (req, res) => {
  if (!checkOwner(currentUser(req.cookies['user_id'], userDatabase), req.params.id, urlDatabase)) {
    res.send('This id does not belong to you');
  }
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect('/urls');
});

const checkOwner = (userId, urlID, database) => {
  console.log('this is shortURL', urlID);
  return userId === database[urlID].userID;
};

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

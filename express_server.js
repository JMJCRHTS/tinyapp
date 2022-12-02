// dependencies
const express = require("express");
const app = express();
const cookie = require('cookie-session');
const bcrypt = require('bcryptjs');
const {urlDatabase, users} = require('./site_data');
const {generateRandomString, findUserEmail, urlsForUser, canEditDelete} = require('./helper_functions');

//view engine
app.set("view engine", "ejs");

//port
const PORT = 8080;

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookie({
  name: 'session',
  keys: 
}));

// routes
app.get("/", (req, res) => {
  let user = users[req.cookies["user_id"]];
  if (user) {
    res.redirect(302, "/urls");
  } else {
    res.redirect(302, "/login");
  }
});


// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });


app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (user) {
    const userUrls = urlsForUser(user.id, urlDatabase);
    const templateVars = {urls : userUrls, user};
    res.render("urls_index", templateVars);
  } else {
    const templateVars = {message: "You must be logged in to view this page", error: "401"};
    res
      .status(401)
      .render("urls_errors", templateVars);
  }
});


app.post("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (user) {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[shortURL] = { longURL, userID : user.id };
    res.redirect(302, `/urls/${shortURL}`);
  } else {
    const templateVars = {message : 'You do not have permission to modify this URL. Please log in to continue', error : '401'};
    res
      .status(401)
      .render("urls_errors", templateVars);
  }
});


app.get("/register", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.render("urls_register");
  } else {
    res.redirect(302, "/urls");
  }
});


app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    if (!findUserEmail(req.body.email, users)) {
      const randomID = `UID${generateRandomString()}`;
      const hashPassword = bcrypt.hashSync(req.body.password, 10);
      users[randomID] = {id : randomID, email : req.body.email, hashPassword};
      console.log(users);
      res
        .cookie('user_id', randomID)
        .redirect(302, '/urls');
    } else {
      const message = `User already exists. Please log in to access your account`;
      const templateVars = { message, error : '400' };
      res
        .status(400).render('urls_errors', templateVars);
    }
  } else {
    const message = 'Please fill out the email and password fields to register';
    const templateVars = { message, error : '400' };
    res
      .status(400).render('urls_errors', templateVars);
  }
});


app.get("/login", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.render('urls_login');
  } else {
    res.redirect(302, "/urls");
  }
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = findUserEmail(email, users);
  if (user && bcrypt.compareSync(password, user.hashPassword)) {
    res
      .cookie('user_id', user.id)
      .redirect(302, '/urls');
  } else {
    const templateVars = {message : "User authentication failed", error : '403'};
    res.status(403);
    res.render('urls_errors', templateVars);
  }
});


app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(302, '/urls');
});


app.get("/urls/new", (req, res) => {
  let user = users[req.cookies["user_id"]];
  if (user) {
    const templateVars = { user };
    res.render("urls_new", templateVars);
  } else {
    res.redirect(302, "/login");
  }
});


app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  let userUrlIds;
  if (user) {
    userUrlIds = Object.keys(urlsForUser(user.id, urlDatabase));
  }
  if (user && userUrlIds.includes(req.params.id)) {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user : users[req.cookies["user_id"]]};
    res.render("urls_show", templateVars);
  } else {
    const templateVars = {message : 'You do not have permission to view this URL', error : '401', user};
    res
      .status(401)
      .render("urls_errors", templateVars);
  }
});


app.post("/urls/:id", (req, res) => {
  const newUrl = req.body.newUrl;
  const user = users[req.cookies["user_id"]];
  if (canEditDelete(req, users, urlDatabase)) {
    urlDatabase[req.params.id].longURL = newUrl;
    res.redirect(302, "/urls");
  } else {
    const templateVars = {message: 'You are not authorized to edit this URL', error: "401", user};
    res
      .status(401)
      .render("urls_errors", templateVars);
    return;
  }
});


app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (canEditDelete(req, users, urlDatabase)) {
    delete urlDatabase[req.params.id];
    res.redirect(302, "/urls");
  } else {
    const templateVars = {message: 'You are not authorized to edit this URL', error: "401", user};
    res
      .status(401)
      .render("urls_errors", templateVars);
    return;
  }
});


app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id]) {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(302, longURL);
  } else {
    const templateVars = { message: `The page you are looking for does not exist`, error : '404', user : users[req.cookies['user_id']]};
    res
      .status(404)
      .render("urls_errors", templateVars);
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

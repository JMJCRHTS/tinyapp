// dependencies
const express = require("express");
const app = express();
const cookie = require("cookie-session");
const bcrypt = require("bcryptjs");
const {urlDatabase, users} = require("./site_data");
const {generateRandomString, getUserByEmail, urlsForUser, canEditDelete} = require("./helpers");

//view engine
app.set("view engine", "ejs");

//port
const PORT = 8080;

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookie({
  name: "session",
  keys: ["hello", "world"]
}));

// routes
app.get("/", (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    res.redirect(302, "/urls");
  } else {
    res.redirect(302, "/login");
  }
});


app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    const userUrls = urlsForUser(user.id, urlDatabase);
    const templateVars = {urls : userUrls, user};
    res.render("urls_index", templateVars);
  } else {
    res.redirect(302, '/login');
  }
});


app.post("/urls", (req, res) => {
  const user = users[req.session.user_id];
  if (user) {
    const shortURL = generateRandomString();
    const longURL = req.body.longURL;
    urlDatabase[shortURL] = { longURL, userID : user.id };
    res.redirect(302, `/urls/${shortURL}`);
  } else {
    const templateVars = {error : "401", message : "You do not have permission to edit this URL. Log in to continue"};
    res
      .status(401)
      .render("urls_errors", templateVars);
  }
});


app.get("/register", (req, res) => {
  if (!req.session.user_id) {
    res.render("urls_register");
  } else {
    res.redirect(302, "/urls");
  }
});


app.post("/register", (req, res) => {
  if (req.body.email && req.body.password) {
    if (!getUserByEmail(req.body.email, users)) {
      const randomID = `UIDN${generateRandomString()}`;
      const hashedPassword = bcrypt.hashSync(req.body.password, 10);
      users[randomID] = {id : randomID, email : req.body.email, hashedPassword};
      // eslint-disable-next-line camelcase
      req.session.user_id = randomID;
      res.redirect(302, "/urls");
    } else {
      const templateVars = {error : "400",  message: "User already exists. Log in to access your account"};
      res
        .status(400).render("urls_errors", templateVars);
    }
  } else {
    const templateVars = { error : "400", message: "Fill out the fields to register" };
    res
      .status(400).render("urls_errors", templateVars);
  }
});


app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    res.render("urls_login");
  } else {
    res.redirect(302, "/urls");
  }
});


app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (user && bcrypt.compareSync(password, user.hashedPassword)) {
    res
      .cookie("user_id", user.id)
      .redirect(302, "/urls");
  } else {
    const templateVars = {error : "403", message : "User authentication failed"};
    res.status(403);
    res.render("urls_errors", templateVars);
  }
});


app.post("/logout", (req, res) => {
  delete req.session.user_id;
  res.redirect(302, "/urls");
});


app.get("/urls/new", (req, res) => {
  let user = users[req.session.user_id];
  if (user) {
    const templateVars = { user };
    res.render("urls_new", templateVars);
  } else {
    res.redirect(302, "/login");
  }
});


app.get("/urls/:id", (req, res) => {
  const user = users[req.session.user_id];
  let userUrlIds;
  if (user) {
    userUrlIds = Object.keys(urlsForUser(user.id, urlDatabase));
  }
  if (user && userUrlIds.includes(req.params.id)) {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user };
    res.render("urls_show", templateVars);
  } else {
    const templateVars = { error : "401", message : "You do not have permission to view this URL", user };
    res
      .status(401)
      .render("urls_errors", templateVars);
  }
});


app.post("/urls/:id", (req, res) => {
  const newUrl = req.body.newUrl;
  const user = users[req.session.user_id];
  if (canEditDelete(req, users, urlDatabase)) {
    urlDatabase[req.params.id].longURL = newUrl;
    res.redirect(302, "/urls");
  } else {
    const templateVars = { error: "401", message: "You are not authorized to edit this URL", user };
    res
      .status(401)
      .render("urls_errors", templateVars);
    return;
  }
});


app.post("/urls/:id/delete", (req, res) => {
  const user = users[req.session.user_id];
  if (canEditDelete(req, users, urlDatabase)) {
    delete urlDatabase[req.params.id];
    res.redirect(302, "/urls");
  } else {
    const templateVars = {error: "401", message: "You are not authorized to edit this URL", user};
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
    const templateVars = { error : "404", message: `The page you are looking for does not exist`, user : users[req.session.user_id]};
    res
      .status(404)
      .render("urls_errors", templateVars);
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

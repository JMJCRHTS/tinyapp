const express = require("express");
const app = express();
const PORT = 8080;
const cookie = require('cookie-parser');
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookie());

const generateRandomString = () => {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies['username'] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies['username']};
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  if (verifyShortUrl(shortURL)) {
    let longURL = urlDatabase[req.params.shortURL];
    let templateVars = { shortURL: shortURL, longURL: longURL, username: req.cookies['username']
    };
    res.render("urls_show", templateVars);
  } else {
    res.send('does not exist');
  }
});

app.post("/urls", (req, res) => {
  const shortURL = generateRandomString();
  const newURL = req.body.longURL;
  urlDatabase[shortURL] = newURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  if (verifyShortUrl(shortURL)) {
    const longURL = urlDatabase[shortURL];
    res.redirect(longURL);
  } else {
    res.status(404);
    res.send('Does not exist');
  }
});

app.post("/urls/:id/delete", (req, res) => {
  const urlToDelete = req.params.id;
  delete urlDatabase[urlToDelete];
  res.redirect('/urls');
});

app.post("/urls/:id/edit", (req, res) => {
  const key = req.params.id;
  urlDatabase[key] = req.body.longURL;
  res.redirect('/urls');
});

app.post("/login", (req, res) => {
  if (req.body.username) {
    const username = req.body.username;
    res.cookie('username', username);
  }
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

const verifyShortUrl = URL => {
  return urlDatabase[URL];
};

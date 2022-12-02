const generateRandomString = function() {
  let string = '';
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  for (let i = 0; i < 6; i++) {
    if (Math.random() < 0.5) {
      string += Math.floor(Math.random() * 10);
    } else {
      string += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return string;
};

const findUserEmail = function(email, data) {
  for (let obj in data) {
    let user = data[obj];
    if (email === user.email) {
      return user;
    }
  }
  return null;
};

const urlsForUser = function(id, urlDatabase) {
  let output = {};
  for (let key in urlDatabase) {
    let url = urlDatabase[key];
    if (url.userID === id) {
      output[key] = url;
    }
  }
  return output;
};

const canEditDelete = function(req, users, urlDatabase) {
  const id = req.params.id;
  const user = users[req.cookies.user_id];

  if (!user || !urlDatabase[id]) {
    return false;
  }
  const userUrlIds = Object.keys(urlsForUser(user.id, urlDatabase));
  if (!userUrlIds.includes(id)) {
    return false;
  }
  return true;
};

module.exports = {generateRandomString, findUserEmail, urlsForUser, canEditDelete};

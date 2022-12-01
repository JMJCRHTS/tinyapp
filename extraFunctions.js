const addUser = (newUser, database) => {
  const newUserId = generateRandomString();
  newUser.id = newUserId;
  userDatabase[newUserId] = newUser;
  return newUser;
}

const checkIfAvail = (newVal, database) => {
  for (let user in database) {
    if (database[user]['email-address'] === newVal) {
      return false;
    }
  }
  return true;
};

const generateRandomString = () => {
  let result = "";
  let characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const verifyShortUrl = (URL, database) => {
  return database[URL];
};

const getUserInfo = (email, database) => {
  for (let key in database) {
    if (database[key]['email-address'] === email) {
      return database[key];
    }
  }
};

const currentUser = (cookie, database) => {
  for (let ids in database) {
    if (cookie === ids) {
      return database[ids]['email-address'];
    }
  }
};

const urlsForUser = (id, database) => {
  let currentUserId = id;
  let usersURLs = {};
  for (let key in database) {
    if (database[key].userID === currentUserId) {
      usersURLs[key] = database[key];
    }
  }
  return usersURLs;
};

module.exports = {addUser, checkIfAvail, generateRandomString, verifyShortUrl, getUserInfo, currentUser, urlsForUser};

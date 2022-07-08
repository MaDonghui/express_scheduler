// all social related code stays here

/**
 * expect user id
 * check if auth legal
 * return TBD
 */
const getProfile = (req, res, next) => {
  res.send("Your Social Profile");
};

/**
 * expect user id and friend id
 * check if auth legal
 * return TBD
 */
const newFriend = (req, res, next) => {
  res.send("New Friend!");
};

/**
 * expect user id and target id
 * check if auth legal
 * return TBD
 */
const removeFriend = (req, res, next) => {
  res.send("No Longer Friend :(");
};

module.exports = {
  getProfile,
  newFriend,
  removeFriend,
};

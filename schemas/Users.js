const mongoose = require("mongoose");

const UsersSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: "USER",
  },
});

module.exports = mongoose.model(
  "Users" /* Collection Name */,
  UsersSchema /* Collection Schema to use */
);

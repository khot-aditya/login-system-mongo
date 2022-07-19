const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv/config");

const Users = require("./schemas/Users");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const bcrypt = require("bcrypt");
const saltRounds = 10;

const jwt = require("jsonwebtoken");

app.use(cookieParser());
app.use(bodyParser.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(
  session({
    key: "userId",
    secret: "some_very_long_secret_text",
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

const verifyJWT = (req, res, next) => {
  const token = req.headers["x-access-token"];

  if (!token) res.send("need a token");
  else {
    jwt.verify(token, "json_web_token_long_secret", (err, decoded) => {
      if (err) res.json({ auth: false, message: "failed to authenticate" });
      else {
        require.userId = decoded.id;
        next();
      }
    });
  }
};

app.get("/isUserAuth", verifyJWT, (req, res) => {
  res.send("Authenticated");
});

app.get("/login", (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  Users.find({ username: username }, (err, users) => {
    if (users.length > 0) {
      bcrypt.compare(password, users[0].password, (error, response) => {
        if (response) {
          const id = users[0]._id.valueOf();

          const token = jwt.sign({ id }, "json_web_token_long_secret", {
            expiresIn: 300,
          });

          req.session.user = users;
          res.json({ auth: true, token: token, result: users });
        } else {
          console.log(1, err);
          res.json({ auth: false, message: "Wrong username or password." });
        }
      });
    } else {
      console.error("User not found.");
      res.json({ auth: false, message: "User not found." });
    }
  });
});

app.post("/register", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  bcrypt.hash(password, saltRounds, async (error, hash) => {
    if (error) console.log(error);
    // --------

    const users = new Users({
      username: username,
      password: hash,
    });

    try {
      const result = await users.save();
      console.log(result);
      res.status(200);
    } catch (err) {
      console.log(err);
      res.status(500);
    }
  });
});

// connect to mongo db
mongoose.connect(
  process.env.DB_CONNECTION,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  () => {
    console.log("connected");
  }
);

app.listen(3001, () => {
  console.log("listening on port 3001");
});

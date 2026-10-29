
const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

const users = [];

const JWT_SECRET =
  process.env.JWT_SECRET || "replace-this-jwt-secret";

router.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required"
    });
  }

  if (users.some((user) => user.username === username)) {
    return res.status(409).json({
      message: "Username already exists"
    });
  }

  const user = {
    id: users.length + 1,
    username,
    password
  };

  users.push(user);

  res.status(201).json({
    message: "Registration successful",
    user: { id: user.id, username: user.username }
  });
});

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = users.find(
    (item) =>
      item.username === username &&
      item.password === password
  );

  if (!user) {
    return res.status(401).json({
      message: "Invalid username or password"
    });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({
    message: "Login successful",
    token
  });
});

module.exports = router;

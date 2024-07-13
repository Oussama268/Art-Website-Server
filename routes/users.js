const express = require('express');
const router = express.Router();
const {db} = require("../firebase")
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const { check, validationResult } = require("express-validator");
const SECRET_KEY = process.env.SECRET_KEY


router.get('/:id?', async (req, res) => {
  const usersRef = db.ref('users');
  const userId = req.params.id;

  try {
    if (userId) {
      const userSnapshot = await usersRef.child(userId).once('value'); // Retrieve a specific user
      const user = userSnapshot.val();

      if (user) {
        return res.json(user);
      } else {
        return res.status(404).json({ error: 'User not found' });
      }
    }

    const usersSnapshot = await usersRef.once('value'); // Retrieve all users
    const users = usersSnapshot.val();

    res.json(users); // Return the list of all users
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




router.post("/sign", async (req, res) => {
  try {
      // Extract relevant user data
      const userData = {
          username: req.body.username,
          email: req.body.email,
          password: await bcrypt.hash(req.body.password, 10), // Hash the password
          description: "None",
          followers: {},
          followers_count: 0,
          hearts: {},
          hearts_count: 0,
          playlists: {},
          posts: {},
          backgroundImg: "users/default/default_profile_bg.jpg",
          profileImg: "users/default/default_profile_pic.jpg",
      };

      // Store user data in Realtime Database
      const newUserRef = db.ref("users").push(userData);
      const newUserId = newUserRef.key;
      const followersRef = db.ref(`users/${newUserId}/followers`)
      await followersRef.child(newUserId).set(true)
      

      if (newUserId) {
          const token = jwt.sign({ userId: newUserId }, SECRET_KEY, { expiresIn: '48h' });
          return res.json({ token });
      } else {
          res.status(500).json({ error: "User not added" });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
  }
});



router.post(
  "/login",
  [
    check("email").isEmail().withMessage("A valid email is required"),
    check("password").isString().withMessage("Password is required"),
  ],
  async (req, res) => {
    // Validate request input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Query Firebase Realtime Database for user with the given email
      const usersRef = db.ref("users");
      const query = usersRef.orderByChild("email").equalTo(email);
      const snapshot = await query.once("value");

      const userData = snapshot.val();

      if (userData) {
        // Loop through matching users to find a valid password
        for (const userId in userData) {
          const user = userData[userId];
          if (await bcrypt.compare(password, user.password)) {
            // If password is correct, return the user ID
            const token = jwt.sign({ userId: userId }, SECRET_KEY, { expiresIn: '48h' });
            return res.json({ token });
          }
        }
      }

      // If no matching user or password doesn't match
      return res.status(401).json({ error: "Invalid email or password" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
);




module.exports = router;
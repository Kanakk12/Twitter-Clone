const express = require('express');
const router = express.Router();
const bcryptjs = require('bcryptjs'); // Import bcryptjs for password hashing
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require('../config'); // Import JWT_SECRET from config file
const mongoose = require('mongoose');
const UserModel = mongoose.model('UserModel');
const protectedRoute = require('../middleware/protectedResource');


// REGISTER
router.post('/auth/register', async (req, res) => {
  const { name, email, username, password } = req.body;
  if (!name || !username || !password || !email) {
    return res.status(400).json({ error: 'One or more mandatory fields are empty' });
  }

  try {
    // Check if email exists
    const userWithEmail = await UserModel.findOne({ email: email });
    if (userWithEmail) {
      return res.status(500).json({ error: 'User with this email already exists' });
    }

    // Check if username exists
    const userWithUsername = await UserModel.findOne({ username: username });
    if (userWithUsername) {
      return res.status(500).json({ error: 'User with this username already exists' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    const newUser = new UserModel({
      name: name,
      email: email,
      username: username,
      password: hashedPassword
    });

    // Save new user to database
    await newUser.save();
    res.status(201).json({ result: 'User Registered Successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// LOGIN
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'One or more mandatory fields are empty' });
  }

  try {
    // Check if username exists
    const userWithUsername = await UserModel.findOne({ username: username });
    if (!userWithUsername) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    // Compare passwords
    const isPasswordMatch = await bcryptjs.compare(password, userWithUsername.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    // Generate JWT token
    const jwtToken = jwt.sign({ _id: userWithUsername._id }, JWT_SECRET);

    // Prepare user information to be sent in response
    const userInfo = { username: userWithUsername.username, email: userWithUsername.email };

    res.status(200).json({ result: { token: jwtToken, user: userInfo } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// GET A SINGLE USER DETAIL
router.get('/user/:id', async (req, res) => {
  try {
      const userID = req.params.id;
      const user = await UserModel.findById(userID)
          .select('-password') // Exclude password field
          .populate('followers', 'name username profilePicture') // Populate followers
          .populate('following', 'name username profilePicture'); // Populate following

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({ user });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// FOLLOW USER
router.post('/user/:id/follow', protectedRoute, async (req, res) => {
  try {
      const userID = req.params.id;

      // Check if the user is trying to follow himself
      if (userID === req.user._id.toString()) {
          return res.status(400).json({ error: 'You cannot follow yourself' });
      }

      const userToFollow = await UserModel.findById(userID);
      const currentUser = await UserModel.findById(req.user._id);

      // Check if userToFollow exists
      if (!userToFollow) {
          return res.status(404).json({ error: 'User to follow not found' });
      }

      // Check if the user is already following the userToFollow
      if (currentUser.following.includes(userID)) {
          return res.status(400).json({ error: 'You are already following this user' });
      }

      // Add userToFollow to currentUser's following array
      currentUser.following.push(userID);
      await currentUser.save();

      // Add currentUser to userToFollow's followers array
      userToFollow.followers.push(req.user._id);
      await userToFollow.save();

      res.status(200).json({ message: 'You are now following the user' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// UNFOLLOW USER
router.post('/user/:id/unfollow', protectedRoute, async (req, res) => {
  try {
      const userID = req.params.id;

      const userToUnfollow = await UserModel.findById(userID);
      const currentUser = await UserModel.findById(req.user._id);

      // Check if userToUnfollow exists
      if (!userToUnfollow) {
          return res.status(404).json({ error: 'User to unfollow not found' });
      }

      // Check if the user is not following the userToUnfollow
      if (!currentUser.following.includes(userID)) {
          return res.status(400).json({ error: 'You are not following this user' });
      }

      // Remove userToUnfollow from currentUser's following array
      currentUser.following = currentUser.following.filter(id => id !== userID);
      await currentUser.save();

      // Remove currentUser from userToUnfollow's followers array
      userToUnfollow.followers = userToUnfollow.followers.filter(id => id !== req.user._id);
      await userToUnfollow.save();

      res.status(200).json({ message: 'You have unfollowed the user' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
  }
});



// EDIT USER DETAILS
router.put('/user/:id', protectedRoute, async (req, res) => {
  try {
      const userID = req.params.id;
      const { name, dateOfBirth, location } = req.body;

      // Find user by ID
      const user = await UserModel.findById(userID);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Update user details
      if (name) user.name = name;
      if (dateOfBirth) user.dateOfBirth = dateOfBirth;
      if (location) user.location = location;

      await user.save();

      res.status(200).json({ message: 'User details updated successfully' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// GET USER TWEETS
router.post('/user/:id/tweets', async (req, res) => {
  try {
      const userID = req.params.id;
      const userTweets = await TweetModel.find({ tweetedBy: userID })
          .populate('tweetedBy', 'name username profilePicture') // Populate user details
          .sort({ createdAt: -1 }); // Sort by createdAt field in descending order

      res.status(200).json({ tweets: userTweets });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
  }
});





module.exports = router;
















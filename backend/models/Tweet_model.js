// models/Tweet.js
const mongoose = require('mongoose');

// schemas tweet
const tweetSchema = new mongoose.Schema({
  content: { type: String, required: true },
  tweetedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'UserModel', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' }],
  retweetBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'UserModel' }],
  image: { type: String },
  replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TweetModel' }]
}, { timestamps: true });

module.exports = mongoose.model('TweetModel', tweetSchema);

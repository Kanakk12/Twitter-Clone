const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const TweetModel = mongoose.model('TweetModel');

const protectedRoute = require('../middleware/protectedResource');

// all users tweets
router.get("/alltweets", (req, res)=>{
    TweetModel.find()
    .populate("tweetedBy", "_id name profilePicture ")
    .then((dbTweets)=>{
        res.status(200).json({tweets: dbTweets})
    })
    .catch((error)=>{
        console.log(error);
    })
});

// all tweets only from logged in user
router.get("/myalltweets", protectedRoute, (req, res) => {
        TweetModel.find({ tweetedBy: req.user._id })
            .populate("tweetedBy", "_id name profilePicture")
            .then((dbTweets) => {
                res.status(200).json({ tweets: dbTweets });
            })
            .catch((error) => {
                console.log(error);
              
            });
});





// Post a tweet
router.post('/tweet', protectedRoute, async (req, res) => {
    try {
        const { content } = req.body;

        // Validate request body
        if (!content) {
            return res.status(400).json({ error: 'Please provide content for the tweet' });
        }

        // Create a new tweet associated with the logged-in user
        const newTweet = new TweetModel({ content, tweetedBy: req.user._id });
        await newTweet.save();

        res.status(201).json({ message: 'Tweet created successfully', tweet: newTweet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE A TWEET
router.delete("/deletetweet/:tweetID", protectedRoute, async (req, res) => {
    try {
        const tweetID = req.params.tweetID;

        // Find the tweet by ID
        const tweet = await TweetModel.findOne({ _id: tweetID });

        // Check if the tweet exists
        if (!tweet) {
            return res.status(404).json({ error: 'Tweet not found' });
        }

        // Check if the logged-in user is the owner of the tweet
        if (tweet.tweetedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You are not authorized to delete this tweet' });
        }

        // Delete the tweet
        await tweet.remove();

        res.status(200).json({ message: 'Tweet deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});



// LIKE A TWEET
router.put('/like', protectedRoute, (req, res)=>{
     TweetModel.findByIdAndUpdate(req.body.tweetId, {
        $push: { likes:req.user._id}
     },{
        new: true //returns updated record
     } ).populate("tweetedBy", "_id name")
     .exec((error, result)=>{
        if(error){
            return res.status(400).json({ error: error});
        }else{
            res.json(result);
        }
     })
});


// DISLIKE A TWEET
router.put('/unlike', protectedRoute, (req, res)=>{
    TweetModel.findByIdAndUpdate(req.body.tweetId, {
       $pull: { likes:req.user._id}
    },{
       new: true //returns updated record
    } ).populate("tweetedBy", "_id name")
    .exec((error, result)=>{
       if(error){
           return res.status(400).json({ error: error});
       }else{
           res.json(result);
       }
    })
});

module.exports = router;


// RETWEET A TWEET
router.post('/tweet/:id/retweet', protectedRoute, async (req, res) => {
    try {
        const tweetID = req.params.id;

        // Check if the user has already retweeted this tweet
        const existingRetweet = await TweetModel.findOne({ _id: tweetID, retweetBy: req.user._id });
        if (existingRetweet) {
            return res.status(400).json({ error: 'You have already retweeted this tweet' });
        }

        // Add user ID to the retweetBy array of the tweet
        const retweetedTweet = await TweetModel.findByIdAndUpdate(tweetID, {
            $push: { retweetBy: req.user._id }
        }, { new: true });

        res.status(200).json({ message: 'Tweet retweeted successfully', tweet: retweetedTweet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

  
// REPLY TO A TWEET
router.post('/tweet/:id/reply', protectedRoute, async (req, res) => {
    try {
        const tweetID = req.params.id;
        const { content } = req.body;

        // Validate request body
        if (!content) {
            return res.status(400).json({ error: 'Please provide content for the reply' });
        }

        // Save the reply tweet as a new Tweet in the DB
        const newReply = new TweetModel({
            content,
            tweetedBy: req.user._id,
            replies: [tweetID] // Store the parent tweet ID in the replies array
        });
        await newReply.save();

        res.status(201).json({ message: 'Reply posted successfully', reply: newReply });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GET ALL TWEET DETAILS
router.get('/tweet', async (req, res) => {
    try {
        const allTweets = await TweetModel.find()
            .populate('tweetedBy', '_id name profilePicture') // Populate user details
            .populate('likes', '_id name profilePicture') // Populate likes
            .populate('retweetBy', '_id name profilePicture') // Populate retweet information
            .populate('replies'); // Populate replies

        // Sort tweets by createdAt field in descending order
        allTweets.sort((a, b) => b.createdAt - a.createdAt);

        res.status(200).json({ tweets: allTweets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// GET A SINGLE TWEET DETAIL
router.get('/tweet/:id', async (req, res) => {
    try {
        const tweetID = req.params.id;
        const tweet = await TweetModel.findById(tweetID)
            .populate('tweetedBy', '_id name profilePicture') // Populate user details
            .populate('likes', '_id name profilePicture') // Populate likes
            .populate('retweetBy', '_id name profilePicture') // Populate retweet information
            .populate('replies'); // Populate replies

        if (!tweet) {
            return res.status(404).json({ error: 'Tweet not found' });
        }

        res.status(200).json({ tweet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

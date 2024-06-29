// server.js (Backend)

const express = require('express');
const mongoose = require('mongoose');
const PORT = 5000;
const app = express();
const cors = require('cors');
const {MONGODB_URL} = require('./config')



// MongoDB connection
mongoose.connect(MONGODB_URL);

mongoose.connection.on('connented', ()=>{
  console.log("DB connected");
})

mongoose.connection.on('error', ()=>{
  console.log("some error while connecting to DB");
})

require('./models/User_model')
require ('./models/Tweet_model')


// Add CORS middleware
app.use(cors());
app.use(express.json()); // Middleware to parse JSON request bodies

app.use(require('./routes/user_route'));
app.use(require('./routes/tweet_route'));
app.use(require('./routes/file_route'));


  

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});



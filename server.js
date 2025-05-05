const express = require("express")
const app = express();
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require('morgan');
const bodyParser = require('body-parser');
const database = require('./firebase.js');
const bcrypt = require("bcrypt");



dotenv.config()
app.use(bodyParser.json());
app.use(morgan('dev'));

app.use(cors({
  origin: ["https://artuniverse.onrender.com", "http://localhost:5173"],
  methods: ["GET", "POST", "PUT", "DELETE"], 
  allowedHeaders: ["Content-Type", "Authorization"], 
}));

app.options('*', cors());




const userRoutes = require('./routes/users');
const profilesRoutes = require('./routes/profiles.js')
const postsRoutes = require('./routes/posts.js')
const commentsRoutes = require('./routes/comments.js')
const tagsRoutes = require('./routes/tags.js')
const playlistRoutes = require('./routes/playlists.js')


app.use("/users", userRoutes);
app.use("/profiles", profilesRoutes)
app.use("/posts", postsRoutes)
app.use("/comments", commentsRoutes)
app.use("/tags",tagsRoutes)
app.use("/playlists",playlistRoutes)





app.get("/", (req, res) => {
    res.json({message : "main api [age"})

  
})
    




app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Something went wrong!');
  });


const PORT = process.env.EXPRESS_PORT;

app.listen(PORT, () => {
    console.log("connected on port 7000")
})

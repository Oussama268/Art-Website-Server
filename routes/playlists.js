const express = require('express');
const router = express.Router();
const {db, bucket} = require("../firebase")
const bcrypt = require("bcrypt");
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require("express-validator");
const SECRET_KEY = process.env.SECRET_KEY





//get all playlists using a userId

router.get("/:id", async(req, res) => {

    const userId = req.params.id

    const playlistsRef = db.ref("playlists")

    const playlistsQuery = playlistsRef.orderByChild('userId').equalTo(userId);

    try{
        const snapshot = await playlistsQuery.once("value")
        if(snapshot.exists()){

            const playlists = snapshot.val()
            return res.json(playlists)

        }else{

            res.status(404).json({ message: "playlists not found"})
        }

    } catch(error){

            res.status(500).json({message : "serevr error"})

    }

})


//get a playlist id using title

router.get('/playlistId/:title', async (req, res) => {
    const playlistTitle = req.params.title;
  
    try {
      // Query the Firebase db for the playlist with the given title
      const playlistsRef = db.ref('playlists');
      const snapshot = await playlistsRef.orderByChild('title').equalTo(playlistTitle).once('value');
  
      if (!snapshot.exists()) {
        return res.status(404).json({ error: 'Playlist not found' });
      }
  
      // Extract the playlist ID from the snapshot
      const playlistId = Object.keys(snapshot.val())[0]; // Assuming there's only one matching playlist
  
      res.json({ playlistId });
    } catch (error) {
      console.error('Error fetching playlist ID:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });


//get all posts using a playlist title

router.get("/posts/:playlistId", async (req, res) => {
    const playlistId = req.params.playlistId;

  try {
    // Reference to the playlist node
    const playlistRef = db.ref(`playlists/${playlistId}`);

    // Fetch the playlist data
    const playlistSnapshot = await playlistRef.once('value');
    const playlistData = playlistSnapshot.val();

    

    // Extract post IDs from the playlist data
    const postIds = Object.keys(playlistData.postsId);

    // Array to store post data with parent playlist ID
    let posts = {};

    // Fetch each post by its ID and include parent playlist ID
    for (let postId of postIds) {
      const postRef = db.ref(`posts/${postId}`);
      const postSnapshot = await postRef.once('value');
      const postData = postSnapshot.val();
      
      if (postData) {

        const newKey = postId;
        posts[newKey] = postData;
        
        
      }
    }

    // Return the posts array with parent playlist IDs
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

















module.exports = router;
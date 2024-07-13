const express = require('express');
const router = express.Router();
const {db, bucket} = require("../firebase")
const bcrypt = require("bcrypt");
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require("express-validator");
const SECRET_KEY = process.env.SECRET_KEY
const { format } = require('date-fns'); 




//Get comments using id post
router.get('/:id', async(req, res) => {

    const postId = req.params.id;
    const postRef = db.ref(`posts/${postId}/comments`);
    const commentsRef = db.ref('comments');

  try {
    // Fetch the comment IDs from the post
    const postSnapshot = await postRef.once('value');
    const commentIds = postSnapshot.val();

    if (!commentIds) {
      // If there are no comment IDs, return an empty array
      return res.status(200).json({ comments: [] });
    }

    // Create an array of promises to fetch all comments using the comment IDs
        const commentPromises = Object.keys(commentIds).map((commentId) => {
            return commentsRef.child(commentId).once('value'); // Fetch the comment by its ID
    });

    // Wait for all promises to resolve and extract the comment data
        const commentSnapshots = await Promise.all(commentPromises);

    // Extract the comment data from the snapshots
        const comments = commentSnapshots.map((snapshot) => snapshot.val());

    // Return the comments to the client
        res.status(200).json({ comments });
  }catch(error){

        console.log(error)
        return res.status(500).json({ error: "Internal server error"})
    }



})






//add comment
router.post('/create', async(req, res) => {

    try{
        const commentsRef = db.ref('comments')
        const postCounterRef = db.ref(`posts/${req.body.postId}/comments/counter`)
        const postCommentsRef = db.ref(`posts/${req.body.postId}/comments/commentsId`)

        //Getting the current data
        const now = new Date();
        const currentDate = format(now, 'yyyy-MM-dd HH:mm:ss');

        const comment = {
            userId: req.body.userId,
            postId: req.body.postId,
            text: req.body.text,
            date: currentDate
        }

        const newCommentRef = await commentsRef.push(comment);
        const commentId = newCommentRef.key

        
        await postCommentsRef.child(commentId).set(true)

        await postCounterRef.transaction((currentCounter) => {
            
            return currentCounter + 1
        })


        return res.status(200).json({ message: 'Comment added and linked to post' });
    }catch(error){

        console.log(error)
        return res.status(500).json({ error: "internal server error"})
    }
})





//Modify comment text
router.post('/edit',async(req, res)=>{
    try {
        const id = req.body.CommentId
        
        const newText = req.body.newText

        const commentsRef= db.ref(`comments/${id}/text`)

        await commentsRef.update(newText)

        return res.status(200).json({message: "comment updated"})




    } catch (error) {

        return res.status(500).json({message: "Internal server error"})
    }
} )





module.exports = router
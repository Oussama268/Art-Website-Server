const express = require('express');
const router = express.Router();
const {db, bucket} = require("../firebase")
const bcrypt = require("bcrypt");
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require("express-validator");
const SECRET_KEY = process.env.SECRET_KEY
const { format } = require('date-fns'); 

const upload = multer({ storage: multer.memoryStorage() }); 



//Get one post/all posts
router.get('/:id?', async(req, res) => {

    try{
        const id = req.params.id
        const postsRef = db.ref('posts')
        if(id){

            const post = (await postsRef.child(id).once("value")).val();
            return res.json(post)
        }

        const posts = (await postsRef.once("value")).val();
        return res.json(posts)


    }catch(error){

        console.log(error)
        return res.status(500).json({error: "Internal server error"})
    }
})


// GET posts by tags
router.get('/tags/:tag', async (req, res) => {
    try {
      const tag = req.params.tag.split(',');
      const postsRef = db.ref('posts');
  
      // Fetch all posts
      const snapshot = await postsRef.once('value');
      const posts = snapshot.val();
  
      if (!posts || Object.keys(posts).length === 0) {
        return res.status(404).json({ error: 'No posts found' });
      }
  
      // Filter posts based on the given tag
      const filteredPosts = [];
      Object.keys(posts).forEach(postId => {
        const post = posts[postId];
        const tags = post.tags || {};
        if (tag.every(tagItem => tags[tagItem])) {
            filteredPosts.push(posts[postId]);
          }
      });
  
      if (filteredPosts.length === 0) {
        return res.status(404).json({ error: `No posts found with tag '${tag}'` });
      }
  
      return res.json(filteredPosts);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  




//Add post
router.post("/create", upload.single('postImg'), async (req, res) => {
    try{

        const {userId, title, tags } = req.body
        const postImg = req.file

        if(!postImg){

            return res.status(400).json({error : "No File uploaded"})
        }

        const posterUsername = (await db.ref(`users/${userId}`).once('value')).val().username

        //Making fire storage image path
        const postImgPath = `posts/${posterUsername}/${title}`

        //Getting the poster username to use it in image path
        const file = bucket.file(postImgPath);
        await file.save(postImg.buffer, {
            contentType: postImg.mimetype, // Set the correct MIME type
          });
        
        

        //Getting the current data
        const now = new Date();
        const currentDate = format(now, 'yyyy-MM-dd HH:mm:ss');

        const postsRef = db.ref('posts');
        const postData = {
            userId: userId,
            title: title,
            tags: JSON.parse(tags),
            postImg: postImgPath,
            likes: {
                likeBy:{
                    default: true,
                },
                counter: 1
            },
            comments: {
                commentsId: {

                },
                counter: 0
            },
            date: currentDate
        };

        await postsRef.push(postData)


        return res.status(200).json({message: "Post added sucessfully"})

    } catch(error){

        console.log(error);
        return res.status(500).json({error: "Internal server error"})

    }
})




//Edit post title
router.post('/title/:id', async(req, res) => {

    try{
        const postId = req.params.id
        const postsRef = db.ref(`posts/${postId}`);
        if(!postsRef){

            return res.status(401).json({error: "Post not found"})
        }

        await postsRef.update({title: req.body.title})


        return res.status(200).json({message: "Title modified sucessfully"})


    } catch(error){ 
        

        return res.status(500).json({error: "Internal server error"})
    }



})




//Edit post tags
router.post('/tags/:id', async(req, res) => {

    try{
        const postId = req.params.id
        const postsRef = db.ref(`posts/${postId}`);
        if(!postsRef){

            return res.status(401).json({error: "Post not found"})
        }

        await postsRef.update({tags: req.body})

        return res.status(200).json({message: "Tags updated sucessfully"})
            

    } catch(error){

        console.log(error)
        res.status(500).json({error: "Internal server error"})
    }
})




//Like a post
router.post('/like/:id', async(req, res) => {

    const postId = req.params.id
    const userId = req.body.userId

    try{
        const postRef = db.ref('posts');
        const postCounterRef = db.ref(`posts/${postId}/likes/counter`)
        const postsLikesIdsRef = db.ref(`posts/${postId}/likes/likeBy`)


        await postsLikesIdsRef.child(userId).set(true)

        await postCounterRef.transaction((currentCounter) => {

            return currentCounter + 1
        })
        return res.status(200).json({message: "Tags updated sucessfully"})

    } catch(error){

        console.log(error)
        return res.status("nothiong",error)
    }
})

//unLike a post
router.post('/unlike/:id', async(req, res) => {

    const postId = req.params.id
    const userId = req.body.userId

    try{
        const postRef = db.ref('posts');
        const postCounterRef = db.ref(`posts/${postId}/likes/counter`)
        const postsLikesIdsRef = db.ref(`posts/${postId}/likes/likeBy`)


        await postsLikesIdsRef.child(userId).remove();

        await postCounterRef.transaction((currentCounter) => {

            return currentCounter - 1
        })
        return res.status(200).json({message: "disliked sucessfully"})

    } catch(error){

        console.log(error)
        return res.status("nothiong",error)
    }
})




//Getting all posts using a user ID

router.get("/userPosts/:id", async(req, res) => {

    const userId = req.params.id;

    const postsRef = db.ref("posts")

    // Create a query to find all posts by a specific userId
    const postsQuery = postsRef.orderByChild('userId').equalTo(userId);

    try{
        const snapshot = await postsQuery.once("value")
        if(snapshot.exists()){

            const posts = snapshot.val()
            return res.json(posts)

        }else{

            res.status(404).json({ message: "posts not found"})
        }

    } catch(error){

            res.status(500).json({message : "serevr error"})

    }


})






module.exports = router;
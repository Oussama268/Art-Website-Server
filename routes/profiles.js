const express = require('express');
const router = express.Router();
const {db, bucket} = require("../firebase")
const bcrypt = require("bcrypt");
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require("express-validator");
const SECRET_KEY = process.env.SECRET_KEY


const upload = multer({ storage: multer.memoryStorage() }); 

//Getting a profile with username
router.get("/:username", async (req,res) => {
    const profilesRef = db.ref('users');
    const username = req.params.username;


    try{
        const profileSnapShot = await profilesRef.orderByChild("username").equalTo(username).once('value');
        const profile =  profileSnapShot.val()
        if(profile){
           // const firstProfileKey = Object.keys(profile)[0];
            //const profileData = profile[firstProfileKey];
            res.json(profile);

        }else{

            res.status(401).json({error: "profile not found"});
        }



    }
    catch(error){

        res.status(500).json({error: "Internam Server Error"});
    }
    
})


//Changing Profile cover image
router.post("/cover/:id", upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' }); // Handle case where no file is provided
    }
    const userId = req.params.id;
    const profilesRef = db.ref('users');

    try{
        const profileRef = profilesRef.child(userId)
        const profileSnapShot = profileRef.once('value');
        const user = (await profileSnapShot).val();
        const newCoverImgPath = `users/${user["username"]}/${user["username"]}_profile_bg.jpg`; //the new name of the cover image in db

        if(!profileSnapShot){
            return res.status(404).json({error: "profile not found"})
        }
        const file = bucket.file(newCoverImgPath);
        await file.save(req.file.buffer, {
            contentType: req.file.mimetype, // Set the correct MIME type
          });

        await profileRef.update({backgroundImg: newCoverImgPath});


        res.status(200).json({message: "Cover Image changed successfully"})

    }catch(error){
        console.log(error)
        res.status(500).json({error: "Internal Server Error"})
    }
    
})



//Changing Profile pfp image
router.post("/pfp/:id", upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' }); // Handle case where no file is provided
    }
    const userId = req.params.id;
    const profilesRef = db.ref('users');

    try{
        const profileRef = profilesRef.child(userId)
        const profileSnapShot = profileRef.once('value');
        const user = (await profileSnapShot).val();
        const newProfileImgPath = `users/${user["username"]}/${user["username"]}_profile_pic.jpg`; //the new name of the cover image in db

        if(!profileSnapShot){
            return res.status(404).json({error: "profile not found"})
        }
        const file = bucket.file(newProfileImgPath);
        await file.save(req.file.buffer, {
            contentType: req.file.mimetype, // Set the correct MIME type
          });

        await profileRef.update({profileImg: newProfileImgPath});


        res.status(200).json({message: "Profile Image changed successfully"})

    }catch(error){
        console.log(error)
        res.status(500).json({error: "Internal Server Error"})
    }
    
})



router.post('/like/:id', async(req, res) => {

    const profileId = req.params.id
    const userId = req.body.userId
    const islike = req.body.islike

    try{
        const profileRef = db.ref('users');
        const heartCounterRef = db.ref(`users/${profileId}/hearts_count`)
        const HeartersRef = db.ref(`users/${profileId}/hearts`)
        const isUserExist = db.ref(`users/${profileId}/hearts/${userId}`) 

     
            if(!islike){
                await HeartersRef.child(userId).set(true)

                await heartCounterRef.transaction((currentCounter) => {

                    return currentCounter + 1
                })

            }else{
                await HeartersRef.child(userId).remove()

                await heartCounterRef.transaction((currentCounter) => {

                    return currentCounter - 1
                })
            }
            return res.status(200).json({ message: "profile liked"})
    

        


    } catch(error){

        console.log(error)
        return res.status(500).json({ message: "Internal server error"})
    }
})



router.post('/description/:id', async(req, res) => {

    
    const userId = req.params.id

    const newDescription = req.body.description
    try{

        const descriptionRef = db.ref(`users/${userId}`)

        await descriptionRef.update({description: newDescription})


        return res.status(200).json({message: "description updated sucessfully"})
    
    }catch{

        return res.status(500).json({error: "internal server error"})
    }


})








module.exports = router;
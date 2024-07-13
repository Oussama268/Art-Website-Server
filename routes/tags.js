const express = require('express');
const router = express.Router();
const {db} = require("../firebase")



//Get all tags
router.get('/', async (req, res) => {
    try {
        const tagsRef = db.ref('tags');
        const snapshot = await tagsRef.once('value');
        const tags = snapshot.val();

        if (!tags) {
            return res.status(404).json({ error: 'Tags not found' });
        }

        return res.json(tags);
    } catch (error) {
        console.error('Error fetching tags:', error);
        return res.status(500).json({ error: 'Internal server error for tags' });
    }
});



module.exports = router;
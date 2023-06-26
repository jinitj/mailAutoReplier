const express = require('express');
const router  = express.Router(); 
const authorize = require('../containers/authorize')

router.get('/authorize', authorize.authorize); 
router.get('/callback', authorize.callBack); 

module.exports = router;
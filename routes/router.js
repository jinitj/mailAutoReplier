const express = require('express');
const router  = express.Router(); 
const login = require('../containers/login');
const oAuth = require('./oAuth');
const pages = require('../containers/pages')
router.get('/',login.redirectUser)
router.use('/oauth', oAuth);
router.get('/home',pages.homePage)
router.get('/vaccationmode',pages.vaccationMode)

module.exports = router;
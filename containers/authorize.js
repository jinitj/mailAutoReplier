const axios = require('axios')
require("dotenv").config()
const path = require('path');
const utils = require('../utils/utils');
// const { gmail } = require('googleapis/build/src/apis/gmail');
const gmail = require('../backendService/gmail')
const fs = require('fs').promises;
module.exports = {
    authorize : (req,res) => {
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?access_type=offline&prompt=consent&response_type=code&client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&scope=https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email`;
        res.redirect(authUrl);
    },

    callBack : async (req,res) => {
          const { code } = req.query;
          try {
            const response = await axios.post('https://oauth2.googleapis.com/token', {
              code,
              client_id: process.env.CLIENT_ID,
              client_secret: process.env.CLIENT_SECRET,
              redirect_uri: process.env.REDIRECT_URI,
              grant_type: 'authorization_code'
            });

            const { access_token, refresh_token ,expires_in} = response.data;

            const user = await axios.get('https://people.googleapis.com/v1/people/me?personFields=emailAddresses',{
                headers: { 
                    'Authorization': `Bearer ${access_token}`, 
                    'Accept': 'application/json'
                  }
            });

            if(user && user.data){
                const userEmail = user.data.emailAddresses ? user.data.emailAddresses[0].value : null;
                console.log(userEmail)
                if(userEmail){
                    const labelId = await gmail.createLabel(access_token);
                    const TOKEN_PATH = path.join(process.cwd(), 'token.json');
                    const payload = JSON.stringify({
                        'userEmail': userEmail,
                        'userAccessToken': access_token,
                        'userRefreshToken': refresh_token,
                        'tokenExpiry': expires_in,
                        'tokenCreationTime': Date.now()/1000,
                        'labelId': labelId
                    })
                    await fs.writeFile(TOKEN_PATH, payload);
                    res.redirect('http://localhost:3000/home')
                }else{
                    res.send('Invalid Gmail Account');
                }
            }
            
          } catch (error) {
            console.error('Error exchanging authorization code for tokens:', error.message);
            res.status(500).send('Error occurred during authorization.');
          }
    }
}
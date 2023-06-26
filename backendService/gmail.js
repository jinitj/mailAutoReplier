const axios = require('axios');
const path = require('path');
const fs = require('fs');
const {Buffer} = require('buffer')

const utils = require('../utils/utils');
const { use } = require('../routes/oAuth');
require("dotenv").config();


const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const BASE_URL = 'https://www.googleapis.com/gmail/v1';
const gmailThreadEndpoint = `${BASE_URL}/users/me/threads`;
const gmailSendMailEndpoint = `${BASE_URL}/users/me/messages/send`;
const autoReplySubject = 'We Will Get Back to you shortly'
const autoReplyBody = 'Hey currently on vaccation will get back to you shortly'


const getAccessToken = async () => {
  try {
    const tokenInfoRaw = await fs.readFileSync(TOKEN_PATH,{ encoding: 'utf8', flag: 'r' });
    const tokenInfo = JSON.parse(tokenInfoRaw);

    let {userEmail,userAccessToken,userRefreshToken,tokenExpiry,tokenCreationTime,labelId} = tokenInfo;
    if(utils.checkIfTokenExpired(tokenExpiry,tokenCreationTime)){
      //check is access token still valid if not generate new access token
      userAccessToken = await this.getNewAccessToken(userRefreshToken);
      const payload = JSON.stringify({
          'userEmail': userEmail,
          'userAccessToken': userAccessToken,
          'userRefreshToken': userRefreshToken,
          'tokenExpiry': expires_in,
          'tokenCreationTime': Date.now()/1000,
          'labelId':labelId
      })
      await fs.writeFileSync(TOKEN_PATH, payload);
    }
    return {userAccessToken,userEmail,labelId};
  } catch (error) {
    console.error('Error getting access token:', error.message);
    throw error;
  }
};

const getNewAccessToken = async (refreshToken) => {
  try {

    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });    
    return response;
  
  } catch (error) {
    console.error('Error getting access token:', error.message);
    throw error;
  }
};

const getEmails = async (accessToken,userEmail,labelId) => {
  try {

      let allMessages = [];
      const currentTime = Math.floor(Date.now()/1000);
      const threeMinutesAgo = Math.floor((Date.now()/1000)-180);
      const timeQuery = `after:${threeMinutesAgo} before:${currentTime}`
      let response = await axios.get(`${BASE_URL}/users/me/messages?q=is:unread ${timeQuery}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
      let nextPageToken = response.data.nextPageToken;
      let { messages } = response.data;
      allMessages = messages && messages.length>0 ? allMessages.concat(messages) : [];
      while(nextPageToken){
        response = await axios.get(`${BASE_URL}/users/me/messages?q=is:unread ${timeQuery}&pageToken=${nextPageToken}`,{
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }});
        messages = response.data.messages
        nextPageToken = response.data.nextPageToken;
        if(messages && messages.length>0){
          allMessages = allMessages.concat(messages);
        }
      }
      if(allMessages.length==0){
        console.log('No New Messages Arrived')
      }
      for (const message of allMessages) {
        const messageId = message.id
        const messageRes = await axios.get(`${BASE_URL}/users/me/messages/${messageId}?format=metadata&metadataHeaders=From`,{
          headers: {
            Authorization: `Bearer ${accessToken}`,
          }});

        const headers = messageRes.data.payload.headers;
        const fromHeader = headers.find((header) => header.name === 'From');
        const fromEmail = fromHeader.value;
        const threadId = messageRes.data.threadId
        const threadRes = await axios.get(`${gmailThreadEndpoint}/${threadId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }});

        const thread = threadRes.data;
        const threadHistory = thread.messages || [];
        const hasReplied = threadHistory.some((history) => {
          const labels = history.labelIds || [];
          return labels.includes('SENT') && labels.includes('INBOX');
        });
        if (!hasReplied) {
          
          const requestBody = mimeCompatibleMailBody(userEmail, fromEmail, autoReplySubject, autoReplyBody, threadId);
          await sendReply(accessToken, requestBody)
          await addLabelToEmail(accessToken,messageId,labelId)
        }
      }
    }catch (error) {
      console.error('Error getting emails:', error);
      throw error;
    }
  };

const mimeCompatibleMailBody = (userEmail, toMail , mailSubject, mailBody, threadId) => {
  const emailContent = `From: "Your Name" <${userEmail}>` +
          `\nTo: ${toMail}` +
          `\nSubject: ${mailSubject}` +
          `\n\n${mailBody}`;
   
  const encodedMessage = Buffer.from(emailContent).toString('base64');
  return JSON.stringify({
    "threadId": threadId,
    "raw": encodedMessage
  });
}

const sendReply = async (accessToken, replMail) => {
  try {
    
    const response = await axios.post(gmailSendMailEndpoint, replMail, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'message/rfc822',
      },
    });
    console.log('Reply Sent');
    return response.data;
  } catch (error) {
    console.error('Error sending reply:', error.message);
    throw error;
  }
};

// Add label to an email
const addLabelToEmail = async (accessToken,messageId, labelId) => {
  try {
    const labelIds = [labelId];
    const messageUpdateBody = {addLabelIds: labelIds};
    const response = await axios.post(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,messageUpdateBody,{
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error adding label to email:', error.message);
    throw error;
  }
};

const autoReplier = async () => {
  setTimeout(async () => {
    console.log('Checking for new mails to reply')
    const {userAccessToken,userEmail,labelId} = await getAccessToken()
    await getEmails(userAccessToken,userEmail,labelId);
    await autoReplier();
  }, 100000);
}

const createLabel = async (accessToken) => {
  try{
    const labelName = 'Vaccation';
    const labelRequestBody = {
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
      name: labelName
    };
    
    const labelsData = await axios.get(
      'https://www.googleapis.com/gmail/v1/users/me/labels',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    if(labelsData && labelsData.data && labelsData.data.labels){
      let  labelId = labelsData.data.labels.find(label =>  label.name === labelName)?.id
      if(!labelId){
        const labelResponse = await axios.post(
          'https://www.googleapis.com/gmail/v1/users/me/labels',
          labelRequestBody,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        labelId = labelResponse && labelResponse.data && labelResponse.data.id ? labelResponse.data.id : 'SENT'; 
      }
      //if labels not getting created adding sent as the default label
      return labelId;
    }
  }catch(e){
    console.log(e);
    return 'SENT'
  }
}

module.exports = {
  getAccessToken,
  getEmails,
  sendReply,
  addLabelToEmail,
  getNewAccessToken,
  autoReplier,
  createLabel
};

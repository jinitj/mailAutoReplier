const fs = require('fs').promises;
const path = require('path');
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}


async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}


async function listLabels(auth) {
  const gmail = google.gmail({version: 'v1', auth});
  const res = await gmail.users.labels.list({
    userId: 'me',
  });
  const labels = res.data.labels;
  if (!labels || labels.length === 0) {
    console.log('No labels found.');
    return;
  }
  console.log('Labels:');
  labels.forEach((label) => {
    console.log(`- ${label.name}`);
  });
}

const createMIMEMessage = (rawMessage) => {
    
}
const checkForNewMails = async (auth) => {
    const gmail = google.gmail({ version: 'v1', auth });
    try {
        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread', // Filter for unread messages
        });
        console.log(res);
        const messages = res.data.messages || [];
        if (messages.length === 0) {
            console.log('No new emails found.');
            return;
        }

        for (const message of messages) {
            const messageRes = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'metadata',
                metadataHeaders: ['From'],
            });

            const headers = messageRes.data.payload.headers;
            const fromHeader = headers.find((header) => header.name === 'From');
            const fromEmail = fromHeader.value;

            const threadRes = await gmail.users.threads.get({
                userId: 'me',
                id: messageRes.data.threadId,
            });

            const thread = threadRes.data;
            const threadHistory = thread.messages || [];
            const hasReplied = threadHistory.some((history) => {
                const labels = history.labelIds || [];
                return labels.includes('SENT') && labels.includes('INBOX');
            });

            if (!hasReplied) {
                // Sending replies  to usar

                console.log('got it');
                await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    threadId: thread.id,
                    message: {
                    raw: Buffer.from(
                        `From: "Your Name" <${process.env.EMAIL}>` +
                        `\nTo: ${fromEmail}` +
                        `\nSubject: ${autoReplySubject}` +
                        `\nContent-Type: text/plain; charset="UTF-8"` +
                        `\n\n${autoReplyBody}`
                    ).toString('base64'),
                    },
                },
                });

                // Applying label to the replied email
                await gmail.users.messages.modify({
                userId: 'me',
                id: message.id,
                requestBody: {
                    addLabelIds: ['INBOX', 'UNREAD', process.env.REPLY_LABEL],
                    removeLabelIds: [],
                },
                });

                console.log(`Auto-reply sent to: ${fromEmail}`);
            }
        }
    }catch(e){
        console.log(e);
    }
};

const turnOnAutoReply = async () =>{
    setTimeout(async () => {
        const authObj = await authorize();
        await checkForNewMails(authObj);
        await listLabels(authObj);
        console.log(authObj);
        turnOnAutoReply();
      }, 1000);
    
}

turnOnAutoReply();
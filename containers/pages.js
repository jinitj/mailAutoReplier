const autoMailer = require('../backendService/autoMail')

module.exports = {
    homePage : (req,res) => {
        res.send('<h1>Hello Authentication Successfull!</h1>,<a href="/vaccationmode">Go On Vaccation Mode!</a>');
    },

    vaccationMode: async (req,res) => {
        await autoMailer.autoReplier();
        console.log('Vaccation Mode Started')
    }
}
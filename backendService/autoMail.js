
const gmail = require('./gmail');
require("dotenv").config();

module.exports = {
  autoReplier : async() => {
    try {
      await gmail.autoReplier();
    } catch (error) {
      console.log(error)
    }
  }
}

const express = require('express');
const routes = require('./routes/router')

require("dotenv").config();

const app = express();
const PORT = 3000;
app.use('/', routes);
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

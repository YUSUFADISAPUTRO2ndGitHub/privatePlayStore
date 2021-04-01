process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const request = require('request');
const app = express();
const port = 3000;
app.use(cors(), express.json())

app.get('/', (req, res) => {
    res.send("welcome to Vantsing");
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
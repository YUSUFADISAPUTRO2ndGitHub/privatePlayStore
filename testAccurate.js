process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const request = require('request');
const app = express();
const port = 8888;
app.use(cors(), express.json())

app.get('/test', (req, res) => {
    var options = {
        'method': 'GET',
        'url': 'https://public.accurate.id/accurate/api/purchase-order/list.do',
        'headers': {
            'Authorization': 'Bearer cab498a5-3b40-4eaf-97db-e4831859334e',
            'X-Session-ID': '96bd6276-0238-4604-930a-5ac58b4c00e3'
        }
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        res.send(response.body);
    });
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
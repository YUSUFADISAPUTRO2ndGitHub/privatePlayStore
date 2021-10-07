process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var fs = require('fs');
var busboy = require('connect-busboy');
const express = require('express');
const cors = require('cors');
const xlsx = require('node-xlsx');
const app = express();
const port = 3001;
app.use(cors(), express.json(), busboy())


// add/edit mySQL from excel doc
app.post('/get-all-phone-numbers',  async (req, res) => {
    res.send(
        await read_excel().then(async value => {
            return await value;
        })
    );
})

// read product from excel form
async function read_excel(){
    // console.log("read_excel");
    const workSheetsFromFile = await xlsx.parse(`${__dirname}/Book1.xlsx`);
    var excelDatas = await workSheetsFromFile[0].data;
    
    var i = 1;
    var product_datas = [];
    for(i ; i < excelDatas.length; i ++){
        await product_datas.push(
            {
                contact_number: excelDatas[i][10],
            }
        );
    }
    return new Promise(async resolve => {
        resolve(product_datas);
    });
}

app.listen(port, () => {
})
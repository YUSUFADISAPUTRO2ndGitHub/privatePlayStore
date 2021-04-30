process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const xlsx = require('node-xlsx');
var request = require('request');
var mysql = require('mysql');
const app = express();
const port = 3001;
app.use(cors(), express.json())

var con = mysql.createConnection({
    host: "172.31.207.222",
    port: 3306,
    database: "vtportal",
    user: "root",
    password: "Root@123"
});

con.connect(function(err) {
    if (err) console.log(err);
    console.log("Connected! to MySQL");
});

const get_latest_recorded_token = async () => {
    var sql = `select access_token, session_id from vtportal.accurateCredentials as acc order by acc.last_updated desc limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                console.log(err);
                resolve(await get_latest_recorded_token());
            };
            access_token = await result[0].access_token;
            session_id_for_accurate_db = await result[0].session_id;
            resolve({
                access_token: await result[0].access_token,
                session_id: await result[0].session_id
            });
        });
    })
}

app.get('/get-lastest-token-and-session',  async (req, res) => {
    res.send(
        await get_latest_recorded_token().then(async value => {
            return await value;
        })
    );
})

app.get('/add-or-save-product-details',  async (req, res) => {
    await read_excel().then(async value => {
        await send_to_mysql(value);
        return await value;
    })
    res.send(true);
})

// save product to MySQL
async function send_to_mysql(product_datas){
    await check_existing_product_code(product_datas);
}

async function check_existing_product_code(product_code){
    var sql = `select * from vtportal.product_management where Product_Code = '${product_code}' limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined){
                if(result[0].Product_Code != undefined){
                    if(result[0].Product_Code == product_code){
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }else{
                resolve(false);
            }
        });
    });
}

async function update_existing_product_code(){
    
}

async function insert_existing_product_code(){
    
}

// read product from excel form
async function read_excel(){
    const workSheetsFromFile = await xlsx.parse(`${__dirname}/Product Details.xlsx`);
    var excelDatas = await workSheetsFromFile[0].data;
    console.log(excelDatas);
    var i = 1;
    var product_datas = [];
    for(i ; i < excelDatas.length; i ++){
        await product_datas.push(
            {
                Product_Code: excelDatas[i][0],
                Name: excelDatas[i][1],
                Specification: excelDatas[i][2],
                Description: excelDatas[i][3],
                Stock_Quantity: excelDatas[i][4],
                Sell_Price: excelDatas[i][5],
                Unit: excelDatas[i][6],
                Category: excelDatas[i][7],
                Subcategory: excelDatas[i][8],
                Color: excelDatas[i][9],
                Brand: excelDatas[i][10]
            }
        );
    }
    return new Promise(async resolve => {
        resolve(product_datas);
    });
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
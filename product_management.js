process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var fs = require('fs');
var busboy = require('connect-busboy');
const express = require('express');
const cors = require('cors');
const xlsx = require('node-xlsx');
var request = require('request');
var mysql = require('mysql');
const app = express();
const port = 3001;
app.use(cors(), express.json(), busboy())

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

//delete product based on product
app.get('/delete-product',  async (req, res) => {
    var product_code = req.query.product_code;
    if(product_code != undefined || product_code != null){
        res.send(await delete_product_based_on_product_code(product_code).then(async value => {
            return await value;
        }));
    }else{
        res.send(false);
    }
})

async function delete_product_based_on_product_code(product_code){
    console.log(product_code);
    var sql = `delete from vtportal.product_management where Product_Code = '${product_code}' limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

// get product information from MySQL
app.get('/get-product-details',  async (req, res) => {
    var product_code = req.query.product_code;
    var product_name = req.query.product_name;
    var category = req.query.category;
    var subcategory = req.query.subcategory;
    if(product_code != undefined || product_code != null){
        res.send(await get_product_details_based_on_product_code(product_code).then(async value => {
            return await value;
        }));
    }else if(product_name != undefined || product_name != null){
        res.send(await get_product_details_based_on_product_name(product_name).then(async value => {
            return await value;
        }));
    }else if(category != undefined || category != null){
        res.send(await get_product_details_based_on_category(category).then(async value => {
            return await value;
        }));
    }else if(subcategory != undefined || subcategory != null){
        res.send(await get_product_details_based_on_subcategory(subcategory).then(async value => {
            return await value;
        }));
    }else{
        res.send(await get_all_products().then(async value => {
            return await value;
        }));
    }
})

async function get_product_details_based_on_product_code(product_code){
    console.log(product_code);
    var sql = `select * from vtportal.product_management where Product_Code = '${product_code}' limit 1;`;
    console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                if(result[0].Product_Code != undefined){
                    if(result[0].Product_Code == product_code){
                        console.log(product_code);
                        resolve(result[0]);
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

async function get_product_details_based_on_product_name(product_name){
    var sql = `select * from vtportal.product_management where upper(Name) like '%${product_name.toUpperCase()}%';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
}

async function get_product_details_based_on_category(category){
    var sql = `select * from vtportal.product_management where upper(Category) like '%${category.toUpperCase()}%';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
}

async function get_product_details_based_on_subcategory(subcategory){
    var sql = `select * from vtportal.product_management where upper(Subcategory) like '%${subcategory.toUpperCase()}%';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
}

async function get_all_products(){
    var sql = `select * from vtportal.product_management;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
}

// upload Product Details.xlsx doc
app.post('/upload-new-product-management-excel', async function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', async function (fieldname, file, filename) {
        console.log("Uploading: " + filename); 
        if(filename.length > 0 && filename == 'Product Details.xlsx'){
            fstream = await fs.createWriteStream(__dirname + '/' + filename);
            await file.pipe(fstream);
            await fstream.on('close', async function () {
                // res.redirect('back');
                if(await add_or_edit_product_details().then(async value => {
                    return await value;
                })){
                    res.send(true);
                }
            }); 
        }else{
            res.send(false);
        }
    }); 
}); 

function add_or_edit_product_details(){
    var options = {
        'method': 'GET',
        'url': 'http://localhost:3001/add-or-edit-product-details',
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                await add_or_edit_product_details().then(async value => {
                    resolve(true);
                })
            }else{
                resolve(true);
            }
        });
    });
}

// add/edit mySQL from excel doc
app.get('/add-or-edit-product-details',  async (req, res) => {
    res.send(
        await read_excel().then(async value => {
            await send_to_mysql(value).then(async value => {
                return await value;
            });
            return await value;
        })
    );
})

// save product to MySQL
async function send_to_mysql(product_datas){
    var i = 0;
    return new Promise(async resolve => {
        for(i; i < product_datas.length; i ++){
            console.log(
                await check_existing_product_code(product_datas[i].Product_Code).then(async value => {
                    return await value;
                })
            );
            console.log(
                product_datas[i].Product_Code
            );
            if(await check_existing_product_code(product_datas[i].Product_Code).then(async value => {
                return await value;
            })){
                console.log("update_existing_product_code");
                resolve(
                        await update_existing_product_code(product_datas[i]).then(async value => {
                            return await value;
                        })
                    );
            }else{
                console.log("insert_existing_product_code");
                resolve(
                        await insert_existing_product_code(product_datas[i]).then(async value => {
                            return await value;
                        })
                    );
            }
        }
    });
}

async function check_existing_product_code(product_code){
    var sql = `select * from vtportal.product_management where Product_Code = '${product_code}' limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
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

async function update_existing_product_code(product_details){
    var sql = `update vtportal.product_management 
        set Name = '${product_details.Name}',
        Specification = '${product_details.Specification}',
        Description = '${product_details.Description}',
        Stock_Quantity = '${product_details.Stock_Quantity}',
        Sell_Price = '${product_details.Sell_Price}',
        Unit = '${product_details.Unit}',
        Category = '${product_details.Category}',
        Subcategory = '${product_details.Subcategory}',
        Color = '${product_details.Color}',
        Brand = '${product_details.Brand}',
        Picture_1 = '${product_details.Picture_1}',
        Picture_2 = '${product_details.Picture_2}',
        Picture_3 = '${product_details.Picture_3}',
        GroupBuy_Purchase = '${product_details.GroupBuy_Purchase}',
        GroupBuy_SellPrice = '${product_details.GroupBuy_SellPrice}',
        In_Store_Price = '${product_details.In_Store_Price}'
        where Product_Code = '${product_details.Product_Code}'
        ;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

async function insert_existing_product_code(product_details){
    var sql = `INSERT INTO vtportal.product_management 
        (
            Product_Code,
            Name,
            Specification,
            Description,
            Stock_Quantity,
            Sell_Price,
            Unit,
            Category,
            Subcategory,
            Color,
            Brand,
            Picture_1,
            Picture_2,
            Picture_3,
            GroupBuy_Purchase,
            GroupBuy_SellPrice,
            In_Store_Price
        ) 
        VALUES 
        (
            '${product_details.Product_Code}',
            '${product_details.Name}',
            '${product_details.Specification}',
            '${product_details.Description}',
            '${product_details.Stock_Quantity}',
            '${product_details.Sell_Price}',
            '${product_details.Unit}',
            '${product_details.Category}',
            '${product_details.Subcategory}',
            '${product_details.Color}',
            '${product_details.Brand}',
            '${product_details.Picture_1}',
            '${product_details.Picture_2}',
            '${product_details.Picture_3}',
            '${product_details.GroupBuy_Purchase}',
            '${product_details.GroupBuy_SellPrice}',
            '${product_details.In_Store_Price}'
        );`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

// read product from excel form
async function read_excel(){
    const workSheetsFromFile = await xlsx.parse(`${__dirname}/Product Details.xlsx`);
    var excelDatas = await workSheetsFromFile[0].data;
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
                Brand: excelDatas[i][10],
                Picture_1: excelDatas[i][11],
                Picture_2: excelDatas[i][12],
                Picture_3: excelDatas[i][13],
                GroupBuy_Purchase: excelDatas[i][14],
                GroupBuy_SellPrice: excelDatas[i][15],
                In_Store_Price: excelDatas[i][16]
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
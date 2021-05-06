process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var fs = require('fs');
var busboy = require('connect-busboy');
const express = require('express');
const cors = require('cors');
const xlsx = require('node-xlsx');
var request = require('request');
var mysql = require('mysql');
const e = require('express');
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
    if (err) {
        console.log(err);
        handle_disconnect();
    }else{
        console.log("Connected! to MySQL");
    }
});

con.on('error', function(err) {
    console.log('MySQL error | ', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        handle_disconnect();
    } else {
        throw err;
    }
});

function handle_disconnect() {
    con = mysql.createConnection({
        host: "172.31.207.222",
        port: 3306,
        database: "vtportal",
        user: "root",
        password: "Root@123"
    });

    con.connect(function(err) {
        if (err) {
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000);
        }
    });
    con.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

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

//set-product-as-pending
app.post('/set-product-as-pending',  async (req, res) => {
    var Product_Code = req.query.Product_Code;
    var Rejector_Id = req.query.Rejector_Id;
    if(Product_Code != undefined && Rejector_Id != undefined){
        res.send(
            (await update_Product_Code_to_Be_pending(Product_Code, Rejector_Id).then(async value => {
                return await value;
            }))  
        );
    }else{
        res.send({
            status: false,
            reason: "Product_Code is incomplete"
        });
    }
})

async function update_Product_Code_to_Be_pending(Product_Code, Rejector_Id){
    var sql = `
        UPDATE vtportal.product_management
        SET 
        Categorize_NEW = 'false',
        Last_Updated = CURRENT_TIMESTAMP(),
        Status = 'pending',
        Update_date = CURRENT_TIMESTAMP(),
        Rejector_Id = '${Rejector_Id}'
        WHERE Product_Code = '${Product_Code}'
        and Delete_Mark = '0';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

//set-product-as-approved
app.post('/set-product-as-approved',  async (req, res) => {
    var Product_Code = req.query.Product_Code;
    var Auditor_Id = req.query.Auditor_Id;
    if(Product_Code != undefined && Auditor_Id != undefined){
        res.send(
            (await update_Product_Code_to_Be_Approved(Product_Code, Auditor_Id).then(async value => {
                return await value;
            }))  
        );
    }else{
        res.send({
            status: false,
            reason: "Product_Code is incomplete"
        });
    }
})

async function update_Product_Code_to_Be_Approved(Product_Code, Auditor_Id){
    var sql = `
        UPDATE vtportal.product_management
        SET 
        Categorize_NEW = 'false',
        Last_Updated = CURRENT_TIMESTAMP(),
        Status = 'approving',
        Update_date = CURRENT_TIMESTAMP(),
        Auditor_Id = '${Auditor_Id}',
        Rejector_Id = null
        WHERE Product_Code = '${Product_Code}'
        and Delete_Mark = '0';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

//set-product-as-not-new
app.post('/set-product-as-not-new',  async (req, res) => {
    var Product_Code = req.query.Product_Code;
    var Creator = req.query.Creator;
    if(Product_Code != undefined && Creator != undefined){
        res.send(
            (await update_Product_Code_to_Be_Not_New(Product_Code, Creator).then(async value => {
                return await value;
            }))  
        );
    }else{
        res.send({
            status: false,
            reason: "Product_Code is incomplete"
        });
    }
})

async function update_Product_Code_to_Be_Not_New(Product_Code, Creator){
    var sql = `
        UPDATE vtportal.product_management
        SET 
        Categorize_NEW = 'false',
        Last_Updated = CURRENT_TIMESTAMP(),
        Status = 'pending',
        Update_date = CURRENT_TIMESTAMP(),
        Creator = '${Creator}'
        WHERE Product_Code = '${Product_Code}'
        and Delete_Mark = '0';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

//set-product-as-new
app.post('/set-product-as-new',  async (req, res) => {
    var Product_Code = req.query.Product_Code;
    var Creator = req.query.Creator;
    if(Product_Code != undefined && Creator != undefined){
        res.send(
            (await update_Product_Code_to_Be_New(Product_Code, Creator).then(async value => {
                return await value;
            }))  
        );
    }else{
        res.send({
            status: false,
            reason: "Product_Code is incomplete"
        });
    }
})

async function update_Product_Code_to_Be_New(Product_Code, Creator){
    var sql = `
        UPDATE vtportal.product_management
        SET 
        Categorize_NEW = 'true',
        Last_Updated = CURRENT_TIMESTAMP(),
        Status = 'pending',
        Update_date = CURRENT_TIMESTAMP(),
        Creator = '${Creator}'
        WHERE Product_Code = '${Product_Code}'
        and Delete_Mark = '0';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

//delete product based on product
app.post('/delete-product',  async (req, res) => {
    var Product_Code = req.query.Product_Code;
    var Deleter = req.query.Deleter;
    if(Product_Code != undefined || Deleter != undefined){
        res.send(await delete_product_based_on_product_code(Product_Code, Deleter).then(async value => {
            return await value;
        }));
    }else{
        res.send(false);
    }
})

async function delete_product_based_on_product_code(Product_Code, Deleter){
    console.log(Product_Code);
    var sql = `UPDATE vtportal.product_management 
    SET Delete_Mark = '1',
    Deleter = '${Deleter}',
    Delete_Date = CURRENT_TIMESTAMP()
    WHERE Product_Code = '${Product_Code}';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

// get product information from MySQL
app.get('/get-product-details',  async (req, res) => {
    var product_code = req.query.product_code;
    var product_name = req.query.product_name;
    var category = req.query.category;
    var subcategory = req.query.subcategory;
    var GroupBuy_Purchase = req.query.GroupBuy_Purchase;
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
    }else if(GroupBuy_Purchase != undefined || GroupBuy_Purchase != null){
        if(GroupBuy_Purchase == 'true'){
            res.send(await get_product_details_based_on_groupbuy_purchase().then(async value => {
                return await value;
            }));
        }else{
            res.send(await get_product_details_not_groupbuy_purchase().then(async value => {
                return await value;
            }));
        }
    }else{
        res.send(await get_all_products().then(async value => {
            return await value;
        }));
    }
})

async function get_product_details_not_groupbuy_purchase(){
    var sql = `
        select * from vtportal.product_management where GroupBuy_Purchase = 'false' and GroupBuy_Purchase = 'undefined';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined){
                if(result[0] != undefined){
                    resolve(result);
                }else{
                    resolve(false);
                }
            }else{
                resolve(false);
            }
        });
    });
}

async function get_product_details_based_on_groupbuy_purchase(){
    var sql = `
        select * from vtportal.product_management where GroupBuy_Purchase != 'false' and GroupBuy_Purchase != 'undefined';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined){
                if(result[0] != undefined){
                    resolve(result);
                }else{
                    resolve(false);
                }
            }else{
                resolve(false);
            }
        });
    });
}

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
            if(await check_existing_product_code(product_datas[i].Product_Code).then(async value => {
                return await value;
            })){
                console.log("update_existing_product_code");
                console.log(await update_existing_product_code(product_datas[i]).then(async value => {
                    return await value;
                }));
            }else{
                console.log("insert_product_code");
                console.log(await insert_existing_product_code(product_datas[i]).then(async value => {
                    return await value;
                }));
            }
        }
        resolve(true);
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
    if(product_details.Product_Code != undefined){
        if(product_details.Product_Code != 'NULL'){
            var sql = `update vtportal.product_management 
                set Name = '${product_details.Name}',
                Specification = '${product_details.Specification}',
                Description = '${product_details.Description}',
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
                In_Store_Price = '${product_details.In_Store_Price}',
                Last_Updated = CURRENT_TIMESTAMP(),
                Start_Date = CURRENT_TIMESTAMP(),
                Remark = 'newly updated',
                Status = 'pending',
                Creator = '${product_details.Creator}',
                Create_Date = CURRENT_TIMESTAMP(),
                Modifier = '${product_details.Modifier}',
                Update_date = CURRENT_TIMESTAMP(),
                Delete_Mark = '0',
                Weight_KG = '${product_details.Weight_KG}',
                Dimension_CM_CUBIC = '${product_details.Dimension_CM_CUBIC}',
                Tax = '${product_details.Tax}'
                where Product_Code = '${product_details.Product_Code}'
                ;`;
            return new Promise(async resolve => {
                await con.query(sql, async function (err, result) {
                    if (err) await console.log(err);
                    resolve(true);
                });
            });
        }
    }
}

async function insert_existing_product_code(product_details){
    if(product_details.Product_Code != undefined){
        if(product_details.Product_Code != 'NULL'){
            var sql = `INSERT INTO vtportal.product_management 
                (
                    Product_Code,
                    Name,
                    Specification,
                    Description,
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
                    In_Store_Price,
                    Last_Updated,
                    Start_Date,
                    Remark,
                    Status,
                    Creator,
                    Create_Date,
                    Modifier,
                    Update_date,
                    Delete_Mark,
                    Weight_KG,
                    Dimension_CM_CUBIC,
                    Tax
                ) 
                VALUES 
                (
                    '${product_details.Product_Code}',
                    '${product_details.Name}',
                    '${product_details.Specification}',
                    '${product_details.Description}',
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
                    '${product_details.In_Store_Price}',
                    CURRENT_TIMESTAMP(),
                    CURRENT_TIMESTAMP(),
                    'newly inserted',
                    'pending',
                    '${product_details.Creator}',
                    CURRENT_TIMESTAMP(),
                    '${product_details.Modifier}',
                    CURRENT_TIMESTAMP(),
                    '0',
                    '${product_details.Weight_KG}',
                    '${product_details.Dimension_CM_CUBIC}',
                    '${product_details.Tax}'
                );`;
            return new Promise(async resolve => {
                await con.query(sql, async function (err, result) {
                    if (err) await console.log(err);
                    resolve(true);
                });
            });
        }
    }
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
                In_Store_Price: excelDatas[i][16],
                //new 
                Creator: excelDatas[i][17],
                Modifier: excelDatas[i][18],
                Weight_KG: excelDatas[i][19],
                Dimension_CM_CUBIC: excelDatas[i][20],
                Tax: excelDatas[i][21]
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
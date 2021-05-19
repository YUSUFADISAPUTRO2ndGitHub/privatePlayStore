process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var busboy = require('connect-busboy');
const express = require('express');
const cors = require('cors');
var mysql = require('mysql');
const e = require('express');
const app = express();
const port = 5000;
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
            setTimeout(handle_disconnect, 2000);
        }
    });
    con.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handle_disconnect();
        } else {
            throw err;
        }
    });
}

// get product information from MySQL
app.post('/get-product-details',  async (req, res) => {
    var product_code = req.query.product_code;
    var product_name = req.query.product_name;
    var category = req.query.category;
    var subcategory = req.query.subcategory;
    var GroupBuy_Purchase = req.query.GroupBuy_Purchase;
    var Categorize_NEW = req.query.Categorize_NEW;
    var Get_ALL_Category = req.query.Get_ALL_Category;
    var Get_ALL_Sub_Category_Based_On_Category = req.query.Get_ALL_Sub_Category_Based_On_Category;
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
    }else if(Categorize_NEW != undefined || Categorize_NEW != null){
        if(Categorize_NEW == 'true'){
            res.send(await get_product_details_based_on_new_items().then(async value => {
                return await value;
            }));
        }else{
            res.send(await get_product_details_not_new_items().then(async value => {
                return await value;
            }));
        }
    }else if(Get_ALL_Category != undefined || Get_ALL_Category != null){
        if(Get_ALL_Category == 'true'){
            res.send(await get_all_product_category().then(async value => {
                return await value;
            }));
        }else{
            res.send(false);
        }
    }else if(Get_ALL_Sub_Category_Based_On_Category != undefined || Get_ALL_Sub_Category_Based_On_Category != null){
        res.send(await get_all_product_sub_category_based_on_category(Get_ALL_Sub_Category_Based_On_Category).then(async value => {
            return await value;
        }));
    }else{
        res.send(await get_all_products().then(async value => {
            return await value;
        }));
    }
})

async function get_all_product_sub_category_based_on_category(Get_ALL_Sub_Category_Based_On_Category){
    var sql = `
    select Subcategory from vtportal.product_management where Delete_Mark != '1' and Subcategory != 'undefined' and upper(Subcategory) != 'NULL'
    and Category = '${Get_ALL_Sub_Category_Based_On_Category}' group by Subcategory;
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

async function get_all_product_category(){
    var sql = `
    select Category from vtportal.product_management where Delete_Mark != '1' and Category != 'undefined' and upper(Category) != 'NULL' group by Category;
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

async function get_product_details_not_new_items(){
    var sql = `
        select * from vtportal.product_management where Categorize_NEW = 'false' and Categorize_NEW = 'undefined' and Categorize_NEW = 'NULL';
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

async function get_product_details_based_on_new_items(){
    var sql = `
        select * from vtportal.product_management where Categorize_NEW != 'false' and Categorize_NEW != 'undefined' and Categorize_NEW != 'NULL';
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

async function get_product_details_not_groupbuy_purchase(){
    var sql = `
        select * from vtportal.product_management where GroupBuy_Purchase = 'false' and GroupBuy_Purchase = 'undefined' and GroupBuy_Purchase = 'NULL';
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
        select * from vtportal.product_management where GroupBuy_Purchase != 'false' and GroupBuy_Purchase != 'undefined' and GroupBuy_Purchase != 'NULL';
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
            if (err) {
                await console.log(err);
                await get_product_details_based_on_product_name(product_name).then(async value => {
                    resolve(value);
                });
            }else{
                if(result != undefined && result[0] != undefined){
                    resolve(result);
                }else{
                    resolve(false);
                }
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
    var sql = `select * from vtportal.product_management where Delete_Mark != '1';`;
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


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
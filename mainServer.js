process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
var request = require('request');
var mysql = require('mysql');
const app = express();
const port = 3003;
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

app.get('/get-all-sales-order-and-save-copy-to-MySQL',  async (req, res) => {
    var  collected_sales_order_ids = [];
    var total_page = await collecting_all_sales_orders_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for(current_page; current_page <= total_page; current_page++){
        console.log("loading ids from Accurate to array : " + current_page);
        collected_sales_order_ids = collected_sales_order_ids.concat(
            await requesting_sales_order_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_sales_order_details = [];
    var current_id = 0;
    for(current_id; current_id < collected_sales_order_ids.length; current_id++){
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_sales_order_details.push(
            await requesting_sales_order_details_based_on_id_from_accurate(collected_sales_order_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }
    if(await save_sales_order_in_json_to_mysql(collected_sales_order_details).then(async value => {
        return await value;
    })){
        console.log("saved successfully in mysql");
    }

    res.send(
        collected_sales_order_details
    );
})

async function saving_all_sales_orders_to_MySQL(collected_sales_order_details){
    var i = 0;
    return new Promise(async resolve => {
        for(i ; i < collected_sales_order_details.length ; i++){
            var sql = `INSERT into vtportal.sales_orders_temporary_container 
            values 
            ('${collected_sales_order_details[i].status}'
            , '${collected_sales_order_details[i].salesOrderId}'
            , '${collected_sales_order_details[i].salesOrderNumber}'
            , '${collected_sales_order_details[i].customerNo}'
            , '${collected_sales_order_details[i].customerId}'
            , '${collected_sales_order_details[i].transDate}'
            , '${collected_sales_order_details[i].toAddress}'
            , '${collected_sales_order_details[i].subTotal}'
            , '${collected_sales_order_details[i].totalAmount}'
            , '${collected_sales_order_details[i].paymentTerm}'
            , '${JSON.stringify(collected_sales_order_details[i].detailItem)}')`;
            await con.query(sql, async function (err, result) {
                if (err) await console.log(err);
                console.log("======= added to sales_orders_temporary_container =======");
            });
        }
        resolve(true); 
    });
}

async function clear_table_sales_orders_temporary_container(){
    var sql = `delete from vtportal.sales_orders_temporary_container;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            console.log("======= sales_orders_temporary_container has been cleared 1 =======");
            resolve(true);
        });
    });
}

const save_sales_order_in_json_to_mysql = async (collected_sales_order_details) => {
    return new Promise(async resolve => {
        if(await clear_table_sales_orders_temporary_container().then(async value => {
            return await value;
        })){
            console.log("======= sales_orders_temporary_container has been cleared 2 =======");
            if(await saving_all_sales_orders_to_MySQL(collected_sales_order_details).then(async value => {
                return await value;
            })){
                console.log("======= sales_orders_temporary_container has been filled =======");
                resolve(true); 
            }
        }
    });
}

async function collecting_all_sales_orders_from_accurate(){
    var pageFlipper = 1;
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:3003/get-lastest-token-and-session'
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/sales-order/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function (error, response) {
                if (error) console.log(error);
                if(response != undefined || response != null){
                    var result = JSON.parse(await response.body);
                    if(result != undefined && result.sp != undefined){
                        pageCount = result.sp.pageCount;
                        if(pageCount != undefined){
                            resolve(pageCount);
                        }else{
                            console.log("Bad pagecount");
                        }
                    }else{
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING SALES ORDER LIST");
                    }
                }
            });
        });
    });
}

async function requesting_sales_order_ids_from_accurate(pageFlipper){
    options = {
        'method': 'GET',
        'url': 'http://localhost:3003/get-lastest-token-and-session',
        'headers': {
        }
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_sales_order_ids_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/sales-order/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function (error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_sales_order_ids_from_accurate(id));
                };
                if(response != undefined || response != null){
                    var result = JSON.parse(await response.body);
                    var i =0;
                    var responseArray = [];
                    for(i; i < result.d.length; i++){
                        responseArray.push(result.d[i].id);
                    }
                    resolve(responseArray);
                }
            }); 
        });
    });
}

async function requesting_sales_order_details_based_on_id_from_accurate(id){
    console.log("saving data to MEM -> " + id);
    options = {
        'method': 'GET',
        'url': 'http://localhost:3003/get-lastest-token-and-session',
        'headers': {
        }
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_sales_order_details_based_on_id_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/sales-order/detail.do?id=' + id,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function (error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_sales_order_details_based_on_id_from_accurate(id));
                }
                if(response != undefined || response != null){
                    result = JSON.parse(await response.body);
                    var u = 0;
                    var detailItem = [];
                    if(result.d != undefined ){
                        if(result.d.detailItem != undefined ){
                            for(u; u < result.d.detailItem.length; u ++){
                                detailItem.push({
                                    name: result.d.detailItem[u].item.shortName,
                                    no: result.d.detailItem[u].item.no,
                                    itemId: result.d.detailItem[u].itemId,
                                    pricePerItem: result.d.detailItem[u].totalPrice,
                                    quantity: result.d.detailItem[u].quantity
                                })
                            }
                            resolve({
                                status: result.d.percentShipped,
                                salesOrderId: result.d.id,
                                salesOrderNumber: result.d.number,
                                customerId: result.d.customerId,
                                customerNo: result.d.customer.customerNo,
                                transDate: result.d.transDateView,
                                toAddress: result.d.toAddress,
                                subTotal: result.d.subTotal,
                                totalAmount: result.d.totalAmount,
                                paymentTerm: result.d.paymentTerm.name,
                                detailItem: detailItem
                            });
                        }
                    }
                }
            });
        });
    });
}

app.get('/get-copy-of-sales-order',  async (req, res) => {
    var collected_item_details = await get_sales_orders_from_mysql().then(async value => {
        return await value;
    });

    res.send(
        collected_item_details
    );
})

const get_sales_orders_from_mysql = async () => {
    var sql = `select * from vtportal.sales_orders_temporary_container;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(result);
        });
    })
}

app.get('/get-sales-order-by-customer-id', async (req, res) => {
    var filteredSalesOrderBasedOnCustomerNo = [];
    var customerNo = req.query.customerNo;
    if(customerNo != undefined){
        filteredSalesOrderBasedOnCustomerNo =
            await get_sales_orders_based_customer_no(customerNo).then(async value => {
                return await value;
            });
    }
    res.send(
        filteredSalesOrderBasedOnCustomerNo
    );
})

async function get_sales_orders_based_customer_no (customerNo){
    var filteredSalesOrderBasedOnCustomerNo = [];
    var options = {
        'method': 'GET',
        'url': 'http://localhost:3003/get-copy-of-sales-order',
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) throw new Error(error);
            var result = JSON.parse(await response.body);
            var i = 0;
            for(i; i < result.length; i++){
                if(result[i].customerNo == customerNo){
                    console.log("found > " + result[i].salesOrderNumber);
                    await filteredSalesOrderBasedOnCustomerNo.push(await result[i]);
                }
            }
            resolve(filteredSalesOrderBasedOnCustomerNo);
        });
    });
}

app.get('/get-item-all',  async (req, res) => {
    var  collected_item_ids = [];
    var total_page = await getting_total_page().then(async value => {
        return await value;
    });
    var current_page = 1;
    for(current_page; current_page <= total_page; current_page++){
        console.log("loading ids from Accurate to array : " + current_page);
        collected_item_ids = collected_item_ids.concat(
            await requesting_item_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_item_details = [];
    var current_id = 0;
    for(current_id; current_id < collected_item_ids.length; current_id++){
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_item_details.push(
            await requesting_item_details_based_on_id_from_accurate(collected_item_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }
    if(await save_item_in_json_to_mysql(collected_item_details).then(async value => {
        return await value;
    })){
        console.log("saved successfully in mysql");
    }

    res.send(
        collected_item_details
    );
})

const save_item_in_json_to_mysql = async (collected_item_details) => {
    var i = 0;
    return new Promise(async resolve => {
        if(await clear_table_item_details_temporary_container().then(async value => {
            return await value;
        })){
            console.log("======= item_details_temporary_container has been cleared 2 =======");
            if(await saving_all_items_to_MySQL(collected_item_details).then(async value => {
                return await value;
            })){
                console.log("======= item_details_temporary_container has been filled =======");
                resolve(true); 
            }
        }
    });
}

async function clear_table_item_details_temporary_container(){
    var sql = `delete from vtportal.items_temporary_container;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            console.log("======= item_details_temporary_container has been cleared 1 =======");
            resolve(true);
        });
    });
}

async function saving_all_items_to_MySQL(collected_item_details){
    var i = 0;
    return new Promise(async resolve => {
        for(i ; i < collected_item_details.length ; i++){
            var sql = `INSERT into vtportal.items_temporary_container values 
            (
                '${collected_item_details[i].itemId}',
                '${collected_item_details[i].name}',
                '${collected_item_details[i].shortName}',
                '${collected_item_details[i].category}',
                '${collected_item_details[i].no}',
                '${collected_item_details[i].unitPrice}',
                '${collected_item_details[i].unitNameWarehouse}',
                '${collected_item_details[i].totalUnitQuantity}',
                '${collected_item_details[i].availableToSell}',
                '${collected_item_details[i].groupBuyStatus}',
                '${collected_item_details[i].groupBuyAvaiableQuantity}',
                '${collected_item_details[i].groupBuyDiscount}',
                '${collected_item_details[i].promotedNew}',
                '${collected_item_details[i].notes}',
                '${collected_item_details[i].productImageCover}'
            );`;
            await con.query(sql, async function (err, result) {
                if (err) await console.log(err);
                console.log("======= added to item_details_temporary_container =======");
            });
        }
        resolve(true);
    })
}

async function getting_total_page(){
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:3003/get-lastest-token-and-session'
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/item/list.do?sp.page=' + 1,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function (error, response) {
                if (error) console.log(error);
                if(response != undefined || response != null){
                    var result = JSON.parse(await response.body);
                    if(result != undefined && result.sp != undefined){
                        pageCount = result.sp.pageCount;
                        if(pageCount != undefined){
                            resolve(pageCount);
                        }else{
                            console.log("Bad pagecount");
                        }
                    }else{
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING SALES ORDER LIST");
                    }
                }
            });
        });
    });
}

async function requesting_item_ids_from_accurate(pageFlipper){
    options = {
        'method': 'GET',
        'url': 'http://localhost:3003/get-lastest-token-and-session',
        'headers': {
        }
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_sales_order_ids_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/item/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function (error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_sales_order_ids_from_accurate(id));
                };
                if(response != undefined || response != null){
                    var result = JSON.parse(await response.body);
                    var i =0;
                    var responseArray = [];
                    for(i; i < result.d.length; i++){
                        responseArray.push(result.d[i].id);
                    }
                    resolve(responseArray);
                }
            }); 
        });
    });
}

async function requesting_item_details_based_on_id_from_accurate(id){
    console.log("saving data to MEM -> " + id);
    options = {
        'method': 'GET',
        'url': 'http://localhost:3003/get-lastest-token-and-session',
        'headers': {
        }
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_item_details_based_on_id_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/item/detail.do?id=' + id,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function (error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_item_details_based_on_id_from_accurate(id));
                }
                if(response != undefined || response != null){
                    result = JSON.parse(await response.body);
                    var u = 0;
                    if(result.d != undefined ){
                        resolve(await get_image_of_an_item(result));
                    }
                }
            });
        });
    });
}

async function get_image_of_an_item(result){
    options = {
        'method': 'GET',
        'url': 'http://147.139.168.202:8080/products.jsp?productNo=' + result.d.no,
        'headers': {
        }
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) throw new Error(error);
            if(response != undefined || response != null){
                var imageSearchResult = JSON.parse(response.body);
                if(imageSearchResult.length != 0){
                   resolve({
                        itemId : result.d.id,
                        name: result.d.name,
                        shortName: result.d.shortName,
                        category: result.d.itemCategoryId,
                        no: result.d.no,
                        unitPrice: result.d.unitPrice,
                        defaultDiscount: result.d.defaultDiscount,
                        unitNameWarehouse: result.d.unit1Name,
                        totalUnitQuantity: result.d.totalUnit1Quantity,
                        availableToSell: result.d.availableToSell,
                        groupBuyStatus: result.d.charField1,
                        groupBuyAvaiableQuantity: result.d.numericField1,
                        groupBuyDiscount: result.d.numericField2,
                        promotedNew: result.d.charField2,
                        notes: result.d.notes,
                        productImageCover: imageSearchResult[0].default_pic
                    });
                }else{
                    resolve({
                        itemId : result.d.id,
                        name: result.d.name,
                        shortName: result.d.shortName,
                        category: result.d.itemCategoryId,
                        no: result.d.no,
                        unitPrice: result.d.unitPrice,
                        defaultDiscount: result.d.defaultDiscount,
                        unitNameWarehouse: result.d.unit1Name,
                        totalUnitQuantity: result.d.totalUnit1Quantity,
                        availableToSell: result.d.availableToSell,
                        groupBuyStatus: result.d.charField1,
                        groupBuyAvaiableQuantity: result.d.numericField1,
                        groupBuyDiscount: result.d.numericField2,
                        promotedNew: result.d.charField2,
                        notes: result.d.notes
                    });
                }
            }
        });
    });
}

app.get('/get-copy-of-items-with-details',  async (req, res) => {
    var collected_item_details = await get_item_details_from_mysql().then(async value => {
        return await value;
    });

    res.send(
        collected_item_details
    );
})

const get_item_details_from_mysql = async () => {
    var sql = `select * from vtportal.items_temporary_container;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(result);
        });
    })
}

app.get('/get-item-details',  async (req, res) => {
    var itemNo = req.query.itemNo;
    var collected_item_details = await get_item_details_based_on_product_no_from_mysql(itemNo).then(async value => {
        return await value;
    });

    res.send(
        collected_item_details
    );
})

const get_item_details_based_on_product_no_from_mysql = async (itemNo) => {
    var sql = `select * from vtportal.items_temporary_container where no = '${itemNo}';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(result);
        });
    })
}

app.get('/get-item-all-group-buy',  async (req, res) => {
    var collected_item_details = await get_item_details_available_for_group_buy_from_mysql().then(async value => {
        return await value;
    });

    res.send(
        collected_item_details
    );
})

const get_item_details_available_for_group_buy_from_mysql = async () => {
    var sql = `select * from vtportal.items_temporary_container where groupBuyStatus = 'yes';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(result);
        });
    })
}

app.get('/get-item-all-new',  async (req, res) => {
    var collected_item_details = await get_item_details_available_new_from_mysql().then(async value => {
        return await value;
    });

    res.send(
        collected_item_details
    );
})

const get_item_details_available_new_from_mysql = async () => {
    var sql = `select * from vtportal.items_temporary_container where promotedNew = 'yes';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(result);
        });
    })
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
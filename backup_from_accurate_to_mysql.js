process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
var request = require('request');
var mysql = require('mysql');
const e = require('express');
var request = require('request');
const app = express();
const port = 5002; // 5002
app.use(cors(), express.json())

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

var accesstoken = "";
var refreshtoken = "1aa11740-8ba6-4c68-a4b4-3969a7745e3b";
var sessionid = "";

const get_latest_recorded_token = async() => {
    return new Promise(async resolve => {
        var options = {
            'method': 'POST',
            'url': 'https://account.accurate.id/oauth/token?grant_type=refresh_token&refresh_token=' + refreshtoken,
            'headers': {
                'Authorization': 'Basic ZTI3MTQzYTktNmU4NC00MGE0LTlhYmUtNGQ1NzM2YzZlNDdkOmYxOGU2ZjRiMjE5NTUwNWFiZjZjMWZmOTZlOTJlZDY3'
            }
        };
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                await get_latest_recorded_token();
            } else {
                refreshtoken = await JSON.parse(response.body).refresh_token;
                accesstoken = await JSON.parse(response.body).access_token;
                console.log(refreshtoken);
                var options = {
                    'method': 'GET',
                    'url': 'https://account.accurate.id/api/open-db.do?id=300600',
                    'headers': {
                        'Authorization': 'Bearer ' + JSON.parse(response.body).access_token
                    }
                };
                await request(options, async function(error, response) {
                    if (error) {
                        console.log(error);
                        await get_latest_recorded_token();
                    } else {
                        // console.log(JSON.parse(response.body));
                        sessionid = await JSON.parse(response.body).session;
                        resolve({
                            access_token: accesstoken,
                            session_id: JSON.parse(response.body).session
                        });
                    }
                });
            }
        });
    });
}

app.get('/get-lastest-token-and-session', async(req, res) => {
    res.send(
        await get_latest_recorded_token().then(async value => {
            return await value;
        })
    );
})

/* 
    engine start
*/

var options = {
    'method': 'GET',
    'url': 'http://localhost:5002/get-all-sales-order-details',
    'headers': {}
};
request(options, function(error, response) {
    if (error) throw new Error(error);
    console.log(response.body);
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-all-customer-details',
        'headers': {}
    };
    request(options, function(error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        var options = {
            'method': 'GET',
            'url': 'http://localhost:5002/get-all-purchase-order-details',
            'headers': {}
        };
        request(options, function(error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            var options = {
                'method': 'GET',
                'url': 'http://localhost:5002/get-all-delivery-order-details',
                'headers': {}
            };
            request(options, function(error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
                var options = {
                    'method': 'GET',
                    'url': 'http://localhost:5002/get-all-employee-details',
                    'headers': {}
                };
                request(options, function(error, response) {
                    if (error) throw new Error(error);
                    console.log(response.body);
                    var options = {
                        'method': 'GET',
                        'url': 'http://localhost:5002/get-all-product-details',
                        'headers': {}
                    };
                    request(options, function(error, response) {
                        if (error) throw new Error(error);
                        console.log(response.body);
                    });
                });
            });
        });
    });
});

/*
    interval
*/

setInterval(() => {
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-all-sales-order-details',
        'headers': {}
    };
    request(options, function(error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        var options = {
            'method': 'GET',
            'url': 'http://localhost:5002/get-all-customer-details',
            'headers': {}
        };
        request(options, function(error, response) {
            if (error) throw new Error(error);
            console.log(response.body);
            var options = {
                'method': 'GET',
                'url': 'http://localhost:5002/get-all-purchase-order-details',
                'headers': {}
            };
            request(options, function(error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
                var options = {
                    'method': 'GET',
                    'url': 'http://localhost:5002/get-all-delivery-order-details',
                    'headers': {}
                };
                request(options, function(error, response) {
                    if (error) throw new Error(error);
                    console.log(response.body);
                    var options = {
                        'method': 'GET',
                        'url': 'http://localhost:5002/get-all-employee-details',
                        'headers': {}
                    };
                    request(options, function(error, response) {
                        if (error) throw new Error(error);
                        console.log(response.body);
                        var options = {
                            'method': 'GET',
                            'url': 'http://localhost:5002/get-all-product-details',
                            'headers': {}
                        };
                        request(options, function(error, response) {
                            if (error) throw new Error(error);
                            console.log(response.body);
                        });
                    });
                });
            });
        });
    });
}, 25000000);

/*
    backup sales order
*/

app.get('/get-all-sales-order-details', async(req, res) => {
    var collected_sales_order_ids = [];
    var total_page = await collecting_all_sales_orders_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for (current_page; current_page <= total_page; current_page++) { //total_page
        console.log("loading ids from Accurate to array : " + current_page);
        collected_sales_order_ids = collected_sales_order_ids.concat(
            await requesting_sales_order_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_sales_order_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_sales_order_ids.length; current_id++) {
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_sales_order_details.push(
            await requesting_sales_order_details_based_on_id_from_accurate(collected_sales_order_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }

    var sorted_collected_sales_order_with_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_sales_order_details.length; current_id++) {
        await sort_sales_order_with_details(sorted_collected_sales_order_with_details, collected_sales_order_details[current_id]).then(async value => {
            return await value;
        })
    }
    console.log("=========================================================================================");
    await delete_all_sales_order_in_json_to_mysql();
    console.log("=========================================================================================");
    var current_id = 0;
    for (current_id; current_id < sorted_collected_sales_order_with_details.length; current_id++) {
        if (await insert_sales_order_in_json_to_mysql(sorted_collected_sales_order_with_details[current_id]).then(async value => {
                return await value;
            })) {
            console.log("insert successfully in mysql");
        }
    }

    current_id = 0;
    for (current_id; current_id < sorted_collected_sales_order_with_details.length; current_id++) {
        if (await check_if_sales_order_has_existed_in_MYSQL(sorted_collected_sales_order_with_details[current_id].sales_order_number).then(async value => {
                return await value;
            })) {
            var x = 0;
            for (x; x < sorted_collected_sales_order_with_details[current_id].order_details.length; x++) {
                await update_sales_order_details(sorted_collected_sales_order_with_details[current_id], x);
            }
        } else {
            var x = 0;
            for (x; x < sorted_collected_sales_order_with_details[current_id].order_details.length; x++) {
                await insertSalesOrderDetails(sorted_collected_sales_order_with_details[current_id], x);
            }
        }
    }
    res.send(
        sorted_collected_sales_order_with_details
    );
})

async function check_if_sales_order_has_existed_in_MYSQL(so_number) {
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.sales_order_details_accurate where so_number = '${so_number}';`;
        // console.log(sql);
        await con.query(sql, async function(err, result) {
            if (err) {
                await console.log(err);
            } else {
                if (result[0].total_found > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

async function update_sales_order_details(sorted_collected_sales_order_with_details, x) {
    var sql = `UPDATE vtportal.sales_order_details_accurate SET 
    name = '${sorted_collected_sales_order_with_details.order_details[x].name}'
    , quantity_bought = '${sorted_collected_sales_order_with_details.order_details[x].quantity_bought}'
    , price_per_unit = '${sorted_collected_sales_order_with_details.order_details[x].price_per_unit}'
    , total_price = '${sorted_collected_sales_order_with_details.order_details[x].total_price_based_on_quantity}'
    WHERE so_number = '${sorted_collected_sales_order_with_details.sales_order_number}'
    and product_code = '${sorted_collected_sales_order_with_details.order_details[x].product_code}';`;
    // console.log(sql);
    await con.query(sql, async function(err, result) {
        if (err) {
            console.log(err);
            await update_order_details(sorted_collected_sales_order_with_details, i, x);
        }
    });
}

const delete_all_sales_order_in_json_to_mysql = async() => {
    return new Promise(async resolve => {
        var sql = `delete from vtportal.sales_order_list_accurate;`;
        await con.query(sql, async function(err, result) {
            if (err) console.log(err);
        });
        console.log("clear successful");
        resolve(true);
    });
}

const insert_sales_order_in_json_to_mysql = async(sorted_collected_sales_order_with_details) => {
    var i = 0;
    return new Promise(async resolve => {
        var thedate = new Date(sorted_collected_sales_order_with_details.order_date);
        var day = thedate.getDate().toString();
        var month = (thedate.getMonth() + 1).toString();
        var year = thedate.getUTCFullYear().toString();
        thedate.setDate(thedate.getDate() + sorted_collected_sales_order_with_details.period_date);
        var dayPeriod = thedate.getDate().toString();
        var monthPeriod = (thedate.getMonth() + 1).toString();
        var yearPeriod = thedate.getUTCFullYear().toString();
        var contactNumber;
        if (sorted_collected_sales_order_with_details.contact_number == null) {
            contactNumber = `${sorted_collected_sales_order_with_details.workPhone}`;
        } else {
            contactNumber = `${sorted_collected_sales_order_with_details.contact_number} / ${sorted_collected_sales_order_with_details.workPhone}`;
        }
        var sql = `insert into vtportal.sales_order_list_accurate values 
        ('${sorted_collected_sales_order_with_details.sales_order_number}'
        , '${year + "-" + month + "-" + day}'
        , '${yearPeriod + "-" + monthPeriod + "-" + dayPeriod}'
        , '${sorted_collected_sales_order_with_details.payment_method}'
        , '${sorted_collected_sales_order_with_details.customer_name}'
        , '${sorted_collected_sales_order_with_details.customer_code}'
        , '${sorted_collected_sales_order_with_details.salesman}'
        , '${sorted_collected_sales_order_with_details.delivery_address}'
        , ${sorted_collected_sales_order_with_details.total_quantities}
        , '${sorted_collected_sales_order_with_details.total_amount}'
        , '232314'
        , 'DEV'
        , '${contactNumber}'
        );`;
        await con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

async function insertSalesOrderDetails(sorted_collected_sales_order_with_details, x) {
    return new Promise(async resolve => {
        var thedate = new Date();
        var uniqueCode =
            (
                (Math.floor((Math.random() * 10) + 1) * 2) +
                (Math.floor((Math.random() * 20) + 11) * 3) +
                (Math.floor((Math.random() * 30) + 21) * 4) +
                (Math.floor((Math.random() * 40) + 31) * 5) +
                (Math.floor((Math.random() * 50) + 41) * 6) +
                (Math.floor((Math.random() * 60) + 51) * 7) +
                (Math.floor((Math.random() * 70) + 61) * 8) +
                (Math.floor((Math.random() * 80) + 71) * 9) +
                (Math.floor((Math.random() * 90) + 81) * 10) +
                (Math.floor((Math.random() * 100) + 91) * 11) +
                (Math.floor((Math.random() * 110) + 101) * 12) +
                (Math.floor((Math.random() * 210) + 201) * 13) +
                (Math.floor((Math.random() * 310) + 301) * 14) +
                (Math.floor((Math.random() * 410) + 401) * 15) +
                (Math.floor((Math.random() * 510) + 501) * 16) +
                (Math.floor((Math.random() * 610) + 601) * 17) +
                (Math.floor((Math.random() * 710) + 701) * 18) +
                (Math.floor((Math.random() * 810) + 801) * 19) +
                (Math.floor((Math.random() * 910) + 901) * 20) +
                (Math.floor((Math.random() * 1010) + 1001) * 21) +
                (Math.floor((Math.random() * 1110) + 1101) * 22) +
                (Math.floor((Math.random() * 1210) + 1201) * 23) +
                (Math.floor((Math.random() * 1310) + 1301) * 24)
            ) * (Math.floor((Math.random() * 10) + 1) * 2) * (Math.floor((Math.random() * 7) + 1) * 7) +  thedate.getMilliseconds();
        var sql = `insert into vtportal.sales_order_details_accurate values 
        ('${sorted_collected_sales_order_with_details.sales_order_number}'
        , '${sorted_collected_sales_order_with_details.order_details[x].name}'
        , '${sorted_collected_sales_order_with_details.order_details[x].product_code}'
        , '${sorted_collected_sales_order_with_details.order_details[x].quantity_bought}'
        , '${sorted_collected_sales_order_with_details.order_details[x].price_per_unit}'
        , '${sorted_collected_sales_order_with_details.order_details[x].total_price_based_on_quantity}'
        , '${uniqueCode}'
        );`;
        await con.query(sql, async function(err, result) {
            if (err) {
                console.log(err);
                resolve(false);
            }
            resolve(true);
        });
    });
}

async function collecting_all_sales_orders_from_accurate() {
    var pageFlipper = 1;
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session'
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
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
            await request(options, async function(error, response) {
                if (error) console.log(error);
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    if (result != undefined && result.sp != undefined) {
                        pageCount = result.sp.pageCount;
                        if (pageCount != undefined) {
                            resolve(pageCount);
                        } else {
                            console.log("Bad pagecount");
                        }
                    } else {
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING SALES ORDER LIST");
                    }
                }
            });
        });
    });
}

async function requesting_sales_order_ids_from_accurate(pageFlipper) {
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
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
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_sales_order_ids_from_accurate(id));
                };
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    var i = 0;
                    var responseArray = [];
                    for (i; i < result.d.length; i++) {
                        responseArray.push(result.d[i].id);
                    }
                    resolve(responseArray);
                }
            });
        });
    });
}

async function requesting_sales_order_details_based_on_id_from_accurate(id) {
    console.log("saving data to MEM -> " + id);
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
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
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_sales_order_details_based_on_id_from_accurate(id));
                }
                if (response != undefined || response != null) {
                    result = JSON.parse(await response.body);
                    var u = 0;
                    var detailItem = [];
                    var totalQuantities = 0;
                    if (result.d != undefined) {
                        if (result.d.detailItem != undefined) {
                            for (u; u < result.d.detailItem.length; u++) {
                                totalQuantities = totalQuantities + result.d.detailItem[u].quantityDefault;
                                detailItem.push({
                                    name: result.d.detailItem[u].item.name,
                                    product_code: result.d.detailItem[u].item.no,
                                    quantity_bought: result.d.detailItem[u].quantityDefault,
                                    price_per_unit: result.d.detailItem[u].availableUnitPrice,
                                    total_price_based_on_quantity: result.d.detailItem[u].totalPrice
                                });
                            }
                            if (result.d.customer.contactInfo.mobilePhone != null) {
                                resolve({
                                    sales_order_number: result.d.number,
                                    order_date: result.d.transDateView,
                                    period_date: result.d.paymentTerm.netDays,
                                    payment_method: result.d.paymentTerm.name,
                                    customer_name: result.d.customer.name,
                                    customer_code: result.d.customer.customerNo,
                                    contact_number: result.d.customer.contactInfo.mobilePhone,
                                    salesman: result.d.detailItem[0].salesmanName,
                                    delivery_address: result.d.toAddress,
                                    total_quantities: totalQuantities,
                                    total_amount: result.d.totalAmount,
                                    order_details: detailItem,
                                    approval_status: result.d.approvalStatus
                                });
                            } else {
                                resolve({
                                    sales_order_number: result.d.number,
                                    order_date: result.d.transDateView,
                                    period_date: result.d.paymentTerm.netDays,
                                    payment_method: result.d.paymentTerm.name,
                                    customer_name: result.d.customer.name,
                                    customer_code: result.d.customer.customerNo,
                                    contact_number: result.d.customer.contactInfo.workPhone,
                                    salesman: result.d.detailItem[0].salesmanName,
                                    delivery_address: result.d.toAddress,
                                    total_quantities: totalQuantities,
                                    total_amount: result.d.totalAmount,
                                    order_details: detailItem,
                                    approval_status: result.d.approvalStatus
                                });
                            }
                        }
                    }
                }
            });
        });
    });
}

async function sort_sales_order_with_details(sorted_collected_sales_order_with_details, sales_order_with_details) {
    // return new Promise(async resolve => {
    if (sales_order_with_details.approval_status != undefined) {
        if (sales_order_with_details.approval_status.toUpperCase() == "APPROVED") {
            console.log("sorted approved sales_order_with_details : " + sales_order_with_details.sales_order_number);
            // resolve(sorted_collected_sales_order_with_details.push(sales_order_with_details));
            sorted_collected_sales_order_with_details.push(sales_order_with_details);
            console.log("saved");
            // resolve(true);
        }
    }
    // });
}

/*
    Customer Backup
*/

app.get('/get-all-customer-details', async(req, res) => {
    var collected_customer_ids = [];
    var total_page = await collecting_all_customers_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for (current_page; current_page <= total_page; current_page++) { //total_page
        console.log("loading ids from Accurate to array : " + current_page);
        collected_customer_ids = collected_customer_ids.concat(
            await requesting_customer_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_customer_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_customer_ids.length; current_id++) {
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_customer_details.push(
            await requesting_customer_details_based_on_id_from_accurate(collected_customer_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }
    console.log("=========================================================================================");
    await delete_all_customer_has_existed_in_MYSQL(); // update requested by Rafa and Dayat
    var current_id = 0;
    for (current_id; current_id < collected_customer_details.length; current_id++) {
        if (await check_if_customer_has_existed_in_MYSQL(collected_customer_details[current_id].customer_no).then(async value => {
                return await value;
            })) {
            console.log("current_id = " + collected_customer_details[current_id].customer_no);
            if (await update_customer_in_json_to_mysql(collected_customer_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("udpate successfully in mysql");
            }
        } else {
            console.log("current_id = " + collected_customer_details[current_id].customer_no);
            if (await insert_customer_in_json_to_mysql(collected_customer_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("insert successfully in mysql");
            }
        }
    }
    res.send(
        collected_customer_details
    );
})

async function delete_all_customer_has_existed_in_MYSQL() {
    return new Promise(async resolve => {
        var sql = `delete from vtportal.customer_list_accurate;`;
        // console.log(sql);
        await con.query(sql, async function(err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

async function check_if_customer_has_existed_in_MYSQL(customer_no) {
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.customer_list_accurate where customer_no = '${customer_no}';`;
        // console.log(sql);
        await con.query(sql, async function(err, result) {
            if (err) {
                await console.log(err);
            } else {
                if (result[0].total_found > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

const update_customer_in_json_to_mysql = async(sorted_collected_customer_with_details) => {
    var i = 0;
    return new Promise(async resolve => {
        var thedate = sorted_collected_customer_with_details.create_date.split(" ");
        thedate = thedate[0].split("/");
        var day = thedate[0];
        var month = thedate[1];
        var year = thedate[2];
        var theSubmittedDate = year + "-" + month + "-" + day;
        console.log(sorted_collected_customer_with_details.create_date);
        console.log(theSubmittedDate);
        var sql = `UPDATE vtportal.customer_list_accurate SET 
        create_date = '${theSubmittedDate}'
        , name = '${sorted_collected_customer_with_details.name}'
        , contact_name = '${sorted_collected_customer_with_details.contact_name}'
        , work_phone = '${sorted_collected_customer_with_details.work_phone}'
        , salesman = '${sorted_collected_customer_with_details.salesman}'
        , bill_city = '${sorted_collected_customer_with_details.bill_city}'
        , bill_province = '${sorted_collected_customer_with_details.bill_province}'
        , bill_street = '${sorted_collected_customer_with_details.bill_street}'
        , bill_zipCode = '${sorted_collected_customer_with_details.bill_zipCode}'
        , bill_country = '${sorted_collected_customer_with_details.bill_country}'
        , bill_complete_address = '${sorted_collected_customer_with_details.bill_complete_address}'
        WHERE customer_no = '${sorted_collected_customer_with_details.customer_no}';`;
        con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

const insert_customer_in_json_to_mysql = async(sorted_collected_customer_with_details) => {
    var i = 0;
    return new Promise(async resolve => {
        var thedate = sorted_collected_customer_with_details.create_date.split(" ");
        thedate = thedate[0].split("/");
        var day = thedate[0];
        var month = thedate[1];
        var year = thedate[2];
        var theSubmittedDate = year + "-" + month + "-" + day;
        console.log(sorted_collected_customer_with_details.create_date);
        console.log(theSubmittedDate);
        var sql = `insert into vtportal.customer_list_accurate values 
        ('${theSubmittedDate}'
        , '${sorted_collected_customer_with_details.name}'
        , '${sorted_collected_customer_with_details.customer_no}'
        , '${sorted_collected_customer_with_details.contact_name}'
        , '${sorted_collected_customer_with_details.work_phone}'
        , '${sorted_collected_customer_with_details.salesman}'
        , '${sorted_collected_customer_with_details.bill_city}'
        , '${sorted_collected_customer_with_details.bill_province}'
        , '${sorted_collected_customer_with_details.bill_street}'
        , '${sorted_collected_customer_with_details.bill_zipCode}'
        , '${sorted_collected_customer_with_details.bill_country}'
        , '${sorted_collected_customer_with_details.bill_complete_address}'
        );`;
        con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

async function collecting_all_customers_from_accurate() {
    var pageFlipper = 1;
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session'
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/customer/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) console.log(error);
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    if (result != undefined && result.sp != undefined) {
                        pageCount = result.sp.pageCount;
                        if (pageCount != undefined) {
                            resolve(pageCount);
                        } else {
                            console.log("Bad pagecount");
                        }
                    } else {
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING CUSTOMER LIST");
                    }
                }
            });
        });
    });
}

async function requesting_customer_ids_from_accurate(pageFlipper) {
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_customer_ids_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/customer/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_customer_ids_from_accurate(id));
                };
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    var i = 0;
                    var responseArray = [];
                    for (i; i < result.d.length; i++) {
                        responseArray.push(result.d[i].id);
                    }
                    resolve(responseArray);
                }
            });
        });
    });
}

async function requesting_customer_details_based_on_id_from_accurate(id) {
    console.log("saving data to MEM -> " + id);
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_customer_details_based_on_id_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/customer/detail.do?id=' + id,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_customer_details_based_on_id_from_accurate(id));
                }
                if (response != undefined || response != null) {
                    result = JSON.parse(await response.body);
                    var u = 0;
                    if (result.d != undefined) {
                        if (!result.d.suspended) {
                            if (result.d.salesman != null) {
                                if (result.d.detailContact.length > 0) {
                                    resolve({
                                        create_date: result.d.createDate,
                                        name: result.d.wpName,
                                        customer_no: result.d.customerNo,
                                        contact_name: result.d.detailContact[0].name,
                                        work_phone: result.d.detailContact[0].workPhone,
                                        salesman: result.d.salesman.name,
                                        bill_city: result.d.billCity,
                                        bill_province: result.d.billProvince,
                                        bill_street: result.d.billStreet,
                                        bill_zipCode: result.d.billZipCode,
                                        bill_country: result.d.billCountry,
                                        bill_complete_address: result.d.billProvince + " " + result.d.billCity + " " + result.d.billZipCode + " " + result.d.billStreet,
                                    });
                                } else {
                                    resolve({
                                        create_date: result.d.createDate,
                                        name: result.d.wpName,
                                        customer_no: result.d.customerNo,
                                        contact_name: '',
                                        work_phone: '',
                                        salesman: result.d.salesman.name,
                                        bill_city: result.d.billCity,
                                        bill_province: result.d.billProvince,
                                        bill_street: result.d.billStreet,
                                        bill_zipCode: result.d.billZipCode,
                                        bill_country: result.d.billCountry,
                                        bill_complete_address: result.d.billProvince + " " + result.d.billCity + " " + result.d.billZipCode + " " + result.d.billStreet,
                                    });
                                }
                            } else {
                                if (result.d.detailContact.length > 0) {
                                    resolve({
                                        create_date: result.d.createDate,
                                        name: result.d.wpName,
                                        customer_no: result.d.customerNo,
                                        contact_name: result.d.detailContact[0].name,
                                        work_phone: result.d.detailContact[0].workPhone,
                                        salesman: result.d.salesman,
                                        bill_city: result.d.billCity,
                                        bill_province: result.d.billProvince,
                                        bill_street: result.d.billStreet,
                                        bill_zipCode: result.d.billZipCode,
                                        bill_country: result.d.billCountry,
                                        bill_complete_address: result.d.billProvince + " " + result.d.billCity + " " + result.d.billZipCode + " " + result.d.billStreet,
                                    });
                                } else {
                                    resolve({
                                        create_date: result.d.createDate,
                                        name: result.d.wpName,
                                        customer_no: result.d.customerNo,
                                        contact_name: '',
                                        work_phone: '',
                                        salesman: result.d.salesman,
                                        bill_city: result.d.billCity,
                                        bill_province: result.d.billProvince,
                                        bill_street: result.d.billStreet,
                                        bill_zipCode: result.d.billZipCode,
                                        bill_country: result.d.billCountry,
                                        bill_complete_address: result.d.billProvince + " " + result.d.billCity + " " + result.d.billZipCode + " " + result.d.billStreet,
                                    });
                                }
                            }
                        }
                    }
                }
            });
        });
    });
}

/*
    Purchase order backup
*/

app.get('/get-all-purchase-order-details', async(req, res) => {
    var collected_purchase_order_ids = [];
    var total_page = await collecting_all_purchase_order_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for (current_page; current_page <= total_page; current_page++) { //total_page
        console.log("loading ids from Accurate to array : " + current_page);
        collected_purchase_order_ids = collected_purchase_order_ids.concat(
            await requesting_purchase_order_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_purchase_order_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_purchase_order_ids.length; current_id++) {
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_purchase_order_details.push(
            await requesting_purchase_order_details_based_on_id_from_accurate(collected_purchase_order_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }

    var sorted_collected_purchase_order_with_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_purchase_order_details.length; current_id++) {
        await sort_purchase_order_with_details(sorted_collected_purchase_order_with_details, collected_purchase_order_details[current_id]).then(async value => {
            return await value;
        })
    }
    console.log("=========================================================================================");
    var current_id = 0;
    for (current_id; current_id < sorted_collected_purchase_order_with_details.length; current_id++) {
        if (await check_if_purchase_order_has_existed_in_MYSQL(sorted_collected_purchase_order_with_details[current_id].purchase_order_number).then(async value => {
                return await value;
            })) {
            console.log("current_id = " + current_id);
            if (await update_purchase_order_in_json_to_mysql(sorted_collected_purchase_order_with_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("udpate successfully in mysql");
            }
        } else {
            console.log("current_id = " + current_id);
            if (await insert_purchase_order_in_json_to_mysql(sorted_collected_purchase_order_with_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("insert successfully in mysql");
            }
        }
    }
    res.send(
        sorted_collected_purchase_order_with_details
    );
})

async function check_if_purchase_order_has_existed_in_MYSQL(po_number) {
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.purchase_order_list_accurate where po_number = '${po_number}';`;
        // console.log(sql);
        await con.query(sql, async function(err, result) {
            if (err) {
                await console.log(err);
            } else {
                if (result[0].total_found > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

const update_purchase_order_in_json_to_mysql = async(sorted_collected_purchase_order_with_details) => {
    var i = 0;
    return new Promise(async resolve => {
        var thedate = new Date(sorted_collected_purchase_order_with_details.order_date);
        var day = thedate.getDate().toString();
        var month = (thedate.getMonth() + 1).toString();
        var year = thedate.getUTCFullYear().toString();
        thedate.setDate(thedate.getDate() + sorted_collected_purchase_order_with_details.period_date);
        var dayPeriod = thedate.getDate().toString();
        var monthPeriod = (thedate.getMonth() + 1).toString();
        var yearPeriod = thedate.getUTCFullYear().toString();
        var sql = `UPDATE vtportal.purchase_order_list_accurate SET 
        order_date = '${year + "-" + month + "-" + day}'
        , period_date = '${yearPeriod + "-" + monthPeriod + "-" + dayPeriod}'
        , payment_method = '${sorted_collected_purchase_order_with_details.payment_method}'
        , supplier_name = '${sorted_collected_purchase_order_with_details.supplier_name}'
        , supplier_code = '${sorted_collected_purchase_order_with_details.supplier_code}'
        , supplier_number = '${sorted_collected_purchase_order_with_details.supplier_number}'
        , delivery_address = '${sorted_collected_purchase_order_with_details.delivery_address}'
        , total_quantities = ${sorted_collected_purchase_order_with_details.total_quantities}
        , total_amount = '${sorted_collected_purchase_order_with_details.total_amount}'
        , status = '232314'
        , deleted = 'DEV'
        WHERE po_number = '${sorted_collected_purchase_order_with_details.purchase_order_number}';`;
        await con.query(sql, async function(err, result) {
            if (err) await console.log(err);
        });
        var x = 0;
        for (x; x < sorted_collected_purchase_order_with_details.order_details.length; x++) {
            await update_purchase_order_details(sorted_collected_purchase_order_with_details, x);
        }
        resolve(true);
    });
}

async function update_purchase_order_details(sorted_collected_purchase_order_with_details, x) {
    var sql = `UPDATE vtportal.purchase_order_details_accurate SET 
    name = '${sorted_collected_purchase_order_with_details.order_details[x].name}'
    , quantity_bought = '${sorted_collected_purchase_order_with_details.order_details[x].quantity_bought}'
    , price_per_unit = '${sorted_collected_purchase_order_with_details.order_details[x].price_per_unit}'
    , total_price = '${sorted_collected_purchase_order_with_details.order_details[x].total_price_based_on_quantity}'
    WHERE po_number = '${sorted_collected_purchase_order_with_details.purchase_order_number}'
    and product_code = '${sorted_collected_purchase_order_with_details.order_details[x].product_code}';`;
    await con.query(sql, async function(err, result) {
        if (err) {
            console.log(err);
            await update_order_details(sorted_collected_purchase_order_with_details, i, x);
        }
    });
}

const insert_purchase_order_in_json_to_mysql = async(sorted_collected_purchase_order_with_details) => {
    var i = 0;
    return new Promise(async resolve => {
        var thedate = new Date(sorted_collected_purchase_order_with_details.order_date);
        var day = thedate.getDate().toString();
        var month = (thedate.getMonth() + 1).toString();
        var year = thedate.getUTCFullYear().toString();
        thedate.setDate(thedate.getDate() + sorted_collected_purchase_order_with_details.period_date);
        var dayPeriod = thedate.getDate().toString();
        var monthPeriod = (thedate.getMonth() + 1).toString();
        var yearPeriod = thedate.getUTCFullYear().toString();
        var sql = `insert into vtportal.purchase_order_list_accurate values 
        ('${sorted_collected_purchase_order_with_details.purchase_order_number}'
        , '${year + "-" + month + "-" + day}'
        , '${yearPeriod + "-" + monthPeriod + "-" + dayPeriod}'
        , '${sorted_collected_purchase_order_with_details.payment_method}'
        , '${sorted_collected_purchase_order_with_details.supplier_name}'
        , '${sorted_collected_purchase_order_with_details.supplier_code}'
        , '${sorted_collected_purchase_order_with_details.supplier_number}'
        , '${sorted_collected_purchase_order_with_details.delivery_address}'
        , ${sorted_collected_purchase_order_with_details.total_quantities}
        , '${sorted_collected_purchase_order_with_details.total_amount}'
        , '232314'
        , 'DEV'
        );`;
        con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        var x = 0;
        for (x; x < sorted_collected_purchase_order_with_details.order_details.length; x++) {
            insertPurchaseOrderDetails(sorted_collected_purchase_order_with_details, x);
        }
        resolve(true);
    });
}

async function insertPurchaseOrderDetails(sorted_collected_purchase_order_with_details, x) {
    setTimeout(() => {
        var thedate = new Date();
        var uniqueCode =
            (
                (Math.floor((Math.random() * 10) + 1) * 2) +
                (Math.floor((Math.random() * 20) + 11) * 3) +
                (Math.floor((Math.random() * 30) + 21) * 4) +
                (Math.floor((Math.random() * 40) + 31) * 5) +
                (Math.floor((Math.random() * 50) + 41) * 6) +
                (Math.floor((Math.random() * 60) + 51) * 7) +
                (Math.floor((Math.random() * 70) + 61) * 8) +
                (Math.floor((Math.random() * 80) + 71) * 9) +
                (Math.floor((Math.random() * 90) + 81) * 10) +
                (Math.floor((Math.random() * 100) + 91) * 11) +
                (Math.floor((Math.random() * 110) + 101) * 12) +
                (Math.floor((Math.random() * 210) + 201) * 13) +
                (Math.floor((Math.random() * 310) + 301) * 14) +
                (Math.floor((Math.random() * 410) + 401) * 15) +
                (Math.floor((Math.random() * 510) + 501) * 16) +
                (Math.floor((Math.random() * 610) + 601) * 17) +
                (Math.floor((Math.random() * 710) + 701) * 18) +
                (Math.floor((Math.random() * 810) + 801) * 19) +
                (Math.floor((Math.random() * 910) + 901) * 20) +
                (Math.floor((Math.random() * 1010) + 1001) * 21) +
                (Math.floor((Math.random() * 1110) + 1101) * 22) +
                (Math.floor((Math.random() * 1210) + 1201) * 23) +
                (Math.floor((Math.random() * 1310) + 1301) * 24)
            ) * (Math.floor((Math.random() * 10) + 1) * 2) * (Math.floor((Math.random() * 7) + 1) * 7) +  thedate.getMilliseconds();
        var sql = `insert into vtportal.purchase_order_details_accurate values 
        ('${sorted_collected_purchase_order_with_details.purchase_order_number}'
        , '${sorted_collected_purchase_order_with_details.order_details[x].name}'
        , '${sorted_collected_purchase_order_with_details.order_details[x].product_code}'
        , '${sorted_collected_purchase_order_with_details.order_details[x].quantity_bought}'
        , '${sorted_collected_purchase_order_with_details.order_details[x].price_per_unit}'
        , '${sorted_collected_purchase_order_with_details.order_details[x].total_price_based_on_quantity}'
        , '${uniqueCode}'
        );`;
        con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
    }, 100);
}

async function collecting_all_purchase_order_from_accurate() {
    var pageFlipper = 1;
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session'
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/purchase-order/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) console.log(error);
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    if (result != undefined && result.sp != undefined) {
                        pageCount = result.sp.pageCount;
                        if (pageCount != undefined) {
                            resolve(pageCount);
                        } else {
                            console.log("Bad pagecount");
                        }
                    } else {
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING PURCHASE ORDER LIST");
                    }
                }
            });
        });
    });
}

async function requesting_purchase_order_ids_from_accurate(pageFlipper) {
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_purchase_order_ids_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/purchase-order/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_purchase_order_ids_from_accurate(id));
                };
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    var i = 0;
                    var responseArray = [];
                    for (i; i < result.d.length; i++) {
                        responseArray.push(result.d[i].id);
                    }
                    resolve(responseArray);
                }
            });
        });
    });
}

async function requesting_purchase_order_details_based_on_id_from_accurate(id) {
    console.log("saving data to MEM -> " + id);
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_purchase_order_details_based_on_id_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/purchase-order/detail.do?id=' + id,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_purchase_order_details_based_on_id_from_accurate(id));
                }
                if (response != undefined || response != null) {
                    result = JSON.parse(await response.body);
                    var u = 0;
                    var detailItem = [];
                    var totalQuantities = 0;
                    if (result.d != undefined) {
                        if (result.d.detailItem != undefined) {
                            for (u; u < result.d.detailItem.length; u++) {
                                totalQuantities = totalQuantities + result.d.detailItem[u].quantityDefault;
                                detailItem.push({
                                    name: result.d.detailItem[u].item.name,
                                    product_code: result.d.detailItem[u].item.no,
                                    quantity_bought: result.d.detailItem[u].quantityDefault,
                                    price_per_unit: result.d.detailItem[u].availableUnitPrice,
                                    total_price_based_on_quantity: result.d.detailItem[u].totalPrice
                                });
                            }
                            resolve({
                                purchase_order_number: result.d.number,
                                order_date: result.d.transDateView,
                                period_date: result.d.paymentTerm.netDays,
                                payment_method: result.d.paymentTerm.name,
                                supplier_name: result.d.vendor.name,
                                supplier_code: result.d.vendor.vendorNo,
                                supplier_number: '',
                                delivery_address: result.d.toAddress,
                                total_quantities: totalQuantities,
                                total_amount: result.d.totalAmount,
                                order_details: detailItem,
                                approval_status: result.d.approvalStatus
                            });
                        }
                    }
                }
            });
        });
    });
}

async function sort_purchase_order_with_details(sorted_collected_purchase_order_with_details, purchase_order_with_details) {
    // return new Promise(async resolve => {
    if (purchase_order_with_details.approval_status != undefined) {
        if (purchase_order_with_details.approval_status.toUpperCase() == "APPROVED") {
            console.log("sorted approved purchase_order_with_details : " + purchase_order_with_details.purchase_order_number);
            // resolve(sorted_collected_purchase_order_with_details.push(purchase_order_with_details));
            sorted_collected_purchase_order_with_details.push(purchase_order_with_details);
            console.log("saved");
            // resolve(true);
        }
    }
    // });
}

/*
    Delivery order backup
*/

app.get('/get-all-delivery-order-details', async(req, res) => {
    var collected_delivery_order_ids = [];
    var total_page = await collecting_all_delivery_order_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for (current_page; current_page <= total_page; current_page++) { //total_page
        console.log("loading ids from Accurate to array : " + current_page);
        collected_delivery_order_ids = collected_delivery_order_ids.concat(
            await requesting_delivery_order_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_delivery_order_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_delivery_order_ids.length; current_id++) {
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_delivery_order_details.push(
            await requesting_delivery_order_details_based_on_id_from_accurate(collected_delivery_order_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }

    var sorted_collected_delivery_order_with_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_delivery_order_details.length; current_id++) {
        await sort_delivery_order_with_details(sorted_collected_delivery_order_with_details, collected_delivery_order_details[current_id]).then(async value => {
            return await value;
        })
    }
    console.log("=========================================================================================");
    // console.log(collected_delivery_order_details);
    var current_id = 0;
    for (current_id; current_id < sorted_collected_delivery_order_with_details.length; current_id++) {
        if (await check_if_delivery_order_has_existed_in_MYSQL(sorted_collected_delivery_order_with_details[current_id].delivery_number).then(async value => {
                return await value;
            })) {
            console.log("current_id = " + current_id);
            if (await update_delivery_order_in_json_to_mysql(sorted_collected_delivery_order_with_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("udpate successfully in mysql");
            }
        } else {
            console.log("current_id = " + current_id);
            if (await insert_delivery_order_in_json_to_mysql(sorted_collected_delivery_order_with_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("insert successfully in mysql");
            }
        }
    }
    res.send(
        sorted_collected_delivery_order_with_details
    );
})

async function check_if_delivery_order_has_existed_in_MYSQL(delivery_number) {
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.delivery_order_list_accurate where delivery_number = '${delivery_number}';`;
        // console.log(sql);
        await con.query(sql, async function(err, result) {
            if (err) {
                await console.log(err);
            } else {
                if (result[0].total_found > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

const update_delivery_order_in_json_to_mysql = async(sorted_collected_delivery_order_with_details) => {
    return new Promise(async resolve => {
        var day = "";
        var month = "";
        var year = "";
        var sql = "";
        if (sorted_collected_delivery_order_with_details.delivery_time != null) {
            var thedate = sorted_collected_delivery_order_with_details.delivery_time.split(" ");
            thedate = thedate[0].split("/");
            day = thedate[0];
            month = thedate[1];
            year = thedate[2];
            sql = `UPDATE vtportal.delivery_order_list_accurate SET 
            delivery_number = '${sorted_collected_delivery_order_with_details.delivery_number}'
            , customer_name = '${sorted_collected_delivery_order_with_details.customer_name}'
            , shipping_address = '${sorted_collected_delivery_order_with_details.shipping_address}'
            , responsible_user = '${sorted_collected_delivery_order_with_details.responsible_user}'
            , sales_order_number = '${sorted_collected_delivery_order_with_details.sales_order_number}'
            , total_quantity = '${sorted_collected_delivery_order_with_details.total_quantity}'
            , total_price = '${sorted_collected_delivery_order_with_details.total_price}'
            , status = '232314'
            , delivery_time = '${year + "-" + month + "-" + day}'
            WHERE delivery_number = '${sorted_collected_delivery_order_with_details.delivery_number}';`;
        } else {
            sql = `UPDATE vtportal.delivery_order_list_accurate SET 
            delivery_number = '${sorted_collected_delivery_order_with_details.delivery_number}'
            , customer_name = '${sorted_collected_delivery_order_with_details.customer_name}'
            , shipping_address = '${sorted_collected_delivery_order_with_details.shipping_address}'
            , responsible_user = '${sorted_collected_delivery_order_with_details.responsible_user}'
            , sales_order_number = '${sorted_collected_delivery_order_with_details.sales_order_number}'
            , total_quantity = '${sorted_collected_delivery_order_with_details.total_quantity}'
            , total_price = '${sorted_collected_delivery_order_with_details.total_price}'
            , status = '232314'
            , delivery_time = null
            WHERE delivery_number = '${sorted_collected_delivery_order_with_details.delivery_number}';`;
        }
        await con.query(sql, async function(err, result) {
            if (err) await console.log(err);
        });
        var x = 0;
        for (x; x < sorted_collected_delivery_order_with_details.order_details.length; x++) {
            await update_delivery_order_details(sorted_collected_delivery_order_with_details, x);
        }
        resolve(true);
    });
}

async function update_delivery_order_details(sorted_collected_delivery_order_with_details, x) {
    var sql = `UPDATE vtportal.delivery_order_details_accurate SET 
    product_name = '${sorted_collected_delivery_order_with_details.order_details[x].product_name}'
    , quantity = '${sorted_collected_delivery_order_with_details.order_details[x].quantity}'
    , total_price = '${sorted_collected_delivery_order_with_details.order_details[x].total_price}'
    WHERE delivery_number = '${sorted_collected_delivery_order_with_details.delivery_number}'
    and product_code = '${sorted_collected_delivery_order_with_details.order_details[x].product_code}';`;
    await con.query(sql, async function(err, result) {
        if (err) {
            console.log(err);
            await update_order_details(sorted_collected_delivery_order_with_details, i, x);
        }
    });
}

const insert_delivery_order_in_json_to_mysql = async(sorted_collected_delivery_order_with_details) => {
    return new Promise(async resolve => {
        var day = "";
        var month = "";
        var year = "";
        var sql = "";
        if (sorted_collected_delivery_order_with_details.delivery_time != null) {
            var thedate = sorted_collected_delivery_order_with_details.delivery_time.split(" ");
            thedate = thedate[0].split("/");
            day = thedate[0];
            month = thedate[1];
            year = thedate[2];
            sql = `insert into vtportal.delivery_order_list_accurate values 
            ('${sorted_collected_delivery_order_with_details.delivery_number}'
            , '${sorted_collected_delivery_order_with_details.customer_name}'
            , '${sorted_collected_delivery_order_with_details.shipping_address}'
            , '${sorted_collected_delivery_order_with_details.responsible_user}'
            , '${sorted_collected_delivery_order_with_details.sales_order_number}'
            , '232314'
            , '${sorted_collected_delivery_order_with_details.total_price}'
            , '${sorted_collected_delivery_order_with_details.total_quantity}'
            , '${year + "-" + month + "-" + day}'
            );`;
        } else {
            sql = `insert into vtportal.delivery_order_list_accurate values 
            ('${sorted_collected_delivery_order_with_details.delivery_number}'
            , '${sorted_collected_delivery_order_with_details.customer_name}'
            , '${sorted_collected_delivery_order_with_details.shipping_address}'
            , '${sorted_collected_delivery_order_with_details.responsible_user}'
            , '${sorted_collected_delivery_order_with_details.sales_order_number}'
            , '232314'
            , '${sorted_collected_delivery_order_with_details.total_price}'
            , '${sorted_collected_delivery_order_with_details.total_quantity}'
            , null
            );`;
        }
        con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        var x = 0;
        for (x; x < sorted_collected_delivery_order_with_details.order_details.length; x++) {
            insertDeliveryOrderDetails(sorted_collected_delivery_order_with_details, x);
        }
        resolve(true);
    });
}

async function insertDeliveryOrderDetails(sorted_collected_delivery_order_with_details, x) {
    setTimeout(() => {
        var thedate = new Date();
        var uniqueCode =
            (
                (Math.floor((Math.random() * 10) + 1) * 2) +
                (Math.floor((Math.random() * 20) + 11) * 3) +
                (Math.floor((Math.random() * 30) + 21) * 4) +
                (Math.floor((Math.random() * 40) + 31) * 5) +
                (Math.floor((Math.random() * 50) + 41) * 6) +
                (Math.floor((Math.random() * 60) + 51) * 7) +
                (Math.floor((Math.random() * 70) + 61) * 8) +
                (Math.floor((Math.random() * 80) + 71) * 9) +
                (Math.floor((Math.random() * 90) + 81) * 10) +
                (Math.floor((Math.random() * 100) + 91) * 11) +
                (Math.floor((Math.random() * 110) + 101) * 12) +
                (Math.floor((Math.random() * 210) + 201) * 13) +
                (Math.floor((Math.random() * 310) + 301) * 14) +
                (Math.floor((Math.random() * 410) + 401) * 15) +
                (Math.floor((Math.random() * 510) + 501) * 16) +
                (Math.floor((Math.random() * 610) + 601) * 17) +
                (Math.floor((Math.random() * 710) + 701) * 18) +
                (Math.floor((Math.random() * 810) + 801) * 19) +
                (Math.floor((Math.random() * 910) + 901) * 20) +
                (Math.floor((Math.random() * 1010) + 1001) * 21) +
                (Math.floor((Math.random() * 1110) + 1101) * 22) +
                (Math.floor((Math.random() * 1210) + 1201) * 23) +
                (Math.floor((Math.random() * 1310) + 1301) * 24)
            ) * (Math.floor((Math.random() * 10) + 1) * 2) * (Math.floor((Math.random() * 7) + 1) * 7) +  thedate.getMilliseconds();
        var sql = `insert into vtportal.delivery_order_details_accurate values 
        (
        '${uniqueCode}'
        , '${sorted_collected_delivery_order_with_details.delivery_number}'
        , '${sorted_collected_delivery_order_with_details.order_details[x].product_code}'
        , '${sorted_collected_delivery_order_with_details.order_details[x].product_name}'
        , '${sorted_collected_delivery_order_with_details.order_details[x].quantity}'
        , '${sorted_collected_delivery_order_with_details.order_details[x].total_price}'
        );`;
        con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
    }, 100);
}

async function collecting_all_delivery_order_from_accurate() {
    var pageFlipper = 1;
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session'
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/delivery-order/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) console.log(error);
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    if (result != undefined && result.sp != undefined) {
                        pageCount = result.sp.pageCount;
                        if (pageCount != undefined) {
                            resolve(pageCount);
                        } else {
                            console.log("Bad pagecount");
                        }
                    } else {
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING delivery ORDER LIST");
                    }
                }
            });
        });
    });
}

async function requesting_delivery_order_ids_from_accurate(pageFlipper) {
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_delivery_order_ids_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/delivery-order/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_delivery_order_ids_from_accurate(id));
                };
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    var i = 0;
                    var responseArray = [];
                    for (i; i < result.d.length; i++) {
                        responseArray.push(result.d[i].id);
                    }
                    resolve(responseArray);
                }
            });
        });
    });
}

async function requesting_delivery_order_details_based_on_id_from_accurate(id) {
    console.log("saving data to MEM -> " + id);
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_delivery_order_details_based_on_id_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/delivery-order/detail.do?id=' + id,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_delivery_order_details_based_on_id_from_accurate(id));
                }
                if (response != undefined || response != null) {
                    result = JSON.parse(await response.body);
                    var u = 0;
                    var detailItem = [];
                    var totalQuantities = 0;
                    var totalPrice = 0;
                    if (result.d != undefined) {
                        if (result.d.detailItem != undefined) {
                            for (u; u < result.d.detailItem.length; u++) {
                                totalQuantities = totalQuantities + result.d.detailItem[u].quantityDefault;
                                totalPrice = totalPrice + result.d.detailItem[u].totalPrice;
                                detailItem.push({
                                    delivery_number: result.d.number,
                                    product_name: result.d.detailItem[u].item.name,
                                    product_code: result.d.detailItem[u].item.no,
                                    quantity: result.d.detailItem[u].quantityDefault,
                                    total_price: result.d.detailItem[u].totalPrice
                                });
                            }
                            resolve({
                                delivery_number: result.d.number,
                                delivery_time: result.d.printedTime,
                                customer_name: result.d.customer.name,
                                responsible_user: result.d.printUserName,
                                sales_order_number: result.d.detailItem[0].salesOrder.number,
                                shipping_address: result.d.toAddress,
                                total_quantity: totalQuantities,
                                total_price: totalPrice,
                                order_details: detailItem,
                                status: result.d.approvalStatus
                            });
                        }
                    }
                }
            });
        });
    });
}

async function sort_delivery_order_with_details(sorted_collected_delivery_order_with_details, delivery_order_with_details) {
    // return new Promise(async resolve => {
    if (delivery_order_with_details.status != undefined) {
        if (delivery_order_with_details.status.toUpperCase() == "APPROVED") {
            console.log("sorted approved delivery_order_with_details : " + delivery_order_with_details.delivery_order_number);
            // resolve(sorted_collected_delivery_order_with_details.push(delivery_order_with_details));
            sorted_collected_delivery_order_with_details.push(delivery_order_with_details);
            console.log("saved");
            // resolve(true);
        }
    }
    // });
}

/*
    backup employee
*/

app.get('/get-all-employee-details', async(req, res) => {
    var collected_employee_ids = [];
    var total_page = await collecting_all_employees_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for (current_page; current_page <= total_page; current_page++) { //total_page
        console.log("loading ids from Accurate to array : " + current_page);
        collected_employee_ids = collected_employee_ids.concat(
            await requesting_employee_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_employee_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_employee_ids.length; current_id++) {
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_employee_details.push(
            await requesting_employee_details_based_on_id_from_accurate(collected_employee_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }
    console.log("=========================================================================================");
    var current_id = 0;
    for (current_id; current_id < collected_employee_details.length; current_id++) {
        if (await check_if_employee_has_existed_in_MYSQL(collected_employee_details[current_id].emp_number).then(async value => {
                return await value;
            })) {
            console.log("current_id = " + current_id);
            if (await update_employee_in_json_to_mysql(collected_employee_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("udpate successfully in mysql");
            }
        } else {
            console.log("current_id = " + current_id);
            if (await insert_employee_in_json_to_mysql(collected_employee_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("insert successfully in mysql");
            }
        }
    }
    res.send(
        collected_employee_details
    );
})

async function check_if_employee_has_existed_in_MYSQL(emp_number) {
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.employee_data_accurate where emp_number = '${emp_number}';`;
        // console.log(sql);
        await con.query(sql, async function(err, result) {
            if (err) {
                await console.log(err);
            } else {
                if (result[0].total_found > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

const update_employee_in_json_to_mysql = async(sorted_collected_employee_with_details) => {
    return new Promise(async resolve => {
        var sql = `UPDATE vtportal.employee_data_accurate SET 
        name = '${sorted_collected_employee_with_details.name}'
        , emp_number = '${sorted_collected_employee_with_details.emp_number}'
        , mobilePhone = '${sorted_collected_employee_with_details.mobilePhone}'
        , email = '${sorted_collected_employee_with_details.email}'
        , emp_position = '${sorted_collected_employee_with_details.emp_position}'
        WHERE emp_number = '${sorted_collected_employee_with_details.emp_number}';`;
        con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

const insert_employee_in_json_to_mysql = async(sorted_collected_employee_with_details) => {
    return new Promise(async resolve => {
        var sql = `insert into vtportal.employee_data_accurate values 
        ('${sorted_collected_employee_with_details.name}'
        , '${sorted_collected_employee_with_details.emp_number}'
        , '${sorted_collected_employee_with_details.mobilePhone}'
        , '${sorted_collected_employee_with_details.email}'
        , '${sorted_collected_employee_with_details.emp_position}'
        );`;
        con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

async function collecting_all_employees_from_accurate() {
    var pageFlipper = 1;
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session'
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/employee/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) console.log(error);
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    if (result != undefined && result.sp != undefined) {
                        pageCount = result.sp.pageCount;
                        if (pageCount != undefined) {
                            resolve(pageCount);
                        } else {
                            console.log("Bad pagecount");
                        }
                    } else {
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING employee LIST");
                    }
                }
            });
        });
    });
}

async function requesting_employee_ids_from_accurate(pageFlipper) {
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_employee_ids_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/employee/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_employee_ids_from_accurate(id));
                };
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    var i = 0;
                    var responseArray = [];
                    for (i; i < result.d.length; i++) {
                        responseArray.push(result.d[i].id);
                    }
                    resolve(responseArray);
                }
            });
        });
    });
}

async function requesting_employee_details_based_on_id_from_accurate(id) {
    console.log("saving data to MEM -> " + id);
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_employee_details_based_on_id_from_accurate(id));
            };
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/employee/detail.do?id=' + id,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_employee_details_based_on_id_from_accurate(id));
                }
                if (response != undefined || response != null) {
                    result = JSON.parse(await response.body);
                    var u = 0;
                    if (result.d != undefined) {
                        if (!result.d.suspended) {
                            if (result.d.salesman) {
                                resolve({
                                    name: result.d.name,
                                    emp_number: result.d.number,
                                    mobilePhone: result.d.mobilePhone,
                                    email: result.d.email,
                                    emp_position: result.d.position
                                });
                            } else {
                                resolve({
                                    name: result.d.name,
                                    emp_number: result.d.number,
                                    mobilePhone: result.d.mobilePhone,
                                    email: result.d.email,
                                    emp_position: result.d.position
                                });
                            }
                        }
                    }
                }
            });
        });
    });
}

/*
    backup products 
*/

app.get('/get-all-product-details', async(req, res) => {
    var collected_product_ids = [];
    var total_page = await collecting_all_products_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for (current_page; current_page <= total_page; current_page++) { //total_page
        console.log("loading ids from Accurate to array : " + current_page);
        collected_product_ids = collected_product_ids.concat(
            await requesting_product_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_product_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_product_ids.length; current_id++) {
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_product_details.push(
            await requesting_product_details_based_on_id_from_accurate(collected_product_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }
    console.log("=========================================================================================");
    var current_id = 0;
    for (current_id; current_id < collected_product_details.length; current_id++) {
        if (await check_if_product_has_existed_in_MYSQL(collected_product_details[current_id].Product_Code).then(async value => {
                return await value;
            })) {
            console.log("current_id = " + current_id);
            if (await update_product_in_json_to_mysql(collected_product_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("udpate successfully in mysql");
            }
        } else {
            console.log("current_id = " + current_id);
            if (await insert_product_in_json_to_mysql(collected_product_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("insert successfully in mysql");
            }
        }
    }
    res.send(
        collected_product_details
    );
})

async function check_if_product_has_existed_in_MYSQL(Product_Code) {
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.product_data_accurate where Product_Code = '${Product_Code}';`;
        // console.log(sql);
        await con.query(sql, async function(err, result) {
            if (err) {
                await console.log(err);
            } else {
                if (result[0].total_found > 0) {
                    resolve(true);
                } else {
                    resolve(false);
                }
            }
        });
    });
}

const update_product_in_json_to_mysql = async(sorted_collected_product_with_details) => {
    return new Promise(async resolve => {
        var sql = `UPDATE vtportal.product_data_accurate SET 
        Product_Code = '${sorted_collected_product_with_details.Product_Code}'
        , Name = '${sorted_collected_product_with_details.Name}'
        , Sell_Price = '${sorted_collected_product_with_details.Sell_Price}'
        , Quantity = '${sorted_collected_product_with_details.Quantity}'
        , Unit = '${sorted_collected_product_with_details.Unit}'
        WHERE Product_Code = '${sorted_collected_product_with_details.Product_Code}';`;
        con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

const insert_product_in_json_to_mysql = async(sorted_collected_product_with_details) => {
    return new Promise(async resolve => {
        var sql = `insert into vtportal.product_data_accurate (
            Product_Code,
            Name,
            Sell_Price,
            Quantity,
            Unit
        ) values 
        ('${sorted_collected_product_with_details.Product_Code}'
        , '${sorted_collected_product_with_details.Name}'
        , '${sorted_collected_product_with_details.Sell_Price}'
        , '${sorted_collected_product_with_details.Quantity}'
        , '${sorted_collected_product_with_details.Unit}'
        );`;
        con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

async function collecting_all_products_from_accurate() {
    var pageFlipper = 1;
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session'
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/item/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function(error, response) {
                if (error) console.log(error);
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    if (result != undefined && result.sp != undefined) {
                        pageCount = result.sp.pageCount;
                        if (pageCount != undefined) {
                            resolve(pageCount);
                        } else {
                            console.log("Bad pagecount");
                        }
                    } else {
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING product LIST");
                    }
                }
            });
        });
    });
}

async function requesting_product_ids_from_accurate(pageFlipper) {
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_product_ids_from_accurate(id));
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
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_product_ids_from_accurate(id));
                };
                if (response != undefined || response != null) {
                    var result = JSON.parse(await response.body);
                    var i = 0;
                    var responseArray = [];
                    for (i; i < result.d.length; i++) {
                        responseArray.push(result.d[i].id);
                    }
                    resolve(responseArray);
                }
            });
        });
    });
}

async function requesting_product_details_based_on_id_from_accurate(id) {
    console.log("saving data to MEM -> " + id);
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_product_details_based_on_id_from_accurate(id));
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
            await request(options, async function(error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_product_details_based_on_id_from_accurate(id));
                }
                if (response != undefined || response != null) {
                    result = JSON.parse(await response.body);
                    if (result.d != undefined) {
                        resolve({
                            Product_Code: result.d.no,
                            Name: result.d.name,
                            Sell_Price: result.d.unitPrice,
                            Quantity: result.d.totalUnit1Quantity,
                            Unit: result.d.unit1Name
                        });
                    }
                }
            });
        });
    });
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
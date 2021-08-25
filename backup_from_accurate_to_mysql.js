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
    } else {
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
var refreshtoken = "c62c4a45-fd7f-44ab-af03-8546724d75d1";
var sessionid = "";
var d = new Date();
var recorded_seconds = d.getSeconds();
var recorded_minutes = d.getMinutes();

const get_latest_recorded_token = async() => {
    return new Promise(async resolve => {
        console.log("=================================================================");
        console.log("getting refresh token");
        var options = {
            'method': 'POST',
            'url': 'https://account.accurate.id/oauth/token?grant_type=refresh_token&refresh_token=' + refreshtoken,
            'headers': {
                'Authorization': 'Basic ZTI3MTQzYTktNmU4NC00MGE0LTlhYmUtNGQ1NzM2YzZlNDdkOmYxOGU2ZjRiMjE5NTUwNWFiZjZjMWZmOTZlOTJlZDY3'
            }
        };
        await request(options, async function(error, response) {
            if (error) {
                console.log("=================================================================");
                console.log("Fail to get refresh token");
                console.log(error);
                resolve(await get_latest_recorded_token());
            } else {
                if (JSON.parse(response.body).access_token != undefined) {
                    if (await JSON.parse(response.body).access_token.length > 0) {
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
                                console.log("=================================================================");
                                console.log("Fail to get session id");
                                console.log(error);
                                resolve(await get_latest_recorded_token());
                            } else {
                                try {
                                    if (JSON.parse(response.body).session != undefined) {
                                        if (JSON.parse(response.body).session.length > 0) {
                                            sessionid = await JSON.parse(response.body).session;
                                            resolve({
                                                access_token: accesstoken,
                                                session_id: JSON.parse(response.body).session
                                            });
                                        } else {
                                            console.log(response.body);
                                            resolve(await get_latest_recorded_token());
                                        }
                                    } else {
                                        console.log(response.body);
                                        resolve(await get_latest_recorded_token());
                                    }
                                } catch (e) {
                                    console.log("=============================================");
                                    console.log("JSON PARSE FAILED");
                                    console.log(e);
                                    resolve(await get_latest_recorded_token());
                                }
                            }
                        });
                    } else {
                        console.log("access token may not exist =================================================================");
                        console.log(response.body);
                        resolve({
                            access_token: accesstoken,
                            session_id: sessionid
                        });
                    }
                } else {
                    console.log("access token does not exist =================================================================");
                    console.log(response.body);
                    resolve({
                        access_token: accesstoken,
                        session_id: sessionid
                    });
                }
            }
        });
    });
}

const get_latest_recorded_token_locally = async() => {
    return new Promise(async resolve => {
        console.log("=================================================================");
        console.log("getting locally saved token");
        console.log(
            {
                access_token: accesstoken,
                session_id: sessionid
            }
        );
        console.log("=================================================================");
        resolve({
            access_token: accesstoken,
            session_id: sessionid
        });
    });
}

app.get('/get-lastest-token-and-session', async(req, res) => {
    res.send(
        await get_latest_recorded_token_locally().then(async value => {
            return await value;
        })
    );
})

app.get('/get-lastest-token-and-session-from-accurate', async(req, res) => {
    res.send(
        await get_latest_recorded_token().then(async value => {
            return await value;
        })
    );
})

/* 
    engine start
*/
// var options = {
//     'method': 'GET',
//     'url': 'http://localhost:5002/get-lastest-token-and-session-from-accurate',
//     'headers': {}
// };
// request(options, function(error, response) {
//     var options = {
//         'method': 'GET',
//         'url': 'http://localhost:5002/get-all-product-details', //get-all-product-details
//         'headers': {}
//     };
//     request(options, function(error, response) {
//         var options = {
//             'method': 'GET',
//             'url': 'http://localhost:5002/get-all-sales-invoice-details',
//             'headers': {}
//         };
//         request(options, function(error, response) {
//             var options = {
//                 'method': 'GET',
//                 'url': 'http://localhost:5002/get-all-sales-receipt-details',
//                 'headers': {}
//             };
//             request(options, function(error, response) {
//                 var options = {
//                     'method': 'GET',
//                     'url': 'http://localhost:5002/get-all-sales-order-details',
//                     'headers': {}
//                 };
//                 request(options, function(error, response) {
//                     if (error) throw new Error(error);
//                     // console.log(response.body);
//                     console.log("get-all-sales-order-details === done");
//                     var options = {
//                         'method': 'GET',
//                         'url': 'http://localhost:5002/get-all-customer-details',
//                         'headers': {}
//                     };
//                     request(options, function(error, response) {
//                         if (error) throw new Error(error);
//                         // console.log(response.body);
//                         console.log("get-all-customer-details === done");
//                         var options = {
//                             'method': 'GET',
//                             'url': 'http://localhost:5002/get-all-employee-details',
//                             'headers': {}
//                         };
//                         request(options, function(error, response) {
//                             if (error) throw new Error(error);
//                             // console.log(response.body);
//                             console.log("get-all-employee-details === done");
//                             var options = {
//                                 'method': 'GET',
//                                 'url': 'http://localhost:5002/get-all-delivery-order-details',
//                                 'headers': {}
//                             };
//                             request(options, function(error, response) {
//                                 if (error) throw new Error(error);
//                                 // console.log(response.body);
//                                 console.log("get-all-delivery-order-details === done");
//                                 var options = {
//                                     'method': 'GET',
//                                     'url': 'http://localhost:5002/get-all-sales-return-details', //get-all-sales-return-details
//                                     'headers': {}
//                                 };
//                                 request(options, function(error, response) {
//                                     if (error) throw new Error(error);
//                                     // console.log(response.body);
//                                     console.log("get-all-sales-return-details === done");
//                                     var options = {
//                                         'method': 'GET',
//                                         'url': 'http://localhost:5002/get-all-purchase-order-details',
//                                         'headers': {}
//                                     };
//                                     request(options, function(error, response) {
//                                         if (error) throw new Error(error);
//                                         // console.log(response.body);
//                                         console.log("get-all-purchase-order-details === done");
//                                     });
//                                 });
//                             });
//                         });
//                     });
//                 });
//             });
//         });
//     });
// });

/*
    interval
*/

// setInterval(() => {
//     var options = {
//         'method': 'GET',
//         'url': 'http://localhost:5002/get-lastest-token-and-session-from-accurate',
//         'headers': {}
//     };
//     request(options, function(error, response) {
//         var options = {
//             'method': 'GET',
//             'url': 'http://localhost:5002/get-all-sales-return-details',
//             'headers': {}
//         };
//         request(options, function(error, response) {
//             var options = {
//                 'method': 'GET',
//                 'url': 'http://localhost:5002/get-all-sales-invoice-details',
//                 'headers': {}
//             };
//             request(options, function(error, response) {
//                 var options = {
//                     'method': 'GET',
//                     'url': 'http://localhost:5002/get-all-sales-receipt-details',
//                     'headers': {}
//                 };
//                 request(options, function(error, response) {
//                     var options = {
//                         'method': 'GET',
//                         'url': 'http://localhost:5002/get-all-sales-order-details',
//                         'headers': {}
//                     };
//                     request(options, function(error, response) {
//                         if (error) throw new Error(error);
//                         console.log(response.body);
//                         console.log("++=========================================================================++");
//                         console.log("Started to get customer informations");
//                         var options = {
//                             'method': 'GET',
//                             'url': 'http://localhost:5002/get-all-customer-details',
//                             'headers': {}
//                         };
//                         request(options, function(error, response) {
//                             if (error) throw new Error(error);
//                             console.log(response.body);
//                             console.log("++=========================================================================++");
//                             console.log("Started to get product informations");
//                             var options = {
//                                 'method': 'GET',
//                                 'url': 'http://localhost:5002/get-all-product-details',
//                                 'headers': {}
//                             };
//                             request(options, function(error, response) {
//                                 if (error) throw new Error(error);
//                                 // console.log(response.body);
//                                 console.log("get-all-product-details === done");
//                                 var options = {
//                                     'method': 'GET',
//                                     'url': 'http://localhost:5002/get-all-delivery-order-details',
//                                     'headers': {}
//                                 };
//                                 request(options, function(error, response) {
//                                     if (error) throw new Error(error);
//                                     // console.log(response.body);
//                                     console.log("get-all-delivery-order-details === done");
//                                     var options = {
//                                         'method': 'GET',
//                                         'url': 'http://localhost:5002/get-all-employee-details',
//                                         'headers': {}
//                                     };
//                                     request(options, function(error, response) {
//                                         if (error) throw new Error(error);
//                                         // console.log(response.body);
//                                         console.log("get-all-employee-details === done");
//                                         var options = {
//                                             'method': 'GET',
//                                             'url': 'http://localhost:5002/get-all-purchase-order-details',
//                                             'headers': {}
//                                         };
//                                         request(options, function(error, response) {
//                                             if (error) throw new Error(error);
//                                             // console.log(response.body);
//                                             console.log("get-all-purchase-order-details === done");
//                                         });
//                                     });
//                                 });
//                             });
//                         });
//                     });
//                 });
//             });
//         });
//     });
// }, 35000000);

/*
    new interval
*/

let today_time = new Date();
let today_time_hour = today_time.getHours();
var engine_starter = 18;
console.log(today_time_hour);
console.log(today_time_hour == engine_starter);
if(
    today_time_hour == engine_starter
){
    console.log(today_time_hour == engine_starter);
    engine_starter = engine_starter - 1;
    console.log("============================================================ " + synchonize_trigger().then(async value => {
        engine_starter = 18;
        return await value;
    }));
}
setInterval(async () => {
    let today_time = new Date();
    today_time_hour = today_time.getHours();
    console.log(today_time_hour);
    console.log(today_time_hour == engine_starter);
    if(
        today_time_hour == engine_starter
    ){
        console.log(today_time_hour == engine_starter);
        engine_starter = engine_starter - 1;
        console.log("============================================================ " + synchonize_trigger().then(async value => {
            engine_starter = 18;
            return await value;
        }));
    }
}, 3.6e+6);

app.get('/get-time-status-server-accurate-backup', async(req, res) => {
    today_time_hour = today_time.getHours();
    res.send(
        {
            Time_To_GET_Back_Up_Triggered: engine_starter,
            Current_Server_Time: today_time_hour
        }
    );
})

app.get('/get-sales-order-data-recorded', async(req, res) => {
    res.send(
        await get_recorded_sales_order_data_recorded(req.query.req_param, req.query.res_param).then(async value => {
            return await value;
        })
    );
})

async function get_recorded_sales_order_data_recorded(req_param, res_param) {
    return new Promise(async resolve => {
        var sql = `select ${res_param} from vtportal.sales_order_list_accurate where ${req_param};`;
        console.log(sql);
        await con.query(sql, async function(err, result) {
            if (err) {
                console.log(err);
                resolve({
                    query: sql,
                    error: err
                });
            }else{
                resolve({
                    query: sql,
                    response: result
                });
            }
        });
    });
}

async function synchonize_trigger(){
    return new Promise(async resolve => {
        var options = {
            'method': 'GET',
            'url': 'http://localhost:5002/get-lastest-token-and-session-from-accurate',
            'headers': {}
        };
        await request(options, async function(error, response) {
            var options = {
                'method': 'GET',
                'url': 'http://localhost:5002/get-all-sales-return-details',
                'headers': {}
            };
            await request(options, async function(error, response) {
                var options = {
                    'method': 'GET',
                    'url': 'http://localhost:5002/get-all-sales-invoice-details',
                    'headers': {}
                };
                await request(options, async function(error, response) {
                    var options = {
                        'method': 'GET',
                        'url': 'http://localhost:5002/get-all-sales-receipt-details',
                        'headers': {}
                    };
                    await request(options, async function(error, response) {
                        var options = {
                            'method': 'GET',
                            'url': 'http://localhost:5002/get-all-sales-order-details',
                            'headers': {}
                        };
                        await request(options, async function(error, response) {
                            if (error) throw new Error(error);
                            console.log(response.body);
                            console.log("++=========================================================================++");
                            console.log("Started to get customer informations");
                            var options = {
                                'method': 'GET',
                                'url': 'http://localhost:5002/get-all-customer-details',
                                'headers': {}
                            };
                            await request(options, async function(error, response) {
                                if (error) throw new Error(error);
                                console.log(response.body);
                                console.log("++=========================================================================++");
                                console.log("Started to get product informations");
                                var options = {
                                    'method': 'GET',
                                    'url': 'http://localhost:5002/get-all-product-details',
                                    'headers': {}
                                };
                                await request(options, async function(error, response) {
                                    if (error) throw new Error(error);
                                    // console.log(response.body);
                                    console.log("get-all-product-details === done");
                                    var options = {
                                        'method': 'GET',
                                        'url': 'http://localhost:5002/get-all-delivery-order-details',
                                        'headers': {}
                                    };
                                    await request(options, async function(error, response) {
                                        if (error) throw new Error(error);
                                        // console.log(response.body);
                                        console.log("get-all-delivery-order-details === done");
                                        var options = {
                                            'method': 'GET',
                                            'url': 'http://localhost:5002/get-all-employee-details',
                                            'headers': {}
                                        };
                                        await request(options, async function(error, response) {
                                            if (error) throw new Error(error);
                                            // console.log(response.body);
                                            console.log("get-all-employee-details === done");
                                            var options = {
                                                'method': 'GET',
                                                'url': 'http://localhost:5002/get-all-purchase-order-details',
                                                'headers': {}
                                            };
                                            await request(options, async function(error, response) {
                                                if (error) throw new Error(error);
                                                // console.log(response.body);
                                                console.log("get-all-purchase-order-details === done");
                                                const today = new Date();
                                                let d = today.getDate();
                                                let mth = today.getMonth()+1;
                                                let y = today.getYear();
                                                let h = today.getHours();
                                                let m = today.getMinutes();
                                                let s = today.getSeconds();
                                                resolve((h + ":" + m + ":" + s + " " + d + "/" + mth + "/" + y));
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}
/*
    backup sales return
*/

app.get('/get-all-sales-return-details', async(req, res) => {
    var collected_sales_return_ids = [];
    var total_page = await collecting_all_sales_returns_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for (current_page; current_page <= total_page; current_page++) { //total_page
        console.log("loading ids from Accurate to array : " + current_page);
        collected_sales_return_ids = collected_sales_return_ids.concat(
            await requesting_sales_return_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_sales_return_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_sales_return_ids.length; current_id++) {
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_sales_return_details.push(
            await requesting_sales_return_details_based_on_id_from_accurate(collected_sales_return_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }

    var sorted_collected_sales_return_with_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_sales_return_details.length; current_id++) {
        await sort_sales_return_with_details(sorted_collected_sales_return_with_details, collected_sales_return_details[current_id]).then(async value => {
            return await value;
        })
    }
    console.log("=========================================================================================");
    await delete_all_sales_return_in_json_to_mysql();
    console.log("=========================================================================================");
    var current_id = 0;
    for (current_id; current_id < sorted_collected_sales_return_with_details.length; current_id++) {
        if (await insert_sales_return_in_json_to_mysql(sorted_collected_sales_return_with_details[current_id]).then(async value => {
                return await value;
            })) {
            console.log("insert successfully in mysql");
        }
    }

    current_id = 0;
    for (current_id; current_id < sorted_collected_sales_return_with_details.length; current_id++) {
        if (await check_if_sales_return_has_existed_in_MYSQL(sorted_collected_sales_return_with_details[current_id].sales_return_number).then(async value => {
                return await value;
            })) {
            var x = 0;
            for (x; x < sorted_collected_sales_return_with_details[current_id].return_details.length; x++) {
                await update_sales_return_details(sorted_collected_sales_return_with_details[current_id], x);
            }
        } else {
            var x = 0;
            for (x; x < sorted_collected_sales_return_with_details[current_id].return_details.length; x++) {
                await insertSalesreturnDetails(sorted_collected_sales_return_with_details[current_id], x);
            }
        }
    }
    res.send(
        sorted_collected_sales_return_with_details
    );
})

async function check_if_sales_return_has_existed_in_MYSQL(sales_return_number) {
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.sales_return_details_accurate where sales_return_number = '${sales_return_number}';`;
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

async function update_sales_return_details(sorted_collected_sales_return_with_details, x) {
    var sql = `UPDATE vtportal.sales_return_details_accurate SET 
    sales_order_number = '${sorted_collected_sales_return_with_details.return_details[x].sales_order_number}'
    , sales_order_id = '${sorted_collected_sales_return_with_details.return_details[x].sales_order_id}'
    , name = '${sorted_collected_sales_return_with_details.return_details[x].name}'
    , product_code = '${sorted_collected_sales_return_with_details.return_details[x].product_code}'
    , quantity_bought = '${sorted_collected_sales_return_with_details.return_details[x].quantity_bought}'
    , price_per_unit = '${sorted_collected_sales_return_with_details.return_details[x].price_per_unit}'
    , total_price_based_on_quantity = '${sorted_collected_sales_return_with_details.return_details[x].total_price_based_on_quantity}'
    WHERE sales_order_number = '${sorted_collected_sales_return_with_details.return_details[x].sales_order_number}'
    and sales_return_number = '${sorted_collected_sales_return_with_details.return_details[x].sales_return_number}'
    and product_code = '${sorted_collected_sales_return_with_details.return_details[x].product_code}';`;
    // console.log(sql);
    await con.query(sql, async function(err, result) {
        if (err) {
            console.log(err);
            await update_return_details(sorted_collected_sales_return_with_details, i, x);
        }
    });
}

const delete_all_sales_return_in_json_to_mysql = async() => {
    return new Promise(async resolve => {
        var sql = `delete from vtportal.sales_return_accurate;`;
        await con.query(sql, async function(err, result) {
            if (err) console.log(err);
        });
        console.log("clear successful");
        resolve(true);
    });
}

const insert_sales_return_in_json_to_mysql = async(sorted_collected_sales_return_with_details) => {
    var i = 0;
    return new Promise(async resolve => {
        var thedate = new Date(sorted_collected_sales_return_with_details.trans_date);
        var day = thedate.getDate().toString();
        var month = (thedate.getMonth() + 1).toString();
        var year = thedate.getUTCFullYear().toString();
        var sql = `insert into vtportal.sales_return_accurate (
            sales_return_number
            , sales_return_id
            , description
            , trans_date
            , customer_name
            , customer_no
            , customer_id
            , salesman
            , return_details
            , approval_status
        ) values 
        ('${sorted_collected_sales_return_with_details.sales_return_number}'
        , '${sorted_collected_sales_return_with_details.sales_return_id}'
        , '${sorted_collected_sales_return_with_details.description}'
        , '${year + "-" + month + "-" + day}'
        , '${sorted_collected_sales_return_with_details.customer_name}'
        , '${sorted_collected_sales_return_with_details.customer_no}'
        , '${sorted_collected_sales_return_with_details.customer_id}'
        , '${sorted_collected_sales_return_with_details.salesman}'
        , '${sorted_collected_sales_return_with_details.return_details}'
        , '${sorted_collected_sales_return_with_details.approval_status}'
        );`;
        await con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

async function insertSalesreturnDetails(sorted_collected_sales_return_with_details, x) {
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
        var sql = `insert into vtportal.sales_return_details_accurate 
        (
            sales_return_number
            , sales_order_number
            , sales_order_id
            , name
            , product_code
            , quantity_bought
            , price_per_unit
            , total_price_based_on_quantity
            , oid
        ) values 
        ('${sorted_collected_sales_return_with_details.return_details[x].sales_return_number}'
        , '${sorted_collected_sales_return_with_details.return_details[x].sales_order_number}'
        , '${sorted_collected_sales_return_with_details.return_details[x].sales_order_id}'
        , '${sorted_collected_sales_return_with_details.return_details[x].name}'
        , '${sorted_collected_sales_return_with_details.return_details[x].product_code}'
        , '${sorted_collected_sales_return_with_details.return_details[x].quantity_bought}'
        , '${sorted_collected_sales_return_with_details.return_details[x].price_per_unit}'
        , '${sorted_collected_sales_return_with_details.return_details[x].total_price_based_on_quantity}'
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

async function collecting_all_sales_returns_from_accurate() {
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
                'url': 'https://public.accurate.id/accurate/api/sales-return/list.do?sp.page=' + pageFlipper,
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
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING SALES return LIST");
                    }
                }
            });
        });
    });
}

async function requesting_sales_return_ids_from_accurate(pageFlipper) {
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_sales_return_ids_from_accurate(pageFlipper));
            } else {
                var credentials = JSON.parse(await response.body);
                options = {
                    'method': 'GET',
                    'url': 'https://public.accurate.id/accurate/api/sales-return/list.do?sp.page=' + pageFlipper,
                    'headers': {
                        'Authorization': 'Bearer ' + credentials.access_token,
                        'X-Session-ID': credentials.session_id
                    }
                };
                await request(options, async function(error, response) {
                    if (error) {
                        console.log(error);
                        resolve(await requesting_sales_return_ids_from_accurate(pageFlipper));
                    } else {
                        if (response != undefined || response != null) {
                            var result = JSON.parse(await response.body);
                            var i = 0;
                            var responseArray = [];
                            for (i; i < result.d.length; i++) {
                                responseArray.push(result.d[i].id);
                            }
                            resolve(responseArray);
                        }
                    }
                });
            }
        });
    });
}

async function requesting_sales_return_details_based_on_id_from_accurate(id) {
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
                resolve(await requesting_sales_return_details_based_on_id_from_accurate(id));
            } else {
                var credentials = JSON.parse(await response.body);
                options = {
                    'method': 'GET',
                    'url': 'https://public.accurate.id/accurate/api/sales-return/detail.do?id=' + id,
                    'headers': {
                        'Authorization': 'Bearer ' + credentials.access_token,
                        'X-Session-ID': credentials.session_id
                    }
                };
                await request(options, async function(error, response) {
                    if (error) {
                        console.log(error);
                        resolve(await requesting_sales_return_details_based_on_id_from_accurate(id));
                    } else {
                        if (response != undefined || response != null) {
                            try {
                                result = JSON.parse(await response.body);
                                console.log("=============================================");
                                console.log("JSON PARSE SUCCESS IN Sales return details");
                                var u = 0;
                                var detailItem = [];
                                if (result.d != undefined) {
                                    if (result.d.detailItem != undefined) {
                                        for (u; u < result.d.detailItem.length; u++) {
                                            if( result.d.detailItem[u].salesOrder != undefined){
                                                if( result.d.detailItem[u].salesOrder.number != undefined){
                                                    detailItem.push({
                                                        sales_return_number: result.d.number,
                                                        sales_order_number: result.d.detailItem[u].salesOrder.number,
                                                        sales_order_id: result.d.detailItem[u].salesOrder.id,
                                                        name: result.d.detailItem[u].item.name,
                                                        product_code: result.d.detailItem[u].item.no,
                                                        quantity_bought: result.d.detailItem[u].quantityDefault,
                                                        price_per_unit: "UNKNOWN",
                                                        total_price_based_on_quantity: result.d.detailItem[u].totalPrice
                                                    });
                                                }else{
                                                    detailItem.push({
                                                        sales_return_number: result.d.number,
                                                        sales_order_number: "UNKNOWN",
                                                        sales_order_id: "UNKNOWN",
                                                        name: result.d.detailItem[u].item.name,
                                                        product_code: result.d.detailItem[u].item.no,
                                                        quantity_bought: result.d.detailItem[u].quantityDefault,
                                                        price_per_unit: "UNKNOWN",
                                                        total_price_based_on_quantity: result.d.detailItem[u].totalPrice
                                                    });
                                                }
                                            }else{
                                                detailItem.push({
                                                    sales_return_number: result.d.number,
                                                    sales_order_number: "UNKNOWN",
                                                    sales_order_id: "UNKNOWN",
                                                    name: result.d.detailItem[u].item.name,
                                                    product_code: result.d.detailItem[u].item.no,
                                                    quantity_bought: result.d.detailItem[u].quantityDefault,
                                                    price_per_unit: "UNKNOWN",
                                                    total_price_based_on_quantity: result.d.detailItem[u].totalPrice
                                                });
                                            }
                                        }
                                        resolve({
                                            sales_return_number: result.d.number,
                                            sales_return_id: result.d.id,
                                            description: result.d.description,
                                            trans_date: result.d.transDateView,
                                            customer_name: result.d.customer.name,
                                            customer_no: result.d.customer.customerNo,
                                            customer_id: result.d.customer.id,
                                            salesman:  result.d.customer.salesman.name,
                                            return_details: detailItem,
                                            approval_status: result.d.approvalStatus
                                        });
                                    }
                                }
                            } catch (e) {
                                console.log("=============================================");
                                console.log("JSON PARSE FAILED IN Sales return details");
                                console.log(e);
                                console.log(response.body);
                                resolve(await requesting_sales_return_details_based_on_id_from_accurate(id));
                            }
                        }
                    }
                });
            }
        });
    });
}

async function sort_sales_return_with_details(sorted_collected_sales_return_with_details, sales_return_with_details) {
    // return new Promise(async resolve => {
    if (sales_return_with_details.approval_status != undefined) {
        if (sales_return_with_details.approval_status.toUpperCase() == "APPROVED") {
            console.log("sorted approved sales_return_with_details : " + sales_return_with_details.sales_return_number);
            // resolve(sorted_collected_sales_return_with_details.push(sales_return_with_details));
            sorted_collected_sales_return_with_details.push(sales_return_with_details);
            console.log("saved");
            // resolve(true);
        }
    }
    // });
}

/*
    backup sales invoice
*/
app.get('/get-all-sales-invoice-details', async(req, res) => {
    var collected_sales_invoice_ids = [];
    var total_page = await collecting_all_sales_invoices_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for (current_page; current_page <= total_page; current_page++) { //total_page
        console.log("loading ids from Accurate to array : " + current_page);
        collected_sales_invoice_ids = collected_sales_invoice_ids.concat(
            await requesting_sales_invoice_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_sales_invoice_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_sales_invoice_ids.length; current_id++) {
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_sales_invoice_details.push(
            await requesting_sales_invoice_details_based_on_id_from_accurate(collected_sales_invoice_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }

    var sorted_collected_sales_invoice_with_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_sales_invoice_details.length; current_id++) {
        await sort_sales_invoice_with_details(sorted_collected_sales_invoice_with_details, collected_sales_invoice_details[current_id]).then(async value => {
            return await value;
        })
    }
    console.log("=========================================================================================");
    await delete_all_sales_invoice_in_json_to_mysql();
    console.log("=========================================================================================");
    var current_id = 0;
    for (current_id; current_id < sorted_collected_sales_invoice_with_details.length; current_id++) {
        if (await insert_sales_invoice_in_json_to_mysql(sorted_collected_sales_invoice_with_details[current_id]).then(async value => {
                return await value;
            })) {
            console.log("insert successfully in mysql");
        }
    }

    current_id = 0;
    for (current_id; current_id < sorted_collected_sales_invoice_with_details.length; current_id++) {
        if (await check_if_sales_invoice_has_existed_in_MYSQL(sorted_collected_sales_invoice_with_details[current_id].invoice_number).then(async value => {
                return await value;
            })) {
            var x = 0;
            for (x; x < sorted_collected_sales_invoice_with_details[current_id].invoice_details.length; x++) {
                await update_sales_invoice_details(sorted_collected_sales_invoice_with_details[current_id], x);
            }
        } else {
            var x = 0;
            for (x; x < sorted_collected_sales_invoice_with_details[current_id].invoice_details.length; x++) {
                await insertSalesinvoiceDetails(sorted_collected_sales_invoice_with_details[current_id], x);
            }
        }
    }
    res.send(
        sorted_collected_sales_invoice_with_details
    );
})

async function check_if_sales_invoice_has_existed_in_MYSQL(invoice_number) {
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.sales_invoice_details_accurate where invoice_number = '${invoice_number}';`;
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

async function update_sales_invoice_details(sorted_collected_sales_invoice_with_details, x) {
    var sql = `UPDATE vtportal.sales_invoice_details_accurate SET 
    name = '${sorted_collected_sales_invoice_with_details.invoice_details[x].name}'
    , quantity_bought = '${sorted_collected_sales_invoice_with_details.invoice_details[x].quantity_bought}'
    , price_per_unit = '${sorted_collected_sales_invoice_with_details.invoice_details[x].price_per_unit}'
    , total_price = '${sorted_collected_sales_invoice_with_details.invoice_details[x].total_price_based_on_quantity}'
    WHERE so_number = '${sorted_collected_sales_invoice_with_details.invoice_details[x].so_number}'
    and product_code = '${sorted_collected_sales_invoice_with_details.invoice_details[x].product_code}'
    and invoice_number = '${sorted_collected_sales_invoice_with_details.invoice_details[x].invoice_number}';`;
    // console.log(sql);
    await con.query(sql, async function(err, result) {
        if (err) {
            console.log(err);
            await update_invoice_details(sorted_collected_sales_invoice_with_details, i, x);
        }
    });
}

const delete_all_sales_invoice_in_json_to_mysql = async() => {
    return new Promise(async resolve => {
        var sql = `delete from vtportal.sales_invoice_accurate;`;
        await con.query(sql, async function(err, result) {
            if (err) console.log(err);
        });
        console.log("clear successful");
        resolve(true);
    });
}

const insert_sales_invoice_in_json_to_mysql = async(sorted_collected_sales_invoice_with_details) => {
    var i = 0;
    return new Promise(async resolve => {
        var sql = `insert into vtportal.sales_invoice_accurate (
            print_user_name
            , tax_number
            , customer_id
            , retail_wp_name
            , due_date
            , trans_date
            , invoice_number
            , status
            , tax_date
            , journal_id
            , total_amount
        ) values 
        ('${sorted_collected_sales_invoice_with_details.print_user_name}'
        , '${sorted_collected_sales_invoice_with_details.tax_number}'
        , '${sorted_collected_sales_invoice_with_details.customer_id}'
        , '${sorted_collected_sales_invoice_with_details.retail_wp_name}'
        , '${sorted_collected_sales_invoice_with_details.due_date}'
        , '${sorted_collected_sales_invoice_with_details.trans_date}'
        , '${sorted_collected_sales_invoice_with_details.invoice_number}'
        , '${sorted_collected_sales_invoice_with_details.status}'
        , '${sorted_collected_sales_invoice_with_details.tax_date}'
        , '${sorted_collected_sales_invoice_with_details.journal_id}'
        , '${sorted_collected_sales_invoice_with_details.total_amount}'
        );`;
        await con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

async function insertSalesinvoiceDetails(sorted_collected_sales_invoice_with_details, x) {
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
        var sql = `insert into vtportal.sales_invoice_details_accurate 
        (
            invoice_number
            , so_number
            , name
            , product_code
            , quantity_bought
            , price_per_unit
            , total_price
            , oid
        ) values 
        ('${sorted_collected_sales_invoice_with_details.invoice_details[x].invoice_number}'
        , '${sorted_collected_sales_invoice_with_details.invoice_details[x].so_number}'
        , '${sorted_collected_sales_invoice_with_details.invoice_details[x].name}'
        , '${sorted_collected_sales_invoice_with_details.invoice_details[x].product_code}'
        , '${sorted_collected_sales_invoice_with_details.invoice_details[x].quantity_bought}'
        , '${sorted_collected_sales_invoice_with_details.invoice_details[x].price_per_unit}'
        , '${sorted_collected_sales_invoice_with_details.invoice_details[x].total_price_based_on_quantity}'
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

async function collecting_all_sales_invoices_from_accurate() {
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
                'url': 'https://public.accurate.id/accurate/api/sales-invoice/list.do?sp.page=' + pageFlipper,
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
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING SALES invoice LIST");
                    }
                }
            });
        });
    });
}

async function requesting_sales_invoice_ids_from_accurate(pageFlipper) {
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_sales_invoice_ids_from_accurate(pageFlipper));
            } else {
                var credentials = JSON.parse(await response.body);
                options = {
                    'method': 'GET',
                    'url': 'https://public.accurate.id/accurate/api/sales-invoice/list.do?sp.page=' + pageFlipper,
                    'headers': {
                        'Authorization': 'Bearer ' + credentials.access_token,
                        'X-Session-ID': credentials.session_id
                    }
                };
                await request(options, async function(error, response) {
                    if (error) {
                        console.log(error);
                        resolve(await requesting_sales_invoice_ids_from_accurate(pageFlipper));
                    } else {
                        if (response != undefined || response != null) {
                            var result = JSON.parse(await response.body);
                            var i = 0;
                            var responseArray = [];
                            for (i; i < result.d.length; i++) {
                                responseArray.push(result.d[i].id);
                            }
                            resolve(responseArray);
                        }
                    }
                });
            }
        });
    });
}

async function requesting_sales_invoice_details_based_on_id_from_accurate(id) {
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
                resolve(await requesting_sales_invoice_details_based_on_id_from_accurate(id));
            } else {
                var credentials = JSON.parse(await response.body);
                options = {
                    'method': 'GET',
                    'url': 'https://public.accurate.id/accurate/api/sales-invoice/detail.do?id=' + id,
                    'headers': {
                        'Authorization': 'Bearer ' + credentials.access_token,
                        'X-Session-ID': credentials.session_id
                    }
                };
                await request(options, async function(error, response) {
                    if (error) {
                        console.log(error);
                        resolve(await requesting_sales_invoice_details_based_on_id_from_accurate(id));
                    } else {
                        if (response != undefined || response != null) {
                            try {
                                result = JSON.parse(await response.body);
                                console.log("=============================================");
                                console.log("JSON PARSE SUCCESS IN Sales invoice details");
                                var u = 0;
                                var detailItem = [];
                                if (result.d != undefined) {
                                    if (result.d.detailItem != undefined) {
                                        for (u; u < result.d.detailItem.length; u++) {
                                            if(result.d.detailItem[u].salesOrder != undefined){
                                                if(result.d.detailItem[u].salesOrder.number != undefined){
                                                    detailItem.push({
                                                        invoice_number: result.d.number,
                                                        so_number: result.d.detailItem[u].salesOrder.number,
                                                        name: result.d.detailItem[u].item.name,
                                                        product_code: result.d.detailItem[u].item.no,
                                                        quantity_bought: result.d.detailItem[u].quantityDefault,
                                                        price_per_unit: "UNKNOWN",
                                                        total_price_based_on_quantity: result.d.detailItem[u].totalPrice
                                                    });
                                                }else{
                                                    console.log("=============================================");
                                                    console.log("INVOICE DOES NOT HAVE SALES ORDER NUMBER| INV : " + result.d.number);
                                                }
                                            }else{
                                                console.log("=============================================");
                                                console.log("INVOICE DOES NOT HAVE SALES ORDER NUMBER| INV : " + result.d.number);
                                            }
                                        }
                                        resolve({
                                            print_user_name: result.d.printUserName,
                                            tax_number: result.d.taxNumber,
                                            customer_id: result.d.customerId,
                                            retail_wp_name: result.d.retailWpName,
                                            due_date: result.d.dueDate,
                                            trans_date: result.d.transDate,
                                            invoice_number: result.d.number,
                                            status: result.d.status,
                                            tax_date: result.d.taxDate,
                                            journal_id: result.d.journalId,
                                            total_amount: result.d.totalAmount,
                                            approval_status: result.d.approvalStatus,
                                            invoice_details: detailItem
                                        });
                                    }
                                }
                            } catch (e) {
                                console.log("=============================================");
                                console.log("JSON PARSE FAILED IN Sales invoice details");
                                console.log(e);
                                console.log(response.body);
                                resolve(await requesting_sales_invoice_details_based_on_id_from_accurate(id));
                            }
                        }
                    }
                });
            }
        });
    });
}

async function sort_sales_invoice_with_details(sorted_collected_sales_invoice_with_details, sales_invoice_with_details) {
    // return new Promise(async resolve => {
    if (sales_invoice_with_details.approval_status != undefined) {
        if (sales_invoice_with_details.approval_status.toUpperCase() == "APPROVED") {
            console.log("sorted approved sales_invoice_with_details : " + sales_invoice_with_details.invoice_number);
            // resolve(sorted_collected_sales_invoice_with_details.push(sales_invoice_with_details));
            sorted_collected_sales_invoice_with_details.push(sales_invoice_with_details);
            console.log("saved");
            // resolve(true);
        }
    }
    // });
}
/*
    backup sales receipt
*/

app.get('/get-all-sales-receipt-details', async(req, res) => {
    var collected_sales_receipt_ids = [];
    var total_page = await collecting_all_sales_receipts_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for (current_page; current_page <= total_page; current_page++) { //total_page
        console.log("loading ids from Accurate to array : " + current_page);
        collected_sales_receipt_ids = collected_sales_receipt_ids.concat(
            await requesting_sales_receipt_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_sales_receipt_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_sales_receipt_ids.length; current_id++) {
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_sales_receipt_details.push(
            await requesting_sales_receipt_details_based_on_id_from_accurate(collected_sales_receipt_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }

    var sorted_collected_sales_receipt_with_details = [];
    var current_id = 0;
    for (current_id; current_id < collected_sales_receipt_details.length; current_id++) {
        await sort_sales_receipt_with_details(sorted_collected_sales_receipt_with_details, collected_sales_receipt_details[current_id]).then(async value => {
            return await value;
        })
    }
    console.log("=========================================================================================");
    await delete_all_sales_receipt_in_json_to_mysql();
    console.log("=========================================================================================");
    var current_id = 0;
    for (current_id; current_id < sorted_collected_sales_receipt_with_details.length; current_id++) {
        if (await insert_sales_receipt_in_json_to_mysql(sorted_collected_sales_receipt_with_details[current_id]).then(async value => {
                return await value;
            })) {
            console.log("insert successfully in mysql");
        }
    }

    current_id = 0;
    for (current_id; current_id < sorted_collected_sales_receipt_with_details.length; current_id++) {
        if (await check_if_sales_receipt_has_existed_in_MYSQL(sorted_collected_sales_receipt_with_details[current_id].receipt_number).then(async value => {
                return await value;
            })) {
            var x = 0;
            for (x; x < sorted_collected_sales_receipt_with_details[current_id].detail_invoice.length; x++) {
                await update_sales_receipt_details(sorted_collected_sales_receipt_with_details[current_id], x);
            }
        } else {
            var x = 0;
            for (x; x < sorted_collected_sales_receipt_with_details[current_id].detail_invoice.length; x++) {
                await insertSalesreceiptDetails(sorted_collected_sales_receipt_with_details[current_id], x);
            }
        }
    }
    res.send(
        sorted_collected_sales_receipt_with_details
    );
})

async function check_if_sales_receipt_has_existed_in_MYSQL(receipt_number) {
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.sales_receipt_details_accurate where receipt_number = '${receipt_number}';`;
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

async function update_sales_receipt_details(sorted_collected_sales_receipt_with_details, x) {
    var sql = `UPDATE vtportal.sales_receipt_details_accurate SET 
    receipt_number = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].receipt_number}'
    , invoice_id = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].invoice_id}'
    , invoice_number = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].invoice_number}'
    , due_date_view = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].due_date_view}'
    , ship_date = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].ship_date}'
    , tax_date = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].tax_date}'
    , last_payment_date = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].last_payment_date}'
    , payment_amount = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].payment_amount}'
    , total_amount = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].total_amount}'
    , tax_number = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].tax_number}'
    , status = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].status}'
    WHERE invoice_number = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].invoice_number}';
    and receipt_number = '${sorted_collected_sales_receipt_with_details.detail_invoice[x].receipt_number}'`;
    // console.log(sql);
    await con.query(sql, async function(err, result) {
        if (err) {
            console.log(err);
            await update_detail_invoice(sorted_collected_sales_receipt_with_details, i, x);
        }
    });
}

const delete_all_sales_receipt_in_json_to_mysql = async() => {
    return new Promise(async resolve => {
        var sql = `delete from vtportal.sales_receipt_accurate;`;
        await con.query(sql, async function(err, result) {
            if (err) console.log(err);
        });
        console.log("clear successful");
        resolve(true);
    });
}

const insert_sales_receipt_in_json_to_mysql = async(sorted_collected_sales_receipt_with_details) => {
    var i = 0;
    return new Promise(async resolve => {
        var thedate = new Date(sorted_collected_sales_receipt_with_details.pph_due_date);
        var day = thedate.getDate().toString();
        var month = (thedate.getMonth() + 1).toString();
        var year = thedate.getUTCFullYear().toString();
        // thedate.setDate(thedate.getDate() + sorted_collected_sales_receipt_with_details.period_date);
        // var dayPeriod = thedate.getDate().toString();
        // var monthPeriod = (thedate.getMonth() + 1).toString();
        // var yearPeriod = thedate.getUTCFullYear().toString();
        var sql = `insert into vtportal.sales_receipt_accurate (
            receipt_id
            , receipt_number
            , total_payment
            , pph_due_date
            , customer_name
            , customer_no
            , customer_id
            , contact_info
        ) values 
        ('${sorted_collected_sales_receipt_with_details.receipt_id}'
        , '${sorted_collected_sales_receipt_with_details.receipt_number}'
        , '${sorted_collected_sales_receipt_with_details.total_payment}'
        , '${year + "-" + month + "-" + day}'
        , '${sorted_collected_sales_receipt_with_details.customer_name}'
        , '${sorted_collected_sales_receipt_with_details.customer_no}'
        , '${sorted_collected_sales_receipt_with_details.customer_id}'
        , '${sorted_collected_sales_receipt_with_details.contact_info}'
        );`;
        await con.query(sql, function(err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

async function insertSalesreceiptDetails(sorted_collected_sales_receipt_with_details, x) {
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
        var sql = `insert into vtportal.sales_receipt_details_accurate 
        (
            receipt_number
            , invoice_id
            , invoice_number
            , due_date_view
            , ship_date
            , tax_date
            , last_payment_date
            , payment_amount
            , total_amount
            , tax_number
            , status
            , oid
        ) values 
        ('${sorted_collected_sales_receipt_with_details.detail_invoice[x].receipt_number}'
        , '${sorted_collected_sales_receipt_with_details.detail_invoice[x].invoice_id}'
        , '${sorted_collected_sales_receipt_with_details.detail_invoice[x].invoice_number}'
        , '${sorted_collected_sales_receipt_with_details.detail_invoice[x].due_date_view}'
        , '${sorted_collected_sales_receipt_with_details.detail_invoice[x].ship_date}'
        , '${sorted_collected_sales_receipt_with_details.detail_invoice[x].tax_date}'
        , '${sorted_collected_sales_receipt_with_details.detail_invoice[x].last_payment_date}'
        , '${sorted_collected_sales_receipt_with_details.detail_invoice[x].payment_amount}'
        , '${sorted_collected_sales_receipt_with_details.detail_invoice[x].total_amount}'
        , '${sorted_collected_sales_receipt_with_details.detail_invoice[x].tax_number}'
        , '${sorted_collected_sales_receipt_with_details.detail_invoice[x].status}'
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

async function collecting_all_sales_receipts_from_accurate() {
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
                'url': 'https://public.accurate.id/accurate/api/sales-receipt/list.do?sp.page=' + pageFlipper,
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
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING SALES receipt LIST");
                    }
                }
            });
        });
    });
}

async function requesting_sales_receipt_ids_from_accurate(pageFlipper) {
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            if (error) {
                console.log(error);
                resolve(await requesting_sales_receipt_ids_from_accurate(pageFlipper));
            } else {
                var credentials = JSON.parse(await response.body);
                options = {
                    'method': 'GET',
                    'url': 'https://public.accurate.id/accurate/api/sales-receipt/list.do?sp.page=' + pageFlipper,
                    'headers': {
                        'Authorization': 'Bearer ' + credentials.access_token,
                        'X-Session-ID': credentials.session_id
                    }
                };
                await request(options, async function(error, response) {
                    if (error) {
                        console.log(error);
                        resolve(await requesting_sales_receipt_ids_from_accurate(pageFlipper));
                    } else {
                        if (response != undefined || response != null) {
                            var result = JSON.parse(await response.body);
                            var i = 0;
                            var responseArray = [];
                            for (i; i < result.d.length; i++) {
                                responseArray.push(result.d[i].id);
                            }
                            resolve(responseArray);
                        }
                    }
                });
            }
        });
    });
}

async function requesting_sales_receipt_details_based_on_id_from_accurate(id) {
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
                resolve(await requesting_sales_receipt_details_based_on_id_from_accurate(id));
            } else {
                var credentials = JSON.parse(await response.body);
                options = {
                    'method': 'GET',
                    'url': 'https://public.accurate.id/accurate/api/sales-receipt/detail.do?id=' + id,
                    'headers': {
                        'Authorization': 'Bearer ' + credentials.access_token,
                        'X-Session-ID': credentials.session_id
                    }
                };
                await request(options, async function(error, response) {
                    if (error) {
                        console.log(error);
                        resolve(await requesting_sales_receipt_details_based_on_id_from_accurate(id));
                    } else {
                        if (response != undefined || response != null) {
                            try {
                                result = JSON.parse(await response.body);
                                console.log("=============================================");
                                console.log("JSON PARSE SUCCESS IN Sales receipt details");
                                var u = 0;
                                var detailInvoice = [];
                                if (result.d != undefined) {
                                    if (result.d.detailInvoice != undefined) {
                                        for (u; u < result.d.detailInvoice.length; u++) {
                                            detailInvoice.push({
                                                receipt_number: result.d.number,
                                                invoice_id: result.d.detailInvoice[u].id,
                                                invoice_number: result.d.detailInvoice[u].invoice.number,
                                                due_date_view: result.d.detailInvoice[u].invoice.dueDateView,
                                                ship_date: result.d.detailInvoice[u].invoice.shipDate,
                                                tax_date: result.d.detailInvoice[u].invoice.taxDate,
                                                last_payment_date: result.d.detailInvoice[u].invoice.lastPaymentDate,
                                                payment_amount: result.d.detailInvoice[u].paymentAmount,
                                                total_amount: result.d.detailInvoice[u].invoice.totalAmount,
                                                tax_number: result.d.detailInvoice[u].invoice.taxNumber,
                                                status: result.d.detailInvoice[u].invoice.status
                                            });
                                        }
                                        if (result.d.customer.contactInfo.mobilePhone != null) {
                                            resolve({
                                                receipt_id: result.d.id,
                                                receipt_number: result.d.number,
                                                total_payment: result.d.totalPayment,
                                                pph_due_date: result.d.pphDueDate,
                                                customer_name: result.d.customer.name,
                                                customer_no: result.d.customer.customerNo,
                                                customer_id: result.d.customer.id,
                                                contact_info: result.d.customer.contactInfo.mobilePhone,
                                                detail_invoice: detailInvoice,
                                                approval_status: result.d.approvalStatus
                                            });
                                        } else {
                                            resolve({
                                                receipt_id: result.d.id,
                                                receipt_number: result.d.number,
                                                total_payment: result.d.totalPayment,
                                                pph_due_date: result.d.pphDueDate,
                                                customer_name: result.d.customer.name,
                                                customer_no: result.d.customer.customerNo,
                                                customer_id: result.d.customer.id,
                                                contact_info: result.d.customer.contactInfo.workPhone,
                                                detail_invoice: detailInvoice,
                                                approval_status: result.d.approvalStatus
                                            });
                                        }
                                    }
                                }
                            } catch (e) {
                                console.log("=============================================");
                                console.log("JSON PARSE FAILED IN Sales Receipt details");
                                console.log(e);
                                console.log(response.body);
                                resolve(await requesting_sales_receipt_details_based_on_id_from_accurate(id));
                            }
                        }
                    }
                });
            }
        });
    });
}

async function sort_sales_receipt_with_details(sorted_collected_sales_receipt_with_details, sales_receipt_with_details) {
    if (sales_receipt_with_details.approval_status != undefined) {
        if (sales_receipt_with_details.approval_status.toUpperCase() == "APPROVED") {
            console.log("sorted approved sales_receipt_with_details : " + sales_receipt_with_details.sales_receipt_number);
            sorted_collected_sales_receipt_with_details.push(sales_receipt_with_details);
            console.log("saved");
        }
    }
}

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
        var sql = `insert into vtportal.sales_order_list_accurate (
            so_number
            , order_date
            , period_date
            , payment_method
            , customer_name
            , customer_code
            , salesman
            , delivery_address
            , total_quantities
            , total_amount
            , status
            , deleted
            , contact_number
        ) values 
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
        var sql = `insert into vtportal.sales_order_details_accurate 
        (
            so_number
            , name
            , product_code
            , quantity_bought
            , price_per_unit
            , total_price
            , oid
        ) values 
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
                resolve(await requesting_sales_order_ids_from_accurate(pageFlipper));
            } else {
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
                        resolve(await requesting_sales_order_ids_from_accurate(pageFlipper));
                    } else {
                        if (response != undefined || response != null) {
                            var result = JSON.parse(await response.body);
                            var i = 0;
                            var responseArray = [];
                            for (i; i < result.d.length; i++) {
                                responseArray.push(result.d[i].id);
                            }
                            resolve(responseArray);
                        }
                    }
                });
            }
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
            } else {
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
                    } else {
                        if (response != undefined || response != null) {
                            try {
                                result = JSON.parse(await response.body);
                                console.log("=============================================");
                                console.log("JSON PARSE SUCCESS IN Sales order details");
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
                            } catch (e) {
                                console.log("=============================================");
                                console.log("JSON PARSE FAILED IN Sales order details");
                                console.log(e);
                                console.log(response.body);
                                resolve(await requesting_sales_order_details_based_on_id_from_accurate(id));
                            }
                        }
                    }
                });
            }
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
var customer_details_list_global_variable = [];

app.get('/get-all-customers-based-on-salesman', async(req, res) => {
    var collected_customer_details = customer_details_list_global_variable;
    console.log("get-all-customers-based-on-salesman =========================================================================================");
    console.log(collected_customer_details.length);
    var i = 0;
    var collected_customers_based_on_salesman = [];

    if (collected_customer_details.length > 0) {
        for (i; i < collected_customer_details.length; i++) {
            if (req.query.salesman_name != undefined) {
                if (req.query.salesman_name.length > 0) {
                    if (collected_customer_details[i].salesman != undefined) {
                        if (collected_customer_details[i].salesman.length > 0) {
                            if (collected_customer_details[i].salesman.toUpperCase().includes(req.query.salesman_name.toUpperCase())) {
                                collected_customers_based_on_salesman.push({
                                    value: collected_customer_details[i].customer_no,
                                    label: collected_customer_details[i].name + " / " + collected_customer_details[i].bill_complete_address
                                });
                            }
                        }
                    }
                }
            }
        }
    } else {
        collected_customer_details = await get_customer_from_db_based_on_salesman(req.query.salesman_name.toUpperCase());
        console.log("get-all-customers-based-on-salesman =========================================================================================");
        console.log("alternate to get data from DB = " + collected_customer_details.length);
        for (i; i < collected_customer_details.length; i++) {
            if (req.query.salesman_name != undefined) {
                if (req.query.salesman_name.length > 0) {
                    if (collected_customer_details[i].salesman != undefined) {
                        if (collected_customer_details[i].salesman.length > 0) {
                            console.log("get-all-customers-based-on-salesman =========================================================================================");
                            console.log("target acquired = " + req.query.salesman_name);
                            if (collected_customer_details[i].salesman.toUpperCase().includes(req.query.salesman_name.toUpperCase())) {
                                collected_customers_based_on_salesman.push({
                                    value: collected_customer_details[i].customer_no,
                                    label: collected_customer_details[i].name + " / " + collected_customer_details[i].bill_complete_address
                                });
                            }
                        }
                    }
                }
            }
        }
    }

    res.send(
        collected_customers_based_on_salesman
    );
})

const get_customer_from_db_based_on_salesman = async(salesman) => {
    return new Promise(async resolve => {
        var sql = `select * from vtportal.customer_list_accurate where UPPER(salesman) like '%${salesman.toUpperCase()}%';`;
        con.query(sql, function(err, result) {
            if (err) {
                console.log(err);
                resolve([]);
            } else {
                resolve(result);
            }
        });
    });
}

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
        var data_response = await requesting_customer_details_based_on_id_from_accurate(collected_customer_ids[current_id]).then(async value => {
            return await value;
        });
        if (data_response.customer_no != undefined) {
            if (data_response.customer_no.length > 0) {
                collected_customer_details.push(
                    data_response
                );
            }
        }
    }
    console.log("=========================================================================================");
    customer_details_list_global_variable = collected_customer_details;
    console.log(collected_customer_details.length);
    await delete_all_customer_has_existed_in_MYSQL(); // update requested by Rafa and Dayat
    var current_id = 0;
    console.log(collected_customer_details.length);
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
        // create_date	name	customer_no	contact_name	work_phone	salesman	bill_city	bill_province	bill_street	bill_zipCode	bill_country	bill_complete_address	latitude	longitude
        var sql = `insert into vtportal.customer_list_accurate (
            create_date
            , name
            , customer_no
            , contact_name
            , work_phone
            , salesman
            , bill_city
            , bill_province
            , bill_street
            , bill_zipCode
            , bill_country
            , bill_complete_address
        ) values 
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
                        resolve(collecting_all_customers_from_accurate());
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
                console.log("error from Accurate 1");
                resolve(await requesting_customer_ids_from_accurate(pageFlipper));
            } else {
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
                        console.log("error from Accurate 2 " + pageFlipper);
                        resolve(await requesting_customer_ids_from_accurate(pageFlipper));
                    } else {
                        if (response != undefined || response != null) {
                            var result = JSON.parse(await response.body);
                            var i = 0;
                            var responseArray = [];
                            for (i; i < result.d.length; i++) {
                                responseArray.push(result.d[i].id);
                            }
                            resolve(responseArray);
                        }
                    }
                });
            }
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
            } else {
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
                    } else {
                        if (response != undefined || response != null) {
                            result = JSON.parse(await response.body);
                            var u = 0;
                            if (result.d != undefined) {
                                if (!result.d.suspended) {
                                    if (result.d.salesman != null) {
                                        if (result.d.detailContact != undefined) {
                                            if (result.d.detailContact.length > 0) {
                                                resolve({
                                                    create_date: result.d.createDate,
                                                    name: result.d.wpName,
                                                    customer_no: result.d.customerNo,
                                                    contact_name: result.d.detailContact[0].name,
                                                    work_phone: result.d.workPhone || result.d.mobilePhone,
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
                                                    contact_name: result.d.wpName,
                                                    work_phone: result.d.workPhone || result.d.mobilePhone,
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
                                            resolve({
                                                create_date: result.d.createDate,
                                                name: result.d.wpName,
                                                customer_no: result.d.customerNo,
                                                contact_name: result.d.wpName,
                                                work_phone: result.d.workPhone || result.d.mobilePhone,
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
                                        if (result.d.detailContact != undefined) {
                                            if (result.d.detailContact.length > 0) {
                                                resolve({
                                                    create_date: result.d.createDate,
                                                    name: result.d.wpName,
                                                    customer_no: result.d.customerNo,
                                                    contact_name: result.d.detailContact[0].name,
                                                    work_phone: result.d.workPhone || result.d.mobilePhone,
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
                                                    contact_name: result.d.wpName,
                                                    work_phone: result.d.workPhone || result.d.mobilePhone,
                                                    salesman: result.d.salesman,
                                                    bill_city: result.d.billCity,
                                                    bill_province: result.d.billProvince,
                                                    bill_street: result.d.billStreet,
                                                    bill_zipCode: result.d.billZipCode,
                                                    bill_country: result.d.billCountry,
                                                    bill_complete_address: result.d.billProvince + " " + result.d.billCity + " " + result.d.billZipCode + " " + result.d.billStreet,
                                                });
                                            }
                                        } else {
                                            resolve({
                                                create_date: result.d.createDate,
                                                name: result.d.wpName,
                                                customer_no: result.d.customerNo,
                                                contact_name: result.d.wpName,
                                                work_phone: result.d.workPhone || result.d.mobilePhone,
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
                                } else {
                                    console.log("========================================================================");
                                    console.log("reason " + result.d.suspended + " fail 1");
                                    console.log("requesting_customer_details_based_on_id_from_accurate " + id + " fail 1");
                                    resolve({
                                        create_date: '',
                                        name: '',
                                        customer_no: '',
                                        contact_name: '',
                                        work_phone: '',
                                        salesman: '',
                                        bill_city: '',
                                        bill_province: '',
                                        bill_street: '',
                                        bill_zipCode: '',
                                        bill_country: '',
                                        bill_complete_address: '',
                                    });
                                }
                            } else {
                                console.log("requesting_customer_details_based_on_id_from_accurate " + id + " fail 2");
                                resolve(resolve({
                                    create_date: '',
                                    name: '',
                                    customer_no: '',
                                    contact_name: '',
                                    work_phone: '',
                                    salesman: '',
                                    bill_city: '',
                                    bill_province: '',
                                    bill_street: '',
                                    bill_zipCode: '',
                                    bill_country: '',
                                    bill_complete_address: '',
                                }));
                            }
                        } else {
                            console.log("========================================================================");
                            console.log("reason " + result.d.suspended + " fail 3");
                            console.log(error);
                            resolve(await requesting_customer_details_based_on_id_from_accurate(id));
                        }
                    }
                });
            }
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
        var sql = `insert into vtportal.purchase_order_list_accurate 
        (
            po_number
            , order_date
            , period_date
            , payment_method
            , supplier_name
            , supplier_code
            , supplier_number
            , delivery_address
            , total_quantities
            , total_amount
            , status
            , deleted
        ) values 
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
        var sql = `insert into vtportal.purchase_order_details_accurate (
            po_number
            , name
            , product_code
            , quantity_bought
            , price_per_unit
            , total_price
            , oid
        ) values 
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
            sql = `insert into vtportal.delivery_order_list_accurate (
                delivery_number
                , customer_name
                , shipping_address
                , responsible_user
                , sales_order_number
                , status
                , total_price
                , total_quantity
                , delivery_time
            ) values 
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
            sql = `insert into vtportal.delivery_order_list_accurate (
                delivery_number
                , customer_name
                , shipping_address
                , responsible_user
                , sales_order_number
                , status
                , total_price
                , total_quantity
                , delivery_time
            ) values 
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
        var sql = `insert into vtportal.delivery_order_details_accurate (
            oid
            , delivery_number
            , product_code
            , product_name
            , quantity
            , total_price
        ) values 
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
                resolve(await requesting_delivery_order_ids_from_accurate(pageFlipper));
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
                    resolve(await requesting_delivery_order_ids_from_accurate(pageFlipper));
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
    console.log(collected_employee_ids);
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

    var current_id = 0;
    for (current_id; current_id < collected_employee_details.length; current_id++) {
        if (await check_if_employee_has_existed_in_MYSQL_old_table(collected_employee_details[current_id].emp_number).then(async value => {
                return await value;
            })) {
            console.log("current_id = " + current_id);
            if (await update_employee_in_json_to_mysql_old_table(collected_employee_details[current_id]).then(async value => {
                    return await value;
                })) {
                console.log("udpate successfully in mysql");
            }
        } else {
            console.log("current_id = " + current_id);
            if (await insert_employee_in_json_to_mysql_old_table(collected_employee_details[current_id]).then(async value => {
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
        var sql = `select count(*) as total_found from vtportal.employee_data_accurate_new where emp_number = '${emp_number}';`;
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
        var sql = `UPDATE vtportal.employee_data_accurate_new SET 
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
        var sql = `insert into vtportal.employee_data_accurate_new (name, emp_number, mobilePhone, email, emp_position) values 
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

/*
    to insert to old table
*/
async function check_if_employee_has_existed_in_MYSQL_old_table(emp_number) {
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

const update_employee_in_json_to_mysql_old_table = async(sorted_collected_employee_with_details) => {
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

const insert_employee_in_json_to_mysql_old_table = async(sorted_collected_employee_with_details) => {
    return new Promise(async resolve => {
        var sql = `insert into vtportal.employee_data_accurate (name, emp_number, mobilePhone, email, emp_position) values 
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
                resolve(await requesting_employee_ids_from_accurate(pageFlipper));
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
                    resolve(await requesting_employee_ids_from_accurate(pageFlipper));
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
    console.log("requesting_employee_details_based_on_id_from_accurate | id " + id);
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
            }else{
                console.log("successfull retrieve access token ======= requesting_employee_details_based_on_id_from_accurate | id " + id);
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
                    }else{
                        console.log("https://public.accurate.id/accurate/api/employee/detail.do?id= | id " + id);
                        if (response != undefined || response != null) {
                            console.log("parsing response.body ====== requesting_employee_details_based_on_id_from_accurate | id " + id);
                            result = JSON.parse(await response.body);
                            var u = 0;
                            if (result.d != undefined) {
                                if (!result.d.suspended) {
                                    if (result.d.salesman) {
                                        console.log("EMPLOYEE NAME =============================================== EMPLOYEE NAME");
                                        console.log(result.d.name);
                                        console.log("EMPLOYEE NAME =============================================== EMPLOYEE NAME");
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
                                }else{
                                    console.log("requesting_employee_details_based_on_id_from_accurate | result.d.suspended = " + result.d.suspended + " for " + result.d.salesman);
                                    resolve({
                                        name: "",
                                        emp_number: "",
                                        mobilePhone: "",
                                        email: "",
                                        emp_position: ""
                                    });
                                }
                            }else{
                                console.log("requesting_employee_details_based_on_id_from_accurate | result.d = UNDEFINED");
                                resolve({
                                    name: "",
                                    emp_number: "",
                                    mobilePhone: "",
                                    email: "",
                                    emp_position: ""
                                });
                            }
                        }else{
                            console.log("requesting_employee_details_based_on_id_from_accurate | response = undefined");
                            resolve({
                                name: "",
                                emp_number: "",
                                mobilePhone: "",
                                email: "",
                                emp_position: ""
                            });
                        }
                    }
                });   
            }
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
    console.log("===============================================================");
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
        , Category = '${sorted_collected_product_with_details.Category_Name}',
        GroupBuy_Purchase = '${sorted_collected_product_with_details.GroupBuy_Purchase}',
        Categorize_NEW = '${sorted_collected_product_with_details.Categorize_NEW}',
        Mandarin_Name = '${sorted_collected_product_with_details.Mandarin_Name}',
        Specification = '${sorted_collected_product_with_details.Specification}',
        Subcategory = '${sorted_collected_product_with_details.Subcategory}',
        Remark = '${sorted_collected_product_with_details.Dimension_CM_CUBIC}',
        Description = '${sorted_collected_product_with_details.Description}',
        Color = '${sorted_collected_product_with_details.Color}',
        Brand = '${sorted_collected_product_with_details.Brand}',
        Made_From = '${sorted_collected_product_with_details.Made_From}',
        GroupBuy_SellQuantity = '${sorted_collected_product_with_details.GroupBuy_SellQuantity}',
        GroupBuy_SellPrice = '${sorted_collected_product_with_details.GroupBuy_SellPrice}',
        Marketing_1_Price = '${sorted_collected_product_with_details.Marketing_1_Price}',
        Marketing_2_Price = '${sorted_collected_product_with_details.Marketing_2_Price}',
        Sold_Price = '${sorted_collected_product_with_details.Sold_Price}',
        Tokopedia_Price = '${sorted_collected_product_with_details.Tokopedia_Price}',
        Shopee_Price = '${sorted_collected_product_with_details.Shopee_Price}',
        Bekasi_Store_Price = '${sorted_collected_product_with_details.Bekasi_Store_Price}',
        Weight_KG = '${sorted_collected_product_with_details.Weight_KG}',
        Dimension_CM_CUBIC = '${sorted_collected_product_with_details.Dimension_CM_CUBIC}'
        WHERE Product_Code = '${sorted_collected_product_with_details.Product_Code}';`;
        con.query(sql, function(err, result) {
            if (err) {
                console.log("== FAIL UPDATE TO vtportal.product_data_accurate in update_product_in_json_to_mysql ==");
                console.log(err);
            }
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
            Unit,
            Category,
            GroupBuy_Purchase,
            Categorize_NEW,
            Mandarin_Name,
            Specification,
            Subcategory,
            Remark,
            Description,
            Color,
            Brand,
            Made_From,
            GroupBuy_SellQuantity,
            GroupBuy_SellPrice,
            Marketing_1_Price,
            Marketing_2_Price,
            Sold_Price,
            Tokopedia_Price,
            Shopee_Price,
            Bekasi_Store_Price,
            Weight_KG,
            Dimension_CM_CUBIC
        ) values 
        ('${sorted_collected_product_with_details.Product_Code}'
        , '${sorted_collected_product_with_details.Name}'
        , '${sorted_collected_product_with_details.Sell_Price}'
        , '${sorted_collected_product_with_details.Quantity}'
        , '${sorted_collected_product_with_details.Unit}'
        , '${sorted_collected_product_with_details.Category_Name}'
        , '${sorted_collected_product_with_details.GroupBuy_Purchase}',
        '${sorted_collected_product_with_details.Categorize_NEW}',
        '${sorted_collected_product_with_details.Mandarin_Name}',
        '${sorted_collected_product_with_details.Specification}',
        '${sorted_collected_product_with_details.Subcategory}',
        '${sorted_collected_product_with_details.Dimension_CM_CUBIC}',
        '${sorted_collected_product_with_details.Description}',
        '${sorted_collected_product_with_details.Color}',
        '${sorted_collected_product_with_details.Brand}',
        '${sorted_collected_product_with_details.Made_From}',
        '${sorted_collected_product_with_details.GroupBuy_SellQuantity}',
        '${sorted_collected_product_with_details.GroupBuy_SellPrice}',
        '${sorted_collected_product_with_details.Marketing_1_Price}',
        '${sorted_collected_product_with_details.Marketing_2_Price}',
        '${sorted_collected_product_with_details.Sold_Price}',
        '${sorted_collected_product_with_details.Tokopedia_Price}',
        '${sorted_collected_product_with_details.Shopee_Price}',
        '${sorted_collected_product_with_details.Bekasi_Store_Price}',
        '${sorted_collected_product_with_details.Weight_KG}',
        '${sorted_collected_product_with_details.Dimension_CM_CUBIC}'
        );`;
        con.query(sql, function(err, result) {
            if (err) {
                console.log("== FAIL insert TO vtportal.product_data_accurate in update_product_in_json_to_mysql ==");
                console.log(err);
            }
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
                if (error) {
                    console.log(error);
                }else {
                    if (response != undefined || response != null) {
                        var result = JSON.parse(await response.body);
                        if (result != undefined && result.sp != undefined) {
                            pageCount = result.sp.pageCount;
                            if (pageCount != undefined) {
                                resolve(pageCount);
                            } else {
                                console.log("Bad pagecount in ======= collecting_all_products_from_accurate()");
                                resolve(await collecting_all_products_from_accurate());
                            }
                        } else {
                            console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING product LIST");
                            resolve(await collecting_all_products_from_accurate());
                        }
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
                resolve(await requesting_product_ids_from_accurate(pageFlipper));
            }else{
                if(response != undefined){
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
                            resolve(await requesting_product_ids_from_accurate(pageFlipper));
                        };
                        if (response != undefined || response != null) {
                            var result = JSON.parse(await response.body);
                            var i = 0;
                            var responseArray = [];
                            for (i; i < result.d.length; i++) {
                                responseArray.push(result.d[i].id);
                            }
                            resolve(responseArray);
                        }else{
                            console.log(`requesting_product_ids_from_accurate(pageFlipper) FAIL /item/list.do?sp.page == ${response}`);
                            resolve(await requesting_product_ids_from_accurate(pageFlipper));
                        }
                    });
                }else{
                    console.log(`requesting_product_ids_from_accurate(pageFlipper) FAIL == ${response}`);
                    resolve(await requesting_product_ids_from_accurate(pageFlipper));
                }
            }   
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
                            Unit: result.d.unit1Name,
                            Category_Name: result.d.itemCategory.name,
                            // custom fields
                            GroupBuy_Purchase: result.d.charField1,
                            Categorize_NEW: result.d.charField2,
                            Mandarin_Name: result.d.charField3,
                            Specification: result.d.charField4,
                            Subcategory: result.d.charField5,
                            Dimension_CM_CUBIC: result.d.charField6,
                            Description: result.d.charField7,
                            Color: result.d.charField8,
                            Brand: result.d.charField9,
                            Made_From: result.d.charField10,
                            GroupBuy_SellQuantity: result.d.numericField1,
                            GroupBuy_SellPrice: result.d.numericField2,
                            Marketing_1_Price: result.d.numericField3,
                            Marketing_2_Price: result.d.numericField4,
                            Sold_Price: result.d.numericField5,
                            Tokopedia_Price: result.d.numericField6,
                            Shopee_Price: result.d.numericField7,
                            Bekasi_Store_Price: result.d.numericField8,
                            Weight_KG: result.d.numericField9,
                            itemType: result.d.itemType,
                            accurate_special_id_for_product: result.d.id
                            // Dimension_CM_CUBIC: result.d.numericField10,
                        });
                    }else{
                        console.log("result.d = undefined | requesting_product_details_based_on_id_from_accurate");
                        resolve(await requesting_product_details_based_on_id_from_accurate(id));
                    }
                }else{
                    console.log("FAILED TO GET PRODUCT DETAILS == requesting_product_details_based_on_id_from_accurate");
                    resolve(await requesting_product_details_based_on_id_from_accurate(id));
                }
            });
        });
    });
}

// setInterval(async () => {
//     var options = {
//         'method': 'GET',
//         'url': 'http://localhost:5002/back-up-products-from-accurate-t0-product-management',
//         'headers': {}
//     };
//     request(options, function(error, response) {
//         if (error) throw new Error(error);
//         console.log("back-up-products-from-accurate-t0-product-management === done");
//     });
// }, 3.6e+6);

app.get('/back-up-products-from-accurate-t0-product-management', async(req, res) => { 
    res.send(
        await get_products_in_product_data_accurate()
    );
})

const get_products_in_product_data_accurate = async() => {
    return new Promise(async resolve => {
        var sql = `select * from vtportal.product_data_accurate ;`;
        con.query(sql, async function(err, result) {
            if (err) {
                console.log("== FAIL get_products_in_product_data_accurate ==");
                console.log(err);
                resolve(await get_products_in_product_data_accurate());
            }else{
                var i = 0;
                for(i ; i < result.length; i ++){
                    if(
                        await check_product_in_product_management(result[i]).then(async value => {
                            return await value;
                        })
                    ){
                        if(await update_product_in_product_management(result[i]).then(async value => {
                            return await value;
                        })){
                            console.log("== SUCCESS update_product_in_product_management == " + result[i].Product_Code);
                        }else{
                            console.log("== FAIL update_product_in_product_management == " + result[i].Product_Code);
                        }
                    }else{
                        if(await add_product_in_product_management(result[i]).then(async value => {
                            return await value;
                        })){
                            console.log("== SUCCESS add_product_in_product_management == " + result[i].Product_Code);
                        }else{
                            console.log("== FAIL add_product_in_product_management == " + result[i].Product_Code);
                        }
                    }
                }
                resolve(true);
            }
        });
    });
}

const check_product_in_product_management = async(product) => {
    return new Promise(async resolve => {
        if(product.Product_Code != undefined){
                var sql = `select count(*) as found from vtportal.product_management WHERE Product_Code='${product.Product_Code}';`;
            con.query(sql, async function(err, result) {
                if (err) {
                    console.log("== FAIL check_product_in_product_management ==");
                    console.log(err);
                    resolve(await check_product_in_product_management(product));
                }else{
                    if(result[0].found > 0){
                        resolve(true);
                    }else{
                        resolve(false);
                    }
                }
            });
        }else{
            resolve(false);
        }
    });
}

const update_product_in_product_management = async(product) => {
    return new Promise(async resolve => {
        // product.Sell_Price
        if(product.Name != undefined
            && product.Specification != undefined
            && product.Description != undefined
            ){
                if(product.GroupBuy_Purchase != undefined){
                    if(product.GroupBuy_Purchase.toUpperCase().includes("YES")){
                        product.GroupBuy_Purchase = "true";
                    }else if(product.GroupBuy_Purchase.toUpperCase().includes("NO")){
                        product.GroupBuy_Purchase = "false";
                    }
                }

                var sql = `UPDATE vtportal.product_management
            SET Name='${product.Name.replace('\'', '')}'
            , Specification='${product.Specification.replace('\'', '')}'
            , Description='${product.Description.replace('\'', '')}'
            , Sell_Price='${product.Sold_Price}'
            , Unit='${product.Unit}'
            , Category='${product.Category}'
            , Subcategory='${product.Subcategory}'
            , Color='${product.Color}'
            , Brand='${product.Brand}'
            , GroupBuy_Purchase='${product.GroupBuy_Purchase}'
            , GroupBuy_SellPrice='${product.GroupBuy_SellPrice}'
            , GroupBuy_SellQuantity='${product.GroupBuy_SellQuantity}'
            , In_Store_Price='${product.In_Store_Price}'
            , Categorize_NEW='${product.Categorize_NEW}'
            , Last_Updated=CURRENT_TIMESTAMP
            , Update_date=CURRENT_TIMESTAMP
            , Weight_KG='${product.Weight_KG}'
            , Dimension_CM_CUBIC='${product.Dimension_CM_CUBIC}'
            , Stock_Quantity='${product.Quantity}'
            , tokopedia_price='${product.Tokopedia_Price}'
            , shopee_price='${product.Shopee_Price}'
            WHERE Product_Code='${product.Product_Code}';
            `;
            con.query(sql, async function(err, result) {
                if (err) {
                    console.log("== FAIL update_product_in_product_management ==");
                    console.log(err);
                    resolve(await update_product_in_product_management());
                }else{
                    resolve(true);
                }
            });
        }else{
            resolve(false);
        }
    });
}

const add_product_in_product_management = async(product) => {
    return new Promise(async resolve => {
        // console.log(product);
        if(product.Name != undefined
            && product.Specification != undefined
            && product.Description != undefined
            && product.Quantity != undefined
            ){
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
                GroupBuy_Purchase,
                GroupBuy_SellPrice,
                GroupBuy_SellQuantity,
                In_Store_Price,
                Categorize_NEW,
                Last_Updated,
                Weight_KG,
                Dimension_CM_CUBIC,
                Stock_Quantity,
                tokopedia_price,
                shopee_price
                )
                VALUES(
                    '${product.Product_Code}',
                    '${product.Name.replace('\'', '')}',
                    '${product.Specification.replace('\'', '')}',
                    '${product.Description.replace('\'', '')}',
                    '${product.Sell_Price}',
                    '${product.Unit}',
                    '${product.Category}',
                    '${product.Subcategory}',
                    '${product.Color}',
                    '${product.Brand}',
                    '${product.GroupBuy_Purchase}',
                    '${product.GroupBuy_SellPrice}',
                    '${product.GroupBuy_SellQuantity}',
                    '${product.In_Store_Price}',
                    '${product.Categorize_NEW}',
                    '${product.Last_Updated}',
                    '${product.Weight_KG}',
                    '${product.Dimension_CM_CUBIC}',
                    '${product.Quantity}',
                    '${product.tokopedia_price}',
                    '${product.shopee_price}'
                );
            `;
            con.query(sql, async function(err, result) {
                if (err) {
                    console.log("== FAIL add_product_in_product_management ==");
                    console.log(err);
                    resolve(await add_product_in_product_management());
                }else{
                    console.log("== success add_product_in_product_management ==");
                    resolve(true);
                }
            });
        }else{
            resolve(false);
        }
    });
}

/*
    API to get products in Accurate
*/
app.get('/get-all-products-in-accurate', async(req, res) => {
    var page = req.query.page;
    if(page == undefined){
        page = 1;
    }
    var collected_product_ids = [];
    collected_product_ids = collected_product_ids.concat(
        await requesting_product_ids_from_accurate(page).then(async value => {
            return await value;
        })
    );
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
    res.send(
        collected_product_details
    );
})

app.post('/add-or-edit-a-product-in-accurate', async(req, res) => {
    var product = req.body.product;
    res.send(await update_andor_product_in_accurate_based_on_id(product).then(async value => {
        return await value;
    }))
})

async function update_andor_product_in_accurate_based_on_id(product){
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {}
    };
    return new Promise(async resolve => {
        await request(options, async function(error, response) {
            var credentials = JSON.parse(await response.body);
            options = {
                'method': 'POST',
                'url': `https://public.accurate.id/accurate/api/item/save.do?itemType=${product.itemType}&name=${product.Name}&no=${product.Product_Code}&notes=${product.notes}&itemCategoryName=${product.Category_Name}&unitPrice=${product.Marketing_1_Price}&vendorPrice=${product.Buy_Price}&id=${product.accurate_special_id_for_product}&charField1=${product.GroupBuy_Purchase}&charField2=${product.Categorize_NEW}&charField3=${product.Mandarin_Name}&charField4=${product.Specification}&charField5=${product.Subcategory}&charField6=${product.Dimension_CM_CUBIC}&charField7=${product.Description}&numericField1=${product.GroupBuy_SellQuantity}&numericField2=${product.GroupBuy_SellPrice}&numericField3=${product.Marketing_1_Price}&numericField4=${product.Marketing_2_Price}&numericField5=${product.Sold_Price}&numericField6=${product.Tokopedia_Price}&numericField7=${product.Shopee_Price}&numericField8=${product.Bekasi_Store_Price}&numericField9=${product.Weight_KG}`,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            await request(options, async function (error, response) {
                if (error) {
                    console.log(error);
                    resolve(
                        {
                            "s": false,
                            "d": [
                                "failing to send request via Accurate's API (POST) | https://public.accurate.id/accurate/api/item/save.do"
                            ]
                        }
                    );
                }else{
                    resolve(JSON.parse(response.body));
                }
            });
        });
    })
}



app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
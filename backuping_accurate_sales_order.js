process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
var request = require('request');
var mysql = require('mysql');
const e = require('express');
var request = require('request');
const app = express();
const port = 5002;// 5002
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

var accesstoken = "";
var refreshtoken = "42cdadbb-5359-4184-a7f5-9c71e7f452bf";
var sessionid = "";

const get_latest_recorded_token = async () => {
    // return new Promise(async resolve => {
    //     console.log(refreshtoken);
    //     var options = {
    //         'method': 'POST',
    //         'url': 'https://account.accurate.id/oauth/token?grant_type=refresh_token&refresh_token=' + refreshtoken,
    //         'headers': {
    //         'Authorization': 'Basic ZTI3MTQzYTktNmU4NC00MGE0LTlhYmUtNGQ1NzM2YzZlNDdkOmYxOGU2ZjRiMjE5NTUwNWFiZjZjMWZmOTZlOTJlZDY3'
    //         }
    //     };
    //     console.log(options.url);
    //     await request(options, async function (error, response) {
    //         if (error) {
    //             console.log(error);
    //         }else{
    //             console.log(response.access_token);
    //             console.log(accesstoken);
    //             accesstoken = response.access_token;
    //             refreshtoken = response.refresh_token;
    //             console.log(accesstoken);
    //             var options = {
    //                 'method': 'GET',
    //                 'url': 'https://account.accurate.id/api/open-db.do?id=300600',
    //                 'headers': {
    //                 'Authorization': 'Bearer ' + response.access_token
    //                 }
    //             };
    //             await request(options, async function (error, response) {
    //                 if (error) {
    //                     console.log(error);   
    //                 }else{
    //                     sessionid = response.session;
    //                     console.log({
    //                         access_token: accesstoken,
    //                         session_id: sessionid
    //                     });
    //                     resolve({
    //                         access_token: accesstoken,
    //                         session_id: sessionid
    //                     });
    //                 }
    //             });
    //         }
    //     });
    // });
    return new Promise(async resolve => {
        resolve({
            access_token: "3c9010b2-d729-45a3-a96e-648714e1ae11",
            session_id: "1426efb4-a4a9-4ae4-aa91-55e4adaeca82"
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

app.get('/get-all-sales-order-details',  async (req, res) => {
    var  collected_sales_order_ids = [];
    var total_page = await collecting_all_sales_orders_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for(current_page; current_page <= total_page; current_page++){//total_page
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

    var sorted_collected_sales_order_with_details = [];
    var current_id = 0;
    for(current_id; current_id < collected_sales_order_details.length; current_id++){
        await sort_sales_order_with_details(sorted_collected_sales_order_with_details, collected_sales_order_details[current_id]).then(async value => {
            return await value;
        })
    }
    console.log("=========================================================================================");
    var current_id = 0;
    for(current_id; current_id < sorted_collected_sales_order_with_details.length; current_id++){
        if(await check_if_sales_order_has_existed_in_MYSQL(sorted_collected_sales_order_with_details[current_id].sales_order_number).then(async value => {
            return await value;
        })){
            console.log("current_id = " + current_id);
            if(await update_sales_order_in_json_to_mysql(sorted_collected_sales_order_with_details[current_id]).then(async value => {
                return await value;
            })){
                console.log("udpate successfully in mysql");
            }
        }else{
            console.log("current_id = " + current_id);
            if(await insert_sales_order_in_json_to_mysql(sorted_collected_sales_order_with_details[current_id]).then(async value => {
                return await value;
            })){
                console.log("insert successfully in mysql");
            }
        }
    }
    res.send(
        sorted_collected_sales_order_with_details
    );
})

async function check_if_sales_order_has_existed_in_MYSQL(so_number){
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.sales_order_list_accurate where so_number = '${so_number}';`;
        // console.log(sql);
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
            }else{
                if(result[0].total_found > 0){
                    resolve(true);
                }else{
                    resolve(false);
                }
            }
        });
    });
}

const update_sales_order_in_json_to_mysql = async (sorted_collected_sales_order_with_details) => {
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
        if(sorted_collected_sales_order_with_details.contact_number == null){
            contactNumber = `${sorted_collected_sales_order_with_details.workPhone}`;
        }else{
            contactNumber = `${sorted_collected_sales_order_with_details.contact_number} / ${sorted_collected_sales_order_with_details.workPhone}`;
        }
        var sql = `UPDATE vtportal.sales_order_list_accurate SET 
        order_date = '${year + "-" + month + "-" + day}'
        , period_date = '${yearPeriod + "-" + monthPeriod + "-" + dayPeriod}'
        , payment_method = '${sorted_collected_sales_order_with_details.payment_method}'
        , customer_name = '${sorted_collected_sales_order_with_details.customer_name}'
        , customer_code = '${sorted_collected_sales_order_with_details.customer_code}'
        , salesman = '${sorted_collected_sales_order_with_details.salesman}'
        , delivery_address = '${sorted_collected_sales_order_with_details.delivery_address}'
        , total_quantities = ${sorted_collected_sales_order_with_details.total_quantities}
        , total_amount = '${sorted_collected_sales_order_with_details.total_amount}'
        , status = '232314'
        , deleted = 'DEV'
        , contact_number = '${contactNumber}'
        WHERE so_number = '${sorted_collected_sales_order_with_details.sales_order_number}';`;
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
        });
        var x = 0;
        for(x ; x < sorted_collected_sales_order_with_details.order_details.length; x++){
            await update_order_details(sorted_collected_sales_order_with_details, x);
        }
        resolve(true);
    });
}

async function update_order_details(sorted_collected_sales_order_with_details, x){
    var sql = `UPDATE vtportal.sales_order_details_accurate SET 
    name = '${sorted_collected_sales_order_with_details.order_details[x].name}'
    , quantity_bought = '${sorted_collected_sales_order_with_details.order_details[x].quantity_bought}'
    , price_per_unit = '${sorted_collected_sales_order_with_details.order_details[x].price_per_unit}'
    , total_price = '${sorted_collected_sales_order_with_details.order_details[x].total_price_based_on_quantity}'
    WHERE so_number = '${sorted_collected_sales_order_with_details.sales_order_number}'
    and product_code = '${sorted_collected_sales_order_with_details.order_details[x].product_code}';`;
    await con.query(sql, async function (err, result) {
        if (err) {
            console.log(err);
            await update_order_details(sorted_collected_sales_order_with_details, i , x);
        }
    });
}

const insert_sales_order_in_json_to_mysql = async (sorted_collected_sales_order_with_details) => {
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
        if(sorted_collected_sales_order_with_details.contact_number == null){
            contactNumber = `${sorted_collected_sales_order_with_details.workPhone}`;
        }else{
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
        con.query(sql, function (err, result) {
            if (err) console.log(err);
        });
        var x = 0;
        for(x ; x < sorted_collected_sales_order_with_details.order_details.length; x++){
            insertOrderDetails(sorted_collected_sales_order_with_details, x);
        }
        resolve(true);
    });
}

async function insertOrderDetails(sorted_collected_sales_order_with_details, x){
    setTimeout(() => {
        var thedate = new Date();
        var uniqueCode = 
            (
            (Math.floor((Math.random() * 10) + 1)*2) +
            (Math.floor((Math.random() * 20) + 11)*3) +
            (Math.floor((Math.random() * 30) + 21)*4) +
            (Math.floor((Math.random() * 40) + 31)*5) +
            (Math.floor((Math.random() * 50) + 41)*6) +
            (Math.floor((Math.random() * 60) + 51)*7) +
            (Math.floor((Math.random() * 70) + 61)*8) +
            (Math.floor((Math.random() * 80) + 71)*9) +
            (Math.floor((Math.random() * 90) + 81)*10) +
            (Math.floor((Math.random() * 100) + 91)*11) +
            (Math.floor((Math.random() * 110) + 101)*12) +
            (Math.floor((Math.random() * 210) + 201)*13) +
            (Math.floor((Math.random() * 310) + 301)*14) +
            (Math.floor((Math.random() * 410) + 401)*15) +
            (Math.floor((Math.random() * 510) + 501)*16) +
            (Math.floor((Math.random() * 610) + 601)*17) +
            (Math.floor((Math.random() * 710) + 701)*18) +
            (Math.floor((Math.random() * 810) + 801)*19) +
            (Math.floor((Math.random() * 910) + 901)*20) +
            (Math.floor((Math.random() * 1010) + 1001)*21) +
            (Math.floor((Math.random() * 1110) + 1101)*22) +
            (Math.floor((Math.random() * 1210) + 1201)*23) +
            (Math.floor((Math.random() * 1310) + 1301)*24)
            ) * (Math.floor((Math.random() * 10) + 1)*2) * (Math.floor((Math.random() * 7) + 1)*7) + thedate.getMilliseconds()
        ;
        var sql = `insert into vtportal.sales_order_details_accurate values 
        ('${sorted_collected_sales_order_with_details.sales_order_number}'
        , '${sorted_collected_sales_order_with_details.order_details[x].name}'
        , '${sorted_collected_sales_order_with_details.order_details[x].product_code}'
        , '${sorted_collected_sales_order_with_details.order_details[x].quantity_bought}'
        , '${sorted_collected_sales_order_with_details.order_details[x].price_per_unit}'
        , '${sorted_collected_sales_order_with_details.order_details[x].total_price_based_on_quantity}'
        , '${uniqueCode}'
        );`;
        con.query(sql, function (err, result) {
            if (err) console.log(err);
        });
    }, 100);
}

async function collecting_all_sales_orders_from_accurate(){
    var pageFlipper = 1;
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session'
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
        'url': 'http://localhost:5002/get-lastest-token-and-session',
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
        'url': 'http://localhost:5002/get-lastest-token-and-session',
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
                    var totalQuantities = 0;
                    if(result.d != undefined ){
                        if(result.d.detailItem != undefined ){
                            for(u; u < result.d.detailItem.length; u ++){
                                totalQuantities = totalQuantities + result.d.detailItem[u].quantityDefault;
                                detailItem.push({
                                    name : result.d.detailItem[u].item.name,
                                    product_code : result.d.detailItem[u].item.no,
                                    quantity_bought : result.d.detailItem[u].quantityDefault,
                                    price_per_unit : result.d.detailItem[u].availableUnitPrice,
                                    total_price_based_on_quantity : result.d.detailItem[u].totalPrice
                                });
                            }
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
                        }
                    }
                }
            });
        });
    });
}

async function sort_sales_order_with_details(sorted_collected_sales_order_with_details, sales_order_with_details){
    // return new Promise(async resolve => {
        if(sales_order_with_details.approval_status != undefined){
            if(sales_order_with_details.approval_status.toUpperCase() == "APPROVED"){
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
    Customer Back up
*/

app.get('/get-all-customer-details',  async (req, res) => {
    var  collected_customer_ids = [];
    var total_page = await collecting_all_customers_from_accurate().then(async value => {
        return await value;
    });
    var current_page = 1;
    for(current_page; current_page <= 1; current_page++){//total_page
        console.log("loading ids from Accurate to array : " + current_page);
        collected_customer_ids = collected_customer_ids.concat(
            await requesting_customer_ids_from_accurate(current_page, total_page).then(async value => {
                return await value;
            })
        );
    }
    var collected_customer_details = [];
    var current_id = 0;
    for(current_id; current_id < collected_customer_ids.length; current_id++){
        console.log("loading details based on id from Accurate to array : " + current_id);
        collected_customer_details.push(
            await requesting_customer_details_based_on_id_from_accurate(collected_customer_ids[current_id]).then(async value => {
                return await value;
            })
        );
    }
    console.log("=========================================================================================");
    var current_id = 0;
    for(current_id; current_id < collected_customer_details.length; current_id++){
        if(await check_if_customer_has_existed_in_MYSQL(collected_customer_details[current_id].customer_no).then(async value => {
            return await value;
        })){
            console.log("current_id = " + current_id);
            if(await update_customer_in_json_to_mysql(collected_customer_details[current_id]).then(async value => {
                return await value;
            })){
                console.log("udpate successfully in mysql");
            }
        }else{
            console.log("current_id = " + current_id);
            if(await insert_customer_in_json_to_mysql(collected_customer_details[current_id]).then(async value => {
                return await value;
            })){
                console.log("insert successfully in mysql");
            }
        }
    }
    res.send(
        collected_customer_details
    );
})

async function check_if_customer_has_existed_in_MYSQL(customer_no){
    return new Promise(async resolve => {
        var sql = `select count(*) as total_found from vtportal.customer_list_accurate where customer_no = '${customer_no}';`;
        // console.log(sql);
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
            }else{
                if(result[0].total_found > 0){
                    resolve(true);
                }else{
                    resolve(false);
                }
            }
        });
    });
}

const update_customer_in_json_to_mysql = async (sorted_collected_customer_with_details) => {
    var i = 0;
    return new Promise(async resolve => {
        var thedate = new Date(sorted_collected_customer_with_details.create_date);
        var day = thedate.getDate().toString();
        var month = (thedate.getMonth() + 1).toString();
        var year = thedate.getUTCFullYear().toString();
        var theSubmittedDate = year + "-" + month + "-" + day;
        if(theSubmittedDate == 'NaN-NaN-NaN'){
            theSubmittedDate = '1971-01-01';
        }
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
        con.query(sql, function (err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

const insert_customer_in_json_to_mysql = async (sorted_collected_customer_with_details) => {
    var i = 0;
    return new Promise(async resolve => {
        var thedate = new Date(sorted_collected_customer_with_details.create_date);
        var day = thedate.getDate().toString();
        var month = (thedate.getMonth() + 1).toString();
        var year = thedate.getUTCFullYear().toString();
        var theSubmittedDate = year + "-" + month + "-" + day;
        if(theSubmittedDate == 'NaN-NaN-NaN'){
            theSubmittedDate = '1971-01-01';
        }
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
        con.query(sql, function (err, result) {
            if (err) console.log(err);
        });
        resolve(true);
    });
}

async function collecting_all_customers_from_accurate(){
    var pageFlipper = 1;
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session'
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
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
                        console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING CUSTOMER LIST");
                    }
                }
            });
        });
    });
}

async function requesting_customer_ids_from_accurate(pageFlipper){
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {
        }
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
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
            await request(options, async function (error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_customer_ids_from_accurate(id));
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

async function requesting_customer_details_based_on_id_from_accurate(id){
    console.log("saving data to MEM -> " + id);
    options = {
        'method': 'GET',
        'url': 'http://localhost:5002/get-lastest-token-and-session',
        'headers': {
        }
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
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
            await request(options, async function (error, response) {
                if (error) {
                    console.log(error);
                    resolve(await requesting_customer_details_based_on_id_from_accurate(id));
                }
                if(response != undefined || response != null){
                    result = JSON.parse(await response.body);
                    var u = 0;
                    if(result.d != undefined ){
                        if(!result.d.suspended){
                            if(result.d.salesman != null){
                                if(result.d.detailContact.length > 0){
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
                                }else{
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
                            }else{
                                if(result.d.detailContact.length > 0){
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
                                }else{
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

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
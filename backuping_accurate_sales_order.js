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
            if (err) await console.log(err);
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

app.get('/get-all-sales-order-details',  async (req, res) => {
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

const save_sales_order_in_json_to_mysql = async (collected_sales_order_details) => {
    var i = 0;
    return new Promise(async resolve => {
        for(i ; i < collected_sales_order_details.length ; i++){
            var thedate = new Date(sorted_out_saved_sales_order_id_list_with_details[i].order_date);
            var day = thedate.getDate().toString();
            var month = (thedate.getMonth() + 1).toString();
            var year = thedate.getUTCFullYear().toString();
            thedate.setDate(thedate.getDate() + sorted_out_saved_sales_order_id_list_with_details[i].period_date);
            var dayPeriod = thedate.getDate().toString();
            var monthPeriod = (thedate.getMonth() + 1).toString();
            var yearPeriod = thedate.getUTCFullYear().toString();
            var contactNumber;
            if(sorted_out_saved_sales_order_id_list_with_details[i].contact_number == null){
                contactNumber = `${sorted_out_saved_sales_order_id_list_with_details[i].workPhone}`;
            }else{
                contactNumber = `${sorted_out_saved_sales_order_id_list_with_details[i].contact_number} / ${sorted_out_saved_sales_order_id_list_with_details[i].workPhone}`;
            }
            var sql = `UPDATE vtportal.sales_order_list_accurate SET 
            order_date = '${year + "-" + month + "-" + day}'
            , period_date = '${yearPeriod + "-" + monthPeriod + "-" + dayPeriod}'
            , payment_method = '${collected_sales_order_details[i].payment_method}'
            , customer_name = '${collected_sales_order_details[i].customer_name}'
            , customer_code = '${collected_sales_order_details[i].customer_code}'
            , salesman = '${collected_sales_order_details[i].salesman}'
            , delivery_address = '${collected_sales_order_details[i].delivery_address}'
            , total_quantities = ${collected_sales_order_details[i].total_quantities}
            , total_amount = '${collected_sales_order_details[i].total_amount}'
            , status = '232314'
            , deleted = 'DEV'
            , contact_number = '${contactNumber}'
            WHERE so_number = '${collected_sales_order_details[i].sales_order_number}';`;
            await con.query(sql, async function (err, result) {
                if (err) await console.log(err);
            });
            var x = 0;
            for(x ; x < collected_sales_order_details[i].order_details.length; x++){
                await update_order_details(collected_sales_order_details, i , x);
            }
        }
        resolve(true);
    });
}

async function update_order_details(collected_sales_order_details, i , x){
    var sql = `UPDATE vtportal.sales_order_details_accurate SET 
    name = '${collected_sales_order_details[i].order_details[x].name}'
    , quantity_bought = '${collected_sales_order_details[i].order_details[x].quantity_bought}'
    , price_per_unit = '${collected_sales_order_details[i].order_details[x].price_per_unit}'
    , total_price = '${collected_sales_order_details[i].order_details[x].total_price_based_on_quantity}'
    WHERE so_number = '${collected_sales_order_details[i].sales_order_number}'
    and product_code = '${collected_sales_order_details[i].order_details[x].product_code}';`;
    await con.query(sql, async function (err, result) {
        if (err) console.log(err);
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
                                order_details: orderDetailsArray
                            });
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
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
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var fs = require('fs');
var busboy = require('connect-busboy');
const express = require('express');
const cors = require('cors');
const xlsx = require('node-xlsx');
var request = require('request');
var mysql = require('mysql');
const e = require('express');
const { CONNREFUSED } = require('dns');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
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
        // console.log(err);
        handle_disconnect();
    }else{
        // console.log("Connected! to MySQL");
    }
});

con.on('error', function(err) {
    // console.log('MySQL error | ', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        handle_disconnect();
    } else {
        throw err;
    }
});

app.post('/get-random-free-item',  async (req, res) => {
    let items = ['test1', 'test2', 'test3', 'test4', 'test5'];
    let fake_items = [];
    let i = 0;
    for(i ; i < 200; i++){
        fake_items.push("0");
    }
    let combined_fake_and_original_item = items.concat(fake_items);
    let lucky_index = Math.floor(Math.random() * combined_fake_and_original_item.length);
    if(
        combined_fake_and_original_item[lucky_index] != "0"
    ){
        res.send({
            status: "sorry",
            item: combined_fake_and_original_item[lucky_index]
        });
    }else{
        res.send({
            status: "congratulation",
            item: combined_fake_and_original_item[lucky_index]
        });
    }
})

app.post('/get-random-coupon',  async (req, res) => {
    res.send(
        await get_random_coupon().then(async value => {
            return await value;
        })
    );
})

async function get_random_coupon(){
    return new Promise(async resolve => {
        var sql = "";
        sql = `
            select 
            *
            from vtportal.product_management pm 
            where Coupon_Discount != 'NOCOUPON';
        `;
        // console.log(sql);
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(await redeem_coupon(Coupon_Discount, Product_Code));
            }else{
                if(result.length > 0){
                    // console.log(result[0].Coupon_Discount);
                    resolve(result[0]);
                }else{
                    resolve(false);
                }
            }
        });
    })
}

app.post('/redeem-coupon',  async (req, res) => {
    var Coupon_Discount = req.query.Coupon_Discount;
    var Product_Code = req.query.Product_Code;
    if(Coupon_Discount != undefined){
        res.send(
            await redeem_coupon(Coupon_Discount, Product_Code).then(async value => {
                return await value;
            })
        );
    }else{
        res.send(
            false
        );
    }
})

async function redeem_coupon(Coupon_Discount, Product_Code){
    return new Promise(async resolve => {
        var sql = "";
        sql = `
            select 
            Coupon_Discount
            , Coupon_Discount_Precentage
            , Product_Code 
            from vtportal.product_management pm 
            where Product_Code = '${Product_Code}' and Coupon_Discount = '${Coupon_Discount}';
        `;
        // console.log(sql);
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(await redeem_coupon(Coupon_Discount, Product_Code));
            }else{
                if(result.length > 0){
                    // console.log(result[0].Coupon_Discount);
                    if(result[0].Coupon_Discount == Coupon_Discount){
                        // console.log(result[Math.floor(Math.random() * (result.length-1))].Coupon_Discount_Precentage);
                        resolve(result[Math.floor(Math.random() * (result.length-1))].Coupon_Discount_Precentage);
                    }else{
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    })
}

app.post('/get_user_comment',  async (req, res) => {
    var Product_Code = req.query.Product_Code;
    // // console.log("send_delivery_order_to_tiki ================ send_delivery_order_to_tiki");
    if(Product_Code != undefined){
        res.send(
            await get_user_comment(Product_Code).then(async value => {
                    return await value;
            })
        );
    }else{
        res.send(
            false
        );
    }
})

app.post('/send_user_comment',  async (req, res) => {
    var User_Comments = req.body.User_Comments;
    // console.log(User_Comments);
    // // console.log("send_delivery_order_to_tiki ================ send_delivery_order_to_tiki");
    if(User_Comments != undefined){
        if(
            User_Comments.Customer_Code != undefined && User_Comments.Comment != undefined && User_Comments.Product_Code != undefined
        ){
            res.send(
                await add_user_comment(User_Comments).then(async value => {
                    return await value;
                })
            );
        }else{
            res.send(
                false
            );
        }
    }else{
        res.send(
            false
        );
    }
})

async function add_user_comment(User_Comments){
    return new Promise(async resolve => {
        var all_comments = await get_user_comment(User_Comments.Product_Code);
        // console.log(all_comments);
        if(all_comments.User_Comments != undefined){
            all_comments = JSON.parse(all_comments.User_Comments);
            all_comments.push({
                "Comment": User_Comments.Comment,
                "Customer_Code": User_Comments.Customer_Code
            });
        }else{
            all_comments = [
                {
                    "Comment": User_Comments.Comment,
                    "Customer_Code": User_Comments.Customer_Code
                }
            ]
        }
        // console.log(all_comments);
        var sql = "";
        sql = `
            UPDATE vtportal.product_management pm 
            set User_Comments = '${JSON.stringify(all_comments)}' 
            where Product_Code = '${User_Comments.Product_Code}';
        ;
        `;
        // console.log(sql);
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    })
}

async function get_user_comment(Product_Code){
    return new Promise(async resolve => {
        var sql = "";
        sql = `
            select User_Comments from vtportal.product_management pm
            where Product_Code = '${Product_Code}';
        ;
        `;
        // console.log(sql);
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(await get_user_comment(Product_Code));
            }else{
                resolve(result[0]);
            }
        });
    })
}

async function get_debug_mode_access_token_tiki(){
    return new Promise(async resolve => {
        var options = {
                'method': 'POST',
                'url': 'http://apis.mytiki.net:8321/user/auth',
                'headers': {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "username": "SOLDIGNUSA",
                "password": "11628528082735990090"
            })
        
        };
        await request(options, async function (error, response) {
            if (error) {
                resolve(await get_debug_mode_access_token_tiki());
            }else{
                if(response != undefined){
                    if(response.body != undefined){
                        try{
                            var result = JSON.parse(response.body);
                            resolve(result.response.token);
                        }catch(err) {
                            resolve(await get_debug_mode_access_token_tiki());
                        }
                    }else{
                        resolve(await get_debug_mode_access_token_tiki());
                    }
                }else{
                    resolve(await get_debug_mode_access_token_tiki());
                }
            }
        });
    })
}

async function get_access_token_tiki(){
    return new Promise(async resolve => {
        var options = {
            'method': 'POST',
            'url': 'http://apix.mytiki.net/user/auth',
            'headers': {
            'Content-Type': 'application/json'
            },
            body: JSON.stringify({
            "username": "17465228145926986946",
            "password": "5364a487b6972237f5460a135e5c932c8188b717"
            })
        
        };
        request(options, async function (error, response) {
            if (error) {
                // console.log(error);
                // console.log("fail to get token from tiki == get_access_token_tiki");
                resolve(await get_access_token_tiki());
            }else{
                // // console.log(response.body);
                if(response != undefined){
                    if(response.body != undefined){
                        try{
                            var result = JSON.parse(response.body);
                            resolve(result.response.token);
                        }catch(err) {
                            // console.log(err);
                            // console.log("fail to get token from tiki == get_access_token_tiki");
                            resolve(await get_access_token_tiki());
                        }
                    }else{
                        // console.log(err);
                        // console.log("fail to get token from tiki == get_access_token_tiki");
                        resolve(await get_access_token_tiki());
                    }
                }else{
                    // console.log(err);
                    // console.log("fail to get token from tiki == get_access_token_tiki");
                    resolve(await get_access_token_tiki());
                }
            }
        });
    })
}

app.post('/send_delivery_order_to_tiki_with_different_pick_up',  async (req, res) => {
    var json_from_ERP = req.body;
    if(json_from_ERP != undefined){
        res.send(
            await reorder_json_for_tiki_pick_up_supplier(json_from_ERP).then(async value => {
                return await value;
            })
        );
    }
})

async function reorder_json_for_tiki_pick_up_supplier(json_from_ERP){
    return new Promise(async resolve => {
        console.log("reorder_json_for_tiki_pick_up_supplier ====== reorder_json_for_tiki_pick_up_supplier");
        console.log(json_from_ERP);
        var accepted_by_tiki = 
        {
            "accnum": "CGK01TEST", // "SDI010000101",
            "paket_awb": "",
            "paket_id": json_from_ERP.paket_id_tiki_and_sold,
            "paket_service": json_from_ERP.chosen_paket_service,
            "paket_weight": json_from_ERP.total_paket_weight,
            "paket_volume_length": json_from_ERP.total_paket_volume_length,
            "paket_volume_width": json_from_ERP.total_paket_volume_width,
            "paket_volume_height": json_from_ERP.total_paket_volume_height,
            "paket_insurance": json_from_ERP.type_paket_insurance,
            "paket_value": json_from_ERP.total_price,
            "paket_content": json_from_ERP.string_of_all_product_names,
            "paket_cod": json_from_ERP.total_price_cod,
            "paket_cashless": json_from_ERP.paket_cashless,
            "paket_collect": "pickup_seller",
            "pickup_pic": json_from_ERP.pickup_pic, // new
            "pickup_company": json_from_ERP.pickup_company, // new
            "pickup_address1": json_from_ERP.pickup_address1, // new
            "pickup_address2": json_from_ERP.pickup_address2, // new
            "pickup_zipcode": json_from_ERP.pickup_zipcode, // new
            "pickup_phone": json_from_ERP.pickup_phone, // new
            "pickup_email": json_from_ERP.pickup_email, // new
            "pickup_latitude": "",
            "pickup_longitude": "",
            "consignor_name": json_from_ERP.sold_pic_name,
            "consignor_company": json_from_ERP.registered_company_name,
            "consignor_address1": json_from_ERP.registered_company_address,
            "consignor_address2": "",
            "consignor_zipcode": json_from_ERP.registered_company_zipcode,
            "consignor_phone": json_from_ERP.sold_pic_contact_number,
            "consignor_email": json_from_ERP.sold_pic_email,
            "consignee_name": json_from_ERP.customer_name,
            "consignee_company": json_from_ERP.customer_store_name,
            "consignee_address1": json_from_ERP.customer_address,
            "consignee_address2": "",
            "consignee_zipcode": json_from_ERP.customer_zipcode,
            "consignee_phone": json_from_ERP.customer_contact_number,
            "consignee_email": json_from_ERP.customer_email,
        };
        console.log(accepted_by_tiki);
        resolve(await send_delivery_order_to_tiki_with_pickup_request(accepted_by_tiki).then(async value => {
            return await value;
        }))
    })
}

async function send_delivery_order_to_tiki_with_pickup_request(body_json){
    return new Promise(async resolve => {
        var options = {
            'method': 'POST',
            'url': 'http://apis.mytiki.net:8321/v02/mde/manifestorder',
            'headers': {
                'content-type': 'application/json ',
                'x-access-token': await get_debug_mode_access_token_tiki()
            },
            body: JSON.stringify(body_json)
          
        };
        console.log(" ======================================= send_delivery_order_to_tiki_with_pickup_request(body_json) ======================================= ");
        console.log(options);
        console.log(" ======================================= send_delivery_order_to_tiki_with_pickup_request(body_json) ======================================= ");
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                console.log("send_delivery_order_to_tiki_with_pickup_request(body_json) ========== send_delivery_order_to_tiki_with_pickup_request(body_json)");
                resolve(false);
            }else{
                var result = JSON.parse(response.body);
                console.log(result);
                resolve(result);
            }
        });
    })
}

async function send_delivery_order_to_tiki(body_json){
    return new Promise(async resolve => {
        // console.log("You are calling the wrong API!!!!!!!!!!!!!!!!!!!!!!!");
        var json_to_be_sent;
        var options = {
            'method': 'POST',
            'url': 'http://apix.mytiki.net/v02/mde/manifestorder',
            'headers': {
              'content-type': 'application/json ',
              'x-access-token': await get_access_token_tiki()
            },
            body: JSON.stringify(body_json)
          
        };
        console.log(" ======================================= send_delivery_order_to_tiki(body_json) ======================================= ");
        console.log(body_json);
        console.log(options);
        console.log(" ======================================= send_delivery_order_to_tiki(body_json) ======================================= ");
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                console.log("send_delivery_order_to_tiki(body_json) ========== send_delivery_order_to_tiki(body_json)");
                // resolve(await send_delivery_order_to_tiki(body_json));
                resolve(false);
            }else{
                var result = JSON.parse(response.body);
                console.log(result);
                resolve(result);
            }
        });
    })
}

async function reorder_json_to_fit_tiki(json_from_ERP){
    return new Promise(async resolve => {
        // // console.log("reorder_json_to_fit_tiki ====== reorder_json_to_fit_tiki");
        // // console.log(json_from_ERP);
        // var delivery_address = await split_address(json_from_ERP.registered_company_address).then(async value => {
        //     return await value;
        // })
        var accepted_by_tiki = {
            "accnum": "SDI010000101", // json_from_ERP.account_number_with_tiki,
            "paket_awb": "",
            "paket_id": json_from_ERP.paket_id_tiki_and_sold,
            "paket_service": json_from_ERP.chosen_paket_service,
            "paket_weight": json_from_ERP.total_paket_weight,
            "paket_volume_length": json_from_ERP.total_paket_volume_length,
            "paket_volume_width": json_from_ERP.total_paket_volume_width,
            "paket_volume_height": json_from_ERP.total_paket_volume_height,
            "paket_insurance": json_from_ERP.type_paket_insurance,
            "paket_value": json_from_ERP.total_price,
            "paket_content": json_from_ERP.string_of_all_product_names,
            "paket_cod": json_from_ERP.total_price_cod,
            "paket_cashless": json_from_ERP.paket_cashless,
            "paket_collect": "pickup_warehouse",
            "consignor_name": json_from_ERP.sold_pic_name,
            "consignor_company": json_from_ERP.registered_company_name,
            "consignor_address1": json_from_ERP.registered_company_address,
            "consignor_address2": "",
            "consignor_zipcode": json_from_ERP.registered_company_zipcode,
            "consignor_phone": json_from_ERP.sold_pic_contact_number,
            "consignor_email": json_from_ERP.sold_pic_email,
            "consignee_name": json_from_ERP.customer_name,
            "consignee_company": json_from_ERP.customer_store_name,
            "consignee_address1": json_from_ERP.customer_address,
            "consignee_address2": "",
            "consignee_zipcode": json_from_ERP.customer_zipcode,
            "consignee_phone": json_from_ERP.customer_contact_number,
            "consignee_email": json_from_ERP.customer_email,
            "warehouse_code": json_from_ERP.sold_warehouse_code
        }
        console.log(accepted_by_tiki);
        resolve(await send_delivery_order_to_tiki(accepted_by_tiki).then(async value => {
            return await value;
        }))
    })
}

async function split_address(address){
    return new Promise(async resolve => {
        var address_splitted = address.split(" ");
        console.log(address_splitted);
        var i = 0;
        var recorded_cut_off = 0;
        for(i ; i < address_splitted.length; i ++){
            console.log(!await check_exitance(address_splitted[i]).then(async value => {
                return await value;
            }));
            if(!await check_exitance(address_splitted[i]).then(async value => {
                return await value;
            })){
                console.log(address_splitted[i]);
                recorded_cut_off = i;
                i = address_splitted.length;
            }
        }
        i = 0;
        var primary_address = "";
        for(i ; i < recorded_cut_off; i ++){
            primary_address = primary_address + address_splitted[i] + " ";
        }
        i = recorded_cut_off;
        var secondary_address = "";
        for(i ; i < address_splitted.length; i ++){
            secondary_address = secondary_address + address_splitted[i] + " ";
        }
        console.log(primary_address);
        console.log(secondary_address);
        resolve({
            first_address: primary_address,
            second_address: secondary_address
        });
    });
}

async function check_exitance(word){
    var sql = "";
    sql = `
        select Province from vtportal.courier_and_national_area_management where Province like '%(${word})%' limit 1;
    `;
    console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result[0] != undefined){
                    sql = `
                        select City from vtportal.courier_and_national_area_management where City like '%(${word})%' limit 1;
                    `;
                    await con.query(sql, async function (err, result) {
                        if (err) {
                            await console.log(err);
                            resolve(false);
                        }else{
                            if(result[0] != undefined){
                                sql = `
                                    select Sub_District from vtportal.courier_and_national_area_management where Sub_District like '%(${word})%' limit 1;
                                `;
                                await con.query(sql, async function (err, result) {
                                    if (err) {
                                        await console.log(err);
                                        resolve(false);
                                    }else{
                                        if(result[0] != undefined){
                                            sql = `
                                                select District from vtportal.courier_and_national_area_management where District like '%(${word})%' limit 1;
                                            `;
                                            await con.query(sql, async function (err, result) {
                                                if (err) {
                                                    await console.log(err);
                                                    resolve(false);
                                                }else{
                                                    if(result[0] != undefined){
                                                        resolve(false);
                                                    }else{
                                                        resolve(true);
                                                    }
                                                }
                                            });
                                        }else{
                                            resolve(true);
                                        }
                                    }
                                });
                            }else{
                                resolve(true);
                            }
                        }
                    });
                }else{
                    resolve(true);
                }
            }
        });
    });
}

app.post('/send_delivery_order_to_tiki',  async (req, res) => {
    var json_from_ERP = req.body;
    // // console.log("send_delivery_order_to_tiki ================ send_delivery_order_to_tiki");
    if(json_from_ERP != undefined){
        // // console.log(json_from_ERP);
        res.send(
            await reorder_json_to_fit_tiki(json_from_ERP).then(async value => {
                return await value;
            })
        );
    }
})

app.post('/get_actual_shipping_fee_tiki',  async (req, res) => {
    res.send(
        await get_actual_shipping_fee_charged_tiki(req.query.cnno).then(async value => {
            return await value;
        })
    )
})

async function get_actual_shipping_fee_charged_tiki(cnno){
    return new Promise(async resolve => {
        var options = {
            'method': 'POST',
            'url': 'http://apix.mytiki.net/connote/information',
            'headers': {
            'content-type': 'application/json ',
            'x-access-token': await get_access_token_tiki()
            },
            body: `{\r\n    "cnno":"${cnno}"\r\n}`
        
        };
        await request(options, async function (error, response) {
            if (error) {
                // console.log(error);
                resolve(false);
            }else{
                var result = JSON.parse(response.body);
                // console.log(result);
                resolve(
                    {
                        accepted_weight_from_tiki: result.response[0].weight || '',
                        actual_cost_for_the_shipment: result.response[0].shipment_fee || '',
                        actual_insurance_fee_from_tiki: result.response[0].insurance_fee || '',
                        chosen_delivery_service_from_tiki: result.response[0].product || '',
                        total_package: result.response[0].pieces_no || '',
                        destination: result.response[0].destination_city_name || ''
                    }
                );
            }
        });
    })
}

app.post('/track_shipment_tiki',  async (req, res) => {
    res.send(
        await get_tracking_tiki_history(req.query.cnno).then(async value => {
            return await value;
        })
    )
})

async function get_tracking_tiki_history(cnno){
    return new Promise(async resolve => {
        var options = {
            'method': 'POST',
            'url': 'http://apix.mytiki.net/connote/information',
            'headers': {
            'content-type': 'application/json ',
            'x-access-token': await get_access_token_tiki()
            },
            body: `{\r\n    "cnno":"${cnno}"\r\n}`
        
        };
        await request(options, async function (error, response) {
            if (error) {
                // console.log(error);
                resolve(false);
            }else{
                var result = JSON.parse(response.body);
                resolve(result.response[0].history);
            }
        });
    })
}

async function get_area_covered_by_tiki(token){
    return new Promise(async resolve => {
        var options = {
            'method': 'POST',
            'url': 'http://apix.mytiki.net/tariff/areainfo',
            'headers': {
              'content-type': 'application/json ',
              'x-access-token': `${token}`
            }
        };
        request(options, async function (error, response) {
            if (error) {
                // console.log(error);
                // console.log("fail get_area_covered_by_tiki | token : " + token);
                resolve(get_area_covered_by_tiki(token)());
            }else{
                // // console.log(response.body);
                var result = JSON.parse(response.body);
                resolve(result.response);
            }
        });
    })
}

app.post('/update-tiki-datas',  async (req, res) => {
    res.send(
        await save_area_covered_by_tiki().then(async value => {
            return await value;
        })
    );
})

function update_tiki() {
    var date = new Date();
    // console.log(date.getDay());
    // console.log(date.getHours());
    if(date.getDay() === 1 && date.getHours() === 3) {
        // console.log("========================= update-tiki-datas =========================");
        var options = {
            'method': 'POST',
            'url': 'http://localhost:3001/update-tiki-datas',
            'headers': {},
            'timeout': 12000000
        };
        request(options, function (error, response) {
            if (error) {
                // console.log(error);
                // console.log("========================= fail update-tiki-datas =========================");
            }else{
                // console.log(response.body);
                // console.log("========================= success update-tiki-datas =========================");
            }
        });
    }
}

setInterval(function() {
    update_tiki();
},1.8e+6);

async function save_area_covered_by_tiki(){
    return new Promise(async resolve => {
        var token = await get_access_token_tiki().then(async value => {
            return await value;
        })
        if(token.length > 0){
            var areas = await get_area_covered_by_tiki(token).then(async value => {
                return await value;
            })
            var object_data =  {
                Courier: "tiki"
            }
            if(
                await delete_all_existing_area_covered_by_tiki_in_database(object_data).then(async value => {
                    return await value;
                })
            ){
                var i = 0;
                for(i; i < areas.length; i++){
                    // (areas[i].sub_dist != null) ? // console.log(areas[i].sub_dist.replace("\'", "\\'")) : // console.log("===============================");
                    var object_data =  {
                        Courier: "tiki", 
                        Courier_Code: "tiki",
                        Province: (areas[i].province != null) ? areas[i].province.replace(/'/g, "\\'") : "",
                        City: (areas[i].city_county_type != null && areas[i].city_county != null) ? areas[i].city_county_type.replace(/'/g, "\\'") + " " + areas[i].city_county.replace(/'/g, "\\'") : areas[i].city_county.replace(/'/g, "\\'"),
                        District: (areas[i].dist != null) ? areas[i].dist.replace(/'/g, "\\'") : "",
                        Sub_District: (areas[i].sub_dist != null) ? areas[i].sub_dist.replace(/'/g, "\\'") : "",
                        Zipcode: (areas[i].zip_code != null) ? areas[i].zip_code.replace(/'/g, "\\'") : "",
                        Courier_Price_Code: areas[i].tariff_code
                    }
                    if(
                        await add_area_covered_by_tiki_into_database(object_data).then(async value => {
                            return await value;
                        })
                    ){
                        // console.log("success added");
                    }else{
                        // console.log("fail added | Courier_Price_Code = " + Courier_Price_Code);
                    }
                }   
            }else{
                // console.log("== fail delete_all_existing_area_covered_by_tiki_in_database == fail save_area_covered_by_tiki");
                resolve(false);
            }
        }else{
            resolve(false);
        }
    })
}

async function add_area_covered_by_tiki_into_database(object_data){
    var sql = "";
    sql = `
    INSERT INTO vtportal.courier_and_national_area_management
    (
        Courier
        , Courier_Code
        , Province
        , City
        , District
        , Sub_District
        , Zipcode
        , Courier_Price_Code
        , Created_Date
        , Status
        , Update_date
        , Delete_Mark
        )
    VALUES(
        '${object_data.Courier}'
        ,'${object_data.Courier_Code}'
        , '${object_data.Province}'
        , '${object_data.City}'
        , '${object_data.District}'
        , '${object_data.Sub_District}'
        , '${object_data.Zipcode}'
        , '${object_data.Courier_Price_Code}'
        , CURRENT_TIMESTAMP
        , 'approving'
        , CURRENT_TIMESTAMP
        , '0'
    );
    ;
    `;
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

async function delete_all_existing_area_covered_by_tiki_in_database(object_data){
    var sql = "";
    sql = `
        DELETE FROM vtportal.courier_and_national_area_management
        WHERE upper(Courier) = '${object_data.Courier.toUpperCase()}';
    `;
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

async function handle_disconnect() {
    con = mysql.createConnection({
        host: "172.31.207.222",
        port: 3306,
        database: "vtportal",
        user: "root",
        password: "Root@123"
    });

    con.connect(function(err) {
        if (err) {
            // console.log('error when connecting to db:', err);
            setTimeout(handle_disconnect, 2000);
        }
    });
    con.on('error', function(err) {
        // console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handle_disconnect();
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
                // console.log(err);
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

app.post('/get-shipping-option-data',  async (req, res) => {
    if(req.query.Get_Shipping_Fee != undefined){
        if(req.query.Courier_Price_Code_orig != undefined 
            && req.query.Courier_Price_Code_dest != undefined
            && req.query.packing_type != undefined
            && req.query.weight != undefined
            && req.query.paket_value != undefined){
                res.send(
                    await get_shipping_options(req.query.Courier_Price_Code_orig
                        , req.query.Courier_Price_Code_dest
                        , req.query.packing_type
                        , req.query.weight
                        , req.query.length
                        , req.query.width
                        , req.query.height
                        , req.query.paket_value
                        ).then(async value => {
                            return await value;
                    })
                );
            }
    }else{
            res.send({
                status: false,
                reason: "you did not provide Courier_Code and Courier"
            });
    }
})

app.post('/get-courier-data',  async (req, res) => {
    if(req.query.Get_All_Couriers != undefined){
        res.send(
            await get_couriers().then(async value => {
                    return await value;
            })
        );
    }else if(req.query.Get_Shipping_Fee != undefined){
        if(req.query.Courier_Price_Code_orig != undefined 
            && req.query.Courier_Price_Code_dest != undefined
            && req.query.packing_type != undefined
            && req.query.weight != undefined
            && req.query.paket_value != undefined
            ){
                res.send(
                    await get_shipping_fee(req.query.Courier_Price_Code_orig
                        , req.query.Courier_Price_Code_dest
                        , req.query.packing_type
                        , req.query.weight
                        , req.query.length
                        , req.query.width
                        , req.query.height
                        , req.query.paket_value
                        ).then(async value => {
                            return await value;
                    })
                );
            }
    }else{
        if(req.query.Courier != undefined 
            && req.query.Courier_Code != undefined){
                if(req.query.Get_All_Province != undefined){
                    res.send(
                        await get_courier_all_Provinces(req.query.Courier, req.query.Courier_Code, "").then(async value => {
                                return await value;
                        })
                    );
                }else if(req.query.Province != undefined){
                    res.send(
                        await get_courier_all_Cities(req.query.Courier, req.query.Courier_Code, req.query.Province).then(async value => {
                                return await value;
                        })
                    );
                }else if(req.query.City != undefined){
                    res.send(
                        await get_courier_all_Districts(req.query.Courier, req.query.Courier_Code, req.query.City).then(async value => {
                                return await value;
                        })
                    );
                }else if(req.query.District != undefined){
                    res.send(
                        await get_courier_all_Sub_Districts(req.query.Courier, req.query.Courier_Code, req.query.District).then(async value => {
                                return await value;
                        })
                    );
                }else{
                    res.send(
                        await get_courier_all_data(req.query.Courier, req.query.Courier_Code).then(async value => {
                                return await value;
                        })
                    );
                }
        }else{
            res.send({
                status: false,
                reason: "you did not provide Courier_Code and Courier"
            });
        }
    }
})

async function get_shipping_fee(Courier_Price_Code_orig
    , Courier_Price_Code_dest
    , packing_type
    , weight
    , length
    , width
    , height
    , paket_value
    ){
        return new Promise(async resolve => {
            resolve(
            await get_shipping_options(Courier_Price_Code_orig
                , Courier_Price_Code_dest
                , packing_type
                , weight
                , length
                , width
                , height
                , paket_value
                ).then(async value => {
                    return await value;
            }));
        });
        // var sql = "";
        // sql = `
        //     select Courier_Price_Code, delivery_time_in_days, Courier_Price_Per_Kg from vtportal.courier_and_national_area_management where 
        //         upper(Courier) = '${Courier.toUpperCase()}'
        //         and upper(Courier_Code) = '${Courier_Code.toUpperCase()}'
        //         and upper(Province) = '${Province.toUpperCase()}'
        //         and upper(City) = '${City.toUpperCase()}'
        //         and upper(District) = '${District.toUpperCase()}'
        //         and upper(Sub_District) = '${Sub_District.toUpperCase()}'
        //         and upper(delivery_time_in_days) = '${delivery_time_in_days.toUpperCase()}'
        //         and upper(Courier_Price_Code) = '${Courier_Price_Code.toUpperCase()}'
        //     ;
        // `;
        // // console.log(sql);
        // return new Promise(async resolve => {
        //     await con.query(sql, async function (err, result) {
        //         if (err) {
        //             await // console.log(err);
        //             resolve(false);
        //         }else{
        //             resolve(result);
        //         }
        //     });
        // });

}

async function get_shipping_options(Courier_Price_Code_orig
    , Courier_Price_Code_dest
    , packing_type
    , weight
    , length
    , width
    , height
    , paket_value
    ){
        // console.log("get_shipping_options =================== requested | " + Courier_Price_Code_dest);
        if(Courier_Price_Code_dest.toUpperCase().includes("VTINTL")){
            return new Promise(async resolve => {
                sql = `
                    select * from vtportal.courier_and_national_area_management where Courier_Price_Code = '${Courier_Price_Code_dest}';
                `;
                // console.log(sql);
                await con.query(sql, async function (err, result) {
                    if (err) {
                        await // console.log(err);
                        resolve(false);
                    }else{
                        var i = 0;
                        var response = {};
                        var service = [];
                        for(i ; i < result.length; i++){
                            // console.log("length ==== given by user | length: "+ length);
                            // console.log("width ==== given by user | width: "+ width);
                            // console.log("height ==== given by user | height: "+ height);
                            if(length == undefined){
                                length = 1;
                            }
                            if(width == undefined){
                                width = 1;
                            }
                            if(height == undefined){
                                height = 1;
                            }
                            var volume_weight = (length*width*height/6000);
                            // console.log("volume_weight ==== given by user | volume_weight: "+ volume_weight);
                            // console.log("weight ==== given by user | weight: "+ weight);
                            if(
                                weight >= volume_weight
                            ){
                                result[i].Courier_Price_Per_Kg = result[i].Courier_Price_Per_Kg * Math.ceil(weight * 1);
                            }else{
                                result[i].Courier_Price_Per_Kg = result[i].Courier_Price_Per_Kg * Math.ceil(volume_weight * 1);
                            }
                            // console.log("result[i].Courier_Price_Per_Kg | result[i].Courier_Price_Per_Kg: "+ Math.ceil(result[i].Courier_Price_Per_Kg).toString());
                            service.push({
                                SERVICE: result[i].Courier_Code,
                                DESCRIPTION: result[i].Courier_Code + "-" + result[i].Province,
                                TARIFF: Math.ceil(result[i].Courier_Price_Per_Kg).toString(),
                                EST_DAY: result[i].delivery_time_in_days,
                                CUT_OFF_TIME: "",
                                EXTENDED_EST_DAY: "", 
                            });

                        }
                        response = {
                            service,
                            insurance: []
                        };
                        resolve(response);
                    }
                });
            });
        }else{
            return new Promise(async resolve => {
                var body_json = {
                    orig: Courier_Price_Code_orig,
                    dest: Courier_Price_Code_dest,
                    packing_type: packing_type,
                    weight: weight,
                    length: length,
                    width: width,
                    height: height,
                    paket_value: paket_value,
                };
                var options = {
                    'method': 'POST',
                    'url': 'http://apix.mytiki.net/v02/tariff/product',
                    'headers': {
                    'content-type': 'application/json ',
                    'x-access-token': await get_access_token_tiki()
                    },
                    body: JSON.stringify(body_json)
                
                };
                request(options, async function (error, response) {
                    if (error) {
                        // console.log(error);
                        // console.log("fail get_shipping_options ================= get_shipping_options");
                        resolve(get_shipping_options(Courier_Price_Code_orig
                            , Courier_Price_Code_dest
                            , packing_type
                            , weight
                            , length
                            , width
                            , height
                            , paket_value
                            ));
                    }else{
                        var result = JSON.parse(response.body);
                        var new_service = [];
                        if(result.response != undefined){
                            if(result.response.service != undefined){
                                if(result.response.service.length > 0){
                                    var i = 0;
                                    for(i ; i < result.response.service.length; i ++){
                                        if(result.response.service[i].SERVICE.toUpperCase() == "REG".toUpperCase()){
                                            new_service.push(result.response.service[i]);
                                        }else if(result.response.service[i].SERVICE.toUpperCase() == "TRC".toUpperCase()){
                                            new_service.push(result.response.service[i]);
                                        }else if(result.response.service[i].SERVICE.toUpperCase() == "ECO".toUpperCase()){
                                            new_service.push(result.response.service[i]);
                                        }
                                    }
                                }
                                if(new_service.length != 0){
                                    result.response.service = new_service;
                                }
                            }
                        }
                        resolve(result.response);
                    }
                });
            })
        }
}

async function get_couriers(){
    var sql = "";
    sql = `
        select Distinct Courier, Courier_Code from vtportal.courier_and_national_area_management;
    `;
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

async function get_courier_all_Sub_Districts(Courier, Courier_Code, District){
    var sql = "";
    if(Courier != undefined){
        sql = `
            select Distinct Sub_District, Zipcode, Courier_Price_Code from vtportal.courier_and_national_area_management where upper(Courier) like '%${Courier.toUpperCase()}%' and upper(District) like '%${District.toUpperCase()}%';
        `;
    }else{
        sql = `
            select Distinct Sub_District, Zipcode, Courier_Price_Code from vtportal.courier_and_national_area_management where upper(Courier_Code) like '%${Courier_Code.toUpperCase()}%' and upper(District) like '%${District.toUpperCase()}%';
        `;
    }
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

async function get_courier_all_Districts(Courier, Courier_Code, City){
    var sql = "";
    if(Courier != undefined){
        sql = `
            select Distinct District from vtportal.courier_and_national_area_management where upper(Courier) like '%${Courier.toUpperCase()}%' and upper(City) like '%${City.toUpperCase()}%';
        `;
    }else{
        sql = `
            select Distinct District from vtportal.courier_and_national_area_management where upper(Courier_Code) like '%${Courier_Code.toUpperCase()}%' and upper(City) like '%${City.toUpperCase()}%';
        `;
    }
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

async function get_courier_all_Cities(Courier, Courier_Code, Province){
    var sql = "";
    if(Courier != undefined){
        sql = `
            select Distinct City from vtportal.courier_and_national_area_management where upper(Courier) like '%${Courier.toUpperCase()}%' and upper(Province) like '%${Province.toUpperCase()}%';
        `;
    }else{
        sql = `
            select Distinct City from vtportal.courier_and_national_area_management where upper(Courier_Code) like '%${Courier_Code.toUpperCase()}%' and upper(Province) like '%${Province.toUpperCase()}%';
        `;
    }
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

async function get_courier_all_Provinces(Courier, Courier_Code, Province){
    var sql = "";
    if(Courier != undefined){
        sql = `
            select Distinct Province from vtportal.courier_and_national_area_management where upper(Courier) like '%${Courier.toUpperCase()}%';
        `;
    }else{
        sql = `
            select Distinct Province from vtportal.courier_and_national_area_management where upper(Courier_Code) like '%${Courier_Code.toUpperCase()}%';
        `;
    }
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

async function get_courier_all_data(Courier, Courier_Code){
    var sql = "";
    if(Courier != undefined){
        sql = `
            select * from vtportal.courier_and_national_area_management where upper(Courier) like '%${Courier.toUpperCase()}%';
        `;
    }else{
        sql = `
            select * from vtportal.courier_and_national_area_management where upper(Courier_Code) like '%${Courier_Code.toUpperCase()}%';
        `;
    }
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

app.post('/add-new-courier-information',  async (req, res) => {
    var Courier_Data = req.body.Courier_Data;
    if(req.query.Courier != undefined 
        && req.query.Courier_Code != undefined
        && req.query.Province != undefined
        && req.query.City != undefined
        && req.query.Courier_Price_Code != undefined
        && Courier_Data != undefined){
            if(req.query.Courier_Price_Per_Kg != undefined){
                res.send(
                    await add_new_courier(req.query.Courier, req.query.Courier_Code, req.query.Province, req.query.City, req.query.Courier_Price_Code, req.query.Courier_Price_Per_Kg, Courier_Data).then(async value => {
                            return await value;
                    })
                );
            }else{
                res.send(
                    await add_new_courier(req.query.Courier, req.query.Courier_Code, req.query.Province, req.query.City, req.query.Courier_Price_Code, "0", Courier_Data).then(async value => {
                            return await value;
                    })
                );
            }
    }else{
        res.send(false);
    }
})

async function add_new_courier(Courier, Courier_Code, Province, City, Courier_Price_Code, Courier_Price_Per_Kg, Courier_Data){
    var sql = `
    INSERT INTO vtportal.courier_and_national_area_management (
        Courier, 
        Courier_Code, 
        Province, 
        City,
        Courier_Price_Code,
        Courier_Price_Per_Kg,
        District,
        Sub_District,
        Zipcode,
        Status,
        Update_date,
        delivery_time_in_days
        )
    VALUES ('${Courier}'
        , '${Courier_Code}'
        , '${Province}'
        , '${City}'
        , '${Courier_Price_Code}'
        , '${Courier_Price_Per_Kg}'
        , '${Courier_Data.District}'
        , '${Courier_Data.Sub_District}'
        , '${Courier_Data.Zipcode}'
        , 'approving'
        , CURRENT_TIMESTAMP
        , '${Courier_Data.delivery_time_in_days}'
        );
    `;
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

app.post('/update-courier-information',  async (req, res) => {
    if(req.query.Courier != undefined 
        && req.query.Courier_Code != undefined
        && req.query.Province != undefined
        && req.query.City != undefined
        && req.query.Courier_Price_Code != undefined){
            if(req.query.Courier_Price_Per_Kg != undefined){
                res.send(
                    await update_courier_province_and_city(req.query.Courier, req.query.Courier_Code, req.query.Province, req.query.City, req.query.Courier_Price_Code, req.query.Courier_Price_Per_Kg).then(async value => {
                            return await value;
                    })
                );
            }else{
                res.send(
                    await update_courier_province_and_city(req.query.Courier, req.query.Courier_Code, req.query.Province, req.query.City, req.query.Courier_Price_Code, "0").then(async value => {
                            return await value;
                    })
                );
            }
    }else{
        res.send(false);
    }
})

async function update_courier_province_and_city(Courier, Courier_Code, Province, City, Courier_Price_Code, Courier_Price_Per_Kg){
    var sql = `
    UPDATE vtportal.courier_and_national_area_management
    SET Courier = '${Courier}' 
    , Courier_Code = '${Courier_Code}'
    , Province = '${Province}'
    , City = '${City}'
    , Courier_Price_Code = '${Courier_Price_Code}'
    , Courier_Price_Per_Kg = '${Courier_Price_Per_Kg}'
    WHERE Courier = '${Courier}';
    `;
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

app.post('/update-product-groupbuy-status-price-quantity',  async (req, res) => {
    if(req.query.Password != undefined && req.query.Email != undefined){
        if(await customer_login_request(req.query.Password, req.query.Email).then(async value => {
            return await value;
        }) != false){
            res.send(
                await update_product_groupbuyStatus_groupbuyPrice_groupbuyQuantity(req.query.GroupBuy_Purchase, req.query.GroupBuy_SellPrice, req.query.GroupBuy_SellQuantity, req.query.Product_Code, req.query.Customer_Code).then(async value => {
                    return await value;
                })
            );
        }else{
            res.send(false);
        }
    }else{
        res.send(false);
    }
})

async function customer_login_request(Password, Email){
    var options = {
        'method': 'POST',
        'url': 'http://147.139.168.202:3002/customer-login-request?Password=' + Password + '&Email=' + Email,
        'headers': {
        }
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) {
                // console.log(error);
                resolve(false);
            }else{
                resolve((response.body));
            }
        });
    });
}

async function update_product_groupbuyStatus_groupbuyPrice_groupbuyQuantity(GroupBuy_Purchase, GroupBuy_SellPrice, GroupBuy_SellQuantity, Product_Code, Customer_Code){
    if(await check_existing_customer_code(Customer_Code)){
        // console.log("================================================= edit group buy from user");
        // console.log((GroupBuy_Purchase));
        // console.log((GroupBuy_SellPrice*1));
        // console.log((GroupBuy_SellQuantity*1));
        if((GroupBuy_SellPrice*1) >= 500 && (GroupBuy_SellQuantity*1) >= 5){
            if(GroupBuy_Purchase == "true"){
                var sql = `
                UPDATE vtportal.product_management
                SET GroupBuy_Purchase = '${true}' 
                , GroupBuy_SellPrice = '${GroupBuy_SellPrice}'
                , GroupBuy_SellQuantity = '${GroupBuy_SellQuantity}'
                , Last_Updated = CURRENT_TIMESTAMP()
                , Update_date = CURRENT_TIMESTAMP()
                WHERE Product_Code = '${Product_Code}';
                `;
                // console.log(sql);
                return new Promise(async resolve => {
                    await con.query(sql, async function (err, result) {
                        if (err) {
                            await // console.log(err);
                            resolve(false);
                        }else{
                            resolve(true);
                        }
                    });
                });
            }else if(GroupBuy_Purchase ==  "false"){
                var sql = `
                UPDATE vtportal.product_management
                SET GroupBuy_Purchase = '${false}' 
                , GroupBuy_SellPrice = '${GroupBuy_SellPrice}'
                , GroupBuy_SellQuantity = '${GroupBuy_SellQuantity}'
                WHERE Product_Code = '${Product_Code}';
                `;
                // console.log(sql);
                return new Promise(async resolve => {
                    await con.query(sql, async function (err, result) {
                        if (err) {
                            await // console.log(err);
                            resolve(false);
                        }else{
                            resolve(true);
                        }
                    });
                });
            }else{
                return new Promise(async resolve => {
                    // console.log("GroupBuy_Purchase " + GroupBuy_Purchase);
                    resolve(false);
                });
            }
        }else{
            return new Promise(async resolve => {
                // console.log("(GroupBuy_SellPrice*1) >= 500 && (GroupBuy_SellQuantity*1) >= 5");
                resolve(false);
            });
        }
    }else{
        return new Promise(async resolve => {
            // console.log("check_existing_customer_code(Customer_Code) " + await check_existing_customer_code(Customer_Code));
            resolve(false);
        });
    }
}

app.post('/update-product-name-price-quantity',  async (req, res) => {
    if(req.query.Password != undefined && req.query.Email != undefined){
        if(await customer_login_request(req.query.Password, req.query.Email).then(async value => {
            return await value;
        }) != false){
            res.send(
                await update_product_name_price_quantity(req.query.Name, req.query.Sell_Price, req.query.Stock_Quantity, req.query.Product_Code, req.query.Customer_Code).then(async value => {
                    return await value;
                })
            );
        }else{
            res.send(false);
        }
    }else{
        res.send(false);
    }
})

async function update_product_name_price_quantity(Name, Sell_Price, Stock_Quantity, Product_Code, Customer_Code){
    return new Promise(async resolve => {
        if(await check_existing_customer_code(Customer_Code)){
            if((Sell_Price*1) >= 1000 && (Stock_Quantity*1) >= 10){
                var sql = `
                UPDATE vtportal.product_management
                SET Name = '${Name}' 
                , Sell_Price = '${Sell_Price}'
                , Stock_Quantity = '${Stock_Quantity}'
                , Last_Updated = CURRENT_TIMESTAMP()
                , Update_date = CURRENT_TIMESTAMP()
                WHERE Product_Code = '${Product_Code}';
                `;
                // return new Promise(async resolve => {
                    await con.query(sql, async function (err, result) {
                        if (err) {
                            await // console.log(err);
                            resolve(false);
                        }else{
                            resolve(true);
                        }
                    });
                // });
            }else{
                resolve(false);
            }
        }else{
            resolve(false);
        }
    });
}

app.post('/get-colors-option',  async (req, res) => {
    res.send(
        await get_the_same_product_with_different_colors(req.query.Name, req.query.Specification, req.query.Category, req.query.Subcategory, req.query.Brand).then(async value => {
            return await value;
        })
    );
})

async function get_the_same_product_with_different_colors(Name, Specification, Category, Subcategory, Brand){
    var sql = `
    select Product_Code, color, Sell_Price, Description, Picture_1, Picture_2, Picture_3, GroupBuy_Purchase, GroupBuy_SellPrice, GroupBuy_SellQuantity
    from vtportal.product_management 
    where Upper(Name) = '${Name.toUpperCase()}' 
    and Upper(Specification) = '${Specification.toUpperCase()}' 
    and Upper(Category) = '${Category.toUpperCase()}' 
    and Upper(Subcategory) = '${Subcategory.toUpperCase()}' 
    and Upper(Brand) = '${Brand.toUpperCase()}';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

app.post('/get-lastest-token-and-session',  async (req, res) => {
    res.send(
        await get_latest_recorded_token().then(async value => {
            return await value;
        })
    );
})

app.post('/set-product-rating',  async (req, res) => {
    var Product_Code = req.query.Product_Code;
    var product_rating = req.query.product_rating;
    var current_rating = await get_rating_from_a_product(Product_Code).then(async value => {
        return await value;
    })
    res.send(
        await set_rating_from_a_product(Product_Code, product_rating, current_rating[0].product_rating).then(async value => {
            return await value;
        })
    );
})

app.post('/get-product-rating',  async (req, res) => {
    var Product_Code = req.query.Product_Code;
    res.send(
        await get_rating_from_a_product(Product_Code).then(async value => {
            return await value;
        })
    );
})

async function set_rating_from_a_product(Product_Code, product_rating, current_product_rating){
    var rating_calculation = ((current_product_rating*1) + (product_rating*1))/2;
    // console.log("rating_calculation" + rating_calculation);
    if(rating_calculation >= 0 && rating_calculation < 25 ){
        rating_calculation = 0;
    }else if(rating_calculation >= 25 && rating_calculation < 50 ){
        rating_calculation = 25;
    }else if(rating_calculation >= 50 && rating_calculation < 75 ){
        rating_calculation = 50;
    }else if(rating_calculation >= 75 && rating_calculation < 100 ){
        rating_calculation = 75;
    }else if(rating_calculation >= 100 ){
        rating_calculation = 100;
    }else{
        rating_calculation = 0;
    }
    var sql = `
    UPDATE vtportal.product_management
    SET product_rating='${rating_calculation}' where Product_Code='${Product_Code}'
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

async function get_rating_from_a_product(Product_Code){
    var sql = `
    select product_rating from vtportal.product_management where Product_Code like '%${Product_Code}%' and Delete_Mark != '1';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

//get-products-belong-to-the-supplier
app.post('/get-products-belong-to-the-supplier',  async (req, res) => {
    var Creator = req.query.Creator;
    if(Creator != undefined){
        res.send(
            (await get_products_belong_to_supplier(Creator).then(async value => {
                return await value;
            }))  
        );
    }else{
        res.send({
            status: false,
            reason: "Creator is incomplete"
        });
    }
})

async function get_products_belong_to_supplier(Creator){
    var sql = `
    select * from vtportal.product_management where upper(Creator) like '%${Creator.toUpperCase()}%' and Delete_Mark != '1';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

//get-unpaid-sales-order-specific-for-a-product
app.post('/get-unpaid-sales-order-specific-for-a-product',  async (req, res) => {
    var Product_Code = req.query.Product_Code;
    var Customer_Code = req.query.Customer_Code;
    if(Product_Code != undefined && Customer_Code != undefined){
        res.send(
            (await check_upaid_order_in_regards_to_product_code(Product_Code, Customer_Code).then(async value => {
                return await value;
            }))  
        );
    }else{
        res.send({
            status: false,
            reason: "Customer_Code and(or) Product_Code are(is) incomplete"
        });
    }
})

async function check_upaid_order_in_regards_to_product_code(Product_Code, Customer_Code){
    var sql = `
    select count(*) as found from vtportal.sales_order_management so where Customer_Code = '${Customer_Code}' and Group_Buy_Purchase_PC = '${Product_Code}' and Delete_Mark = '0' and upper(Payment_Status) != 'PAYMENT';
    `;
    // console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                // console.log(result[0].found);
                if(result[0].found > 0){
                    resolve(false);
                }else{
                    resolve(true);
                }
            }
        });
    });
}

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
                await // console.log(err);
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
                await // console.log(err);
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
                await // console.log(err);
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
                await // console.log(err);
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
    // console.log(Product_Code);
    var sql = `UPDATE vtportal.product_management 
    SET Delete_Mark = '1',
    Deleter = '${Deleter}',
    Delete_Date = CURRENT_TIMESTAMP()
    WHERE Product_Code = '${Product_Code}';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await // console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
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
        // console.log("get by name " + product_name)
        var product_names = product_name.split(" ");
        var collected_results = [];
        var i = 0;
        for(i; i < product_names.length; i ++){
            // console.log("Name " + product_names[i])
            collected_results = collected_results.concat(await get_product_details_based_on_product_name(product_names[i]).then(async value => {
                return await value;
            }));
        }//get_product_details_based_on_product_brand(product_name)
        var i = 0;
        for(i; i < product_names.length; i ++){
            // console.log("Brand " + product_names[i])
            collected_results = collected_results.concat(await get_product_details_based_on_product_brand(product_names[i]).then(async value => {
                return await value;
            }));
        }
        res.send(collected_results);
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
    // var sql = `
    // select Subcategory, Picture_1 from vtportal.product_management where Delete_Mark != '1' and Subcategory != 'undefined' and upper(Subcategory) != 'NULL'
    // and Category = '${Get_ALL_Sub_Category_Based_On_Category}' and (Picture_1 != 'NULL' or Picture_1 != null) group by Subcategory;
    // `;
    var sql = `select Subcategory, Picture_1, PIC_company_name, PIC_company_address from vtportal.product_management pm
    inner join vtportal.sold_supplier ss
    on id = Brand
    where pm.Delete_Mark != '1' and pm.Subcategory != 'undefined' and upper(pm.Subcategory) != 'NULL'
    and pm.Category = '${Get_ALL_Sub_Category_Based_On_Category}' and (pm.Picture_1 != 'NULL' or pm.Picture_1 != null) GROUP by pm.Category ;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined){
                    if(result[0] != undefined){
                        resolve(result);
                    }else{
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    });
}

async function get_all_product_category(){
    var sql = `
    select Category from vtportal.product_management where Delete_Mark != '1' and Category != 'undefined' and upper(Category) != 'NULL' and (Picture_1 != 'NULL' or Picture_1 != null) group by Category;
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined){
                    if(result[0] != undefined){
                        resolve(result);
                    }else{
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    });
}

async function get_product_details_not_new_items(){
    var sql = `
        select * from vtportal.product_management where Categorize_NEW = 'false' and Categorize_NEW = 'undefined' and Categorize_NEW = 'NULL' and (Picture_1 != 'NULL' or Picture_1 != null);
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined){
                    if(result[0] != undefined){
                        resolve(result);
                    }else{
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    });
}

async function get_product_details_based_on_new_items(){
    var sql = `
        select * from vtportal.product_management where Categorize_NEW != 'false' and Categorize_NEW != 'undefined' and Categorize_NEW != 'NULL' and (Picture_1 != 'NULL' or Picture_1 != null);
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined){
                    if(result[0] != undefined){
                        resolve(result);
                    }else{
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    });
}

async function get_product_details_not_groupbuy_purchase(){
    var sql = `
        select * from vtportal.product_management where GroupBuy_Purchase = 'false' and GroupBuy_Purchase = 'undefined' and GroupBuy_Purchase = 'NULL' and (Picture_1 != 'NULL' or Picture_1 != null);
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined){
                    if(result[0] != undefined){
                        resolve(result);
                    }else{
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    });
}

async function get_product_details_based_on_groupbuy_purchase(){
    // var sql = `
    //     select * from vtportal.product_management where GroupBuy_Purchase != 'false' and GroupBuy_Purchase != 'undefined' and GroupBuy_Purchase != 'NULL';
    // `;
    var sql = `
    select * from vtportal.product_management where GroupBuy_Purchase ='true' and (Picture_1 != 'NULL' or Picture_1 != null);
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined){
                    if(result[0] != undefined){
                        resolve(result);
                    }else{
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    });
}

async function get_product_details_based_on_product_code(product_code){
    // console.log(product_code);
    var sql = `
        select * 
        from vtportal.product_management pm
        inner join 
        vtportal.sold_supplier som 
        on pm.Brand = som.id 
        where Product_Code like '%${product_code}%' and (Picture_1 != 'NULL' or Picture_1 != null) limit 1;
    `;
    console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined && result[0] != undefined){
                    if(result[0].Product_Code != undefined){
                        if(result[0].Product_Code == product_code){
                            console.log(result[0]);
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
            }
        });
    });
}

async function get_product_details_based_on_product_name(product_name){
    var sql = `select * from vtportal.product_management where upper(Name) like '%${product_name.toUpperCase()}%' and (Picture_1 != 'NULL' or Picture_1 != null);`;
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

async function get_product_details_based_on_product_brand(product_name){
    var sql = `select * from vtportal.product_management where upper(Brand) like '%${product_name.toUpperCase()}%' and (Picture_1 != 'NULL' or Picture_1 != null);`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                await get_product_details_based_on_product_brand(product_name).then(async value => {
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
    var sql = `select * from vtportal.product_management where upper(Category) like '%${category.toUpperCase()}%' and (Picture_1 != 'NULL' or Picture_1 != null);`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
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

async function get_product_details_based_on_subcategory(subcategory){
    var sql = `select * from vtportal.product_management where upper(Subcategory) like '%${subcategory.toUpperCase()}%' and (Picture_1 != 'NULL' or Picture_1 != null);`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
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

async function get_all_products(){
    var sql = `select * from vtportal.product_management where Delete_Mark != '1'and Sell_Price != '0' and (Picture_1 != 'NULL' or Picture_1 != null);`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
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

// upload Product Details.xlsx doc
app.post('/upload-new-product-management-excel', async function(req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', async function (fieldname, file, filename) {
        // console.log("Uploading: " + filename); 
        if(filename.length > 0 && filename == 'Product Details.xlsx'){
            fstream = await fs.createWriteStream(__dirname + '/' + filename);
            await file.pipe(fstream);
            await fstream.on('close', async function () {
                // res.redirect('back');
                if(await add_or_edit_product_details().then(async value => {
                    return await value;
                })){
                    // console.log("add_or_edit_product_details done");
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
        'method': 'POST',
        'url': 'http://localhost:3001/add-or-edit-product-details',
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) {
                // console.log(error);
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
app.post('/add-or-edit-product-details',  async (req, res) => {
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
    // console.log("send_to_mysql");
    var i = 0;
    return new Promise(async resolve => {
        for(i; i < product_datas.length; i ++){
            if(await check_existing_product_code(product_datas[i].Product_Code, product_datas[i]).then(async value => { //product_datas[i].Creator
                return await value;
            })){
                if(await check_existing_customer_code(product_datas[i].Creator).then(async value => { //product_datas[i].Creator
                    return await value;
                })){
                    // console.log("update_existing_product_code");
                    console.log(await update_existing_product_code(product_datas[i]).then(async value => {
                        return await value;
                    }));
                }else{
                    resolve(false);
                }
            }else{
                if(await check_existing_customer_code(product_datas[i].Creator).then(async value => { //product_datas[i].Creator
                    return await value;
                })){
                    // console.log("insert_product_code");
                    console.log(await insert_existing_product_code(product_datas[i]).then(async value => {
                        return await value;
                    }));
                }else{
                    resolve(false);
                }
            }
        }
        resolve(true);
    });
}

async function check_existing_customer_code(Creator){
    // console.log("check_existing_customer_code");
    var sql = `select * from vtportal.customer_management where Customer_Code = '${Creator}' and Delete_Mark != '1' limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined && result[0] != undefined){
                    if(result[0].Customer_Code != undefined){
                        if(result[0].Customer_Code == Creator){
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
            }
        });
    });
}

async function check_existing_product_code(product_code, product_datas){
    // console.log("check_existing_product_code");
    if((product_datas.Sell_Price*1) >= 1000 && (product_datas.Stock_Quantity*1) >= 10){
        var sql = `select * from vtportal.product_management where Product_Code = '${product_code}' limit 1;`;
        return new Promise(async resolve => {
            await con.query(sql, async function (err, result) {
                if (err) {
                    await console.log(err);
                }else{
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
                }
            });
        });
    }else{
        return false;
    }
}

async function update_existing_product_code(product_details){
    // console.log("update_existing_product_code");
    if(product_details.Product_Code != undefined && product_details.Creator != undefined && product_details.Creator != 'NULL'){
        if(product_details.Product_Code != 'NULL'){
            var sql
            if(product_details.Picture_1 != 'NULL' && product_details.Picture_1 != undefined){
                sql = `update vtportal.product_management 
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
                GroupBuy_SellQuantity = '${product_details.GroupBuy_SellQuantity}',
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
                Tax = '${product_details.Tax}',
                Stock_Quantity = '${product_details.Stock_Quantity}'
                where Product_Code = '${product_details.Product_Code}'
                ;`;
            }else{
                sql = `update vtportal.product_management 
                set Name = '${product_details.Name}',
                Specification = '${product_details.Specification}',
                Description = '${product_details.Description}',
                Sell_Price = '${product_details.Sell_Price}',
                Unit = '${product_details.Unit}',
                Category = '${product_details.Category}',
                Subcategory = '${product_details.Subcategory}',
                Color = '${product_details.Color}',
                Brand = '${product_details.Brand}',
                GroupBuy_Purchase = '${product_details.GroupBuy_Purchase}',
                GroupBuy_SellPrice = '${product_details.GroupBuy_SellPrice}',
                GroupBuy_SellQuantity = '${product_details.GroupBuy_SellQuantity}',
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
                Tax = '${product_details.Tax}',
                Stock_Quantity = '${product_details.Stock_Quantity}'
                where Product_Code = '${product_details.Product_Code}'
                ;`;
            }
            return new Promise(async resolve => {
                await con.query(sql, async function (err, result) {
                    if (err) {
                        await // console.log(err);
                        resolve(false);
                    }else{
                        resolve(true);
                    }
                });
            });
        }else{
            // console.log("product_details.Product_Code != 'NULL'");
            resolve(false);
        }
    }else{
        // console.log("product_details.Product_Code != undefined && product_details.Creator != undefined && product_details.Creator != 'NULL'");
        resolve(false);
    }
}

async function insert_existing_product_code(product_details){
    // console.log("insert_existing_product_code");
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
                    GroupBuy_SellQuantity,
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
                    Tax,
                    Stock_Quantity
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
                    '${product_details.GroupBuy_SellQuantity}',
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
                    '${product_details.Tax}',
                    '${product_details.Stock_Quantity}'
                );`;
            return new Promise(async resolve => {
                await con.query(sql, async function (err, result) {
                    if (err) await // console.log(err);
                    resolve(true);
                });
            });
        }
    }
}

// read product from excel form
async function read_excel(){
    // console.log("read_excel");
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
                GroupBuy_SellQuantity: excelDatas[i][16],
                In_Store_Price: excelDatas[i][17],
                //new 
                Creator: excelDatas[i][18],
                Modifier: excelDatas[i][19],
                Weight_KG: excelDatas[i][20],
                Dimension_CM_CUBIC: excelDatas[i][21],
                Tax: excelDatas[i][22]
            }
        );
    }
    return new Promise(async resolve => {
        resolve(product_datas);
    });
}

app.get('/download-sample-product-management-excel', (req, res) => {
    const file = `./Product Details Sample.xlsx`;
    res.download(file); // Set disposition and send it.
})

app.listen(port, () => {
    // console.log(`Example app listening at http://localhost:${port}`)
})
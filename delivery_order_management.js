process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
var request = require('request');
var mysql = require('mysql');
const app = express();
const port = 3004;
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

//get-delivery-order
app.post('/get-delivery-order',  async (req, res) => {
    var Delivery_Order_Number = req.query.Delivery_Order_Number;
    if(Delivery_Order_Number != undefined){
        if(
            (await check_Delivery_Order_Number_existance(Delivery_Order_Number).then(async value => {
                return await value;
            }))
        ){
            if(
                (await get_delivery_order_based_on_delivery_order_number(Delivery_Order_Number).then(async value => {
                    return await value;
                })).status
            ){
                res.send(
                    (await get_delivery_order_based_on_delivery_order_number(Delivery_Order_Number).then(async value => {
                        return await value;
                    })).data
                );
            }else{
                res.send({
                    status: false,
                    reason: "fail"
                });
            }
        }else{
            res.send({
                status: false,
                reason: "this Delivery_Order_Number does not exist"
            });
        }
    }else{
        res.send(
            (await get_delivery_order().then(async value => {
                return await value;
            })).data
        );
    }
    
})

async function get_delivery_order(){
    var sql = `
        select * from vtportal.delivery_order_management
        WHERE Delete_Mark != '1';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined){
                if(result[0] != undefined){
                    resolve({
                        status: true,
                        data: result
                    });
                }else{
                    resolve(false);
                }
            }else{
                resolve(false);
            }
        });
    });
}

async function get_delivery_order_based_on_delivery_order_number(Delivery_Order_Number){
    var sql = `
        select * from vtportal.delivery_order_management
        WHERE Delivery_Order_Number = '${Delivery_Order_Number}'
        and Delete_Mark != '1';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined){
                if(result[0] != undefined){
                    resolve({
                        status: true,
                        data: result[0]
                    });
                }else{
                    resolve(false);
                }
            }else{
                resolve(false);
            }
        });
    });
}

//delete-delivery-order
app.post('/delete-delivery-order',  async (req, res) => {
    var Delivery_Order_Number = req.query.Delivery_Order_Number;
    var Deleter = req.query.Deleter;
    if(Delivery_Order_Number != undefined && Deleter != undefined){
        if(
            (await check_Delivery_Order_Number_existance(Delivery_Order_Number).then(async value => {
                return await value;
            }))
        ){
            if(
                (await delete_delivery_order(Delivery_Order_Number, Deleter).then(async value => {
                    return await value;
                }))
            ){
                res.send({
                    status: true,
                    reason: "success"
                });
            }else{
                res.send({
                    status: false,
                    reason: "fail"
                });
            }
        }else{
            res.send({
                status: false,
                reason: "this Delivery_Order_Number does not exist"
            });
        }
    }else{
        res.send({
            status: false,
            reason: "param incomplete"
        });
    }
    
})

async function delete_delivery_order(Delivery_Order_Number, Deleter){
    var sql = `
        UPDATE vtportal.delivery_order_management
        SET Status = 'delayed'
        , Deleter = '${Deleter}'
        , Delete_Date = CURRENT_TIMESTAMP()
        , Delete_Mark = '1'
        WHERE Delivery_Order_Number = '${Delivery_Order_Number}';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

//update-delivery-order-pending-status-to-approving
app.post('/update-delivery-order-pending-status-to-approving',  async (req, res) => {
    var Delivery_Order_Number = req.query.Delivery_Order_Number;
    var Auditor_Id = req.query.Auditor_Id;
    if(Delivery_Order_Number != undefined 
        && Auditor_Id !=undefined
        ){
        if(
            (await check_Delivery_Order_Number_existance(Delivery_Order_Number).then(async value => {
                return await value;
            }))
        ){
            if(
                (await update_delivery_order_pending_status_to_approving_locally_MYSQL(
                    Delivery_Order_Number
                    , Auditor_Id).then(async value => {
                    return await value;
                }))
            ){
                res.send({
                    status: true,
                    reason: "successful update dimension locally, please make an API call to 3rd party API"
                });
            }else{
                res.send({
                    status: false,
                    reason: "fail"
                });
            }
        }else{
            res.send({
                status: false,
                reason: "this Delivery_Order_Number does not exist"
            });
        }
    }else{
        res.send({
            status: false,
            reason: "You are not providing enough parameters"
        });
    }
    
})

async function update_delivery_order_pending_status_to_approving_locally_MYSQL(
    Delivery_Order_Number
    , Auditor_Id){
    var sql = `
        UPDATE vtportal.delivery_order_management
        SET Auditor_Id = '${Auditor_Id}'
        , Audited_Date = CURRENT_TIMESTAMP()
        , Update_date = CURRENT_TIMESTAMP()
        , Status = 'approving'
        WHERE Delivery_Order_Number = '${Delivery_Order_Number}'
        and Delete_Mark != '1';
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

//update-delivery-order-item-dimension
app.post('/update-delivery-order-item-dimension',  async (req, res) => {
    var Delivery_Order_Number = req.query.Delivery_Order_Number;
    var Total_Dimension_Packing_CM_Cubic = req.query.Total_Dimension_Packing_CM_Cubic;
    var Total_Weight_KG = req.query.Total_Weight_KG;
    var Modifier = req.query.Modifier;
    if(Delivery_Order_Number != undefined 
        && Total_Dimension_Packing_CM_Cubic !=undefined
        && Total_Weight_KG !=undefined
        && Modifier !=undefined
        ){
        if(
            (await check_Delivery_Order_Number_existance(Delivery_Order_Number).then(async value => {
                return await value;
            }))
        ){
            if(
                (await update_delivery_order_item_dimension_locally_MYSQL(
                    Delivery_Order_Number
                    , Total_Dimension_Packing_CM_Cubic
                    , Total_Weight_KG
                    , Modifier).then(async value => {
                    return await value;
                }))
            ){
                res.send({
                    status: true,
                    reason: "successful update dimension locally, please make an API call to 3rd party API"
                });
            }else{
                res.send({
                    status: false,
                    reason: "fail"
                });
            }
        }else{
            res.send({
                status: false,
                reason: "this Delivery_Order_Number does not exist"
            });
        }
    }else{
        res.send({
            status: false,
            reason: "You are not providing enough parameters"
        });
    }
    
})

async function update_delivery_order_item_dimension_locally_MYSQL(
    Delivery_Order_Number
    , Total_Dimension_Packing_CM_Cubic
    , Total_Weight_KG
    , Modifier){
    var sql = `
        UPDATE vtportal.delivery_order_management
        SET Shipping_Address = '${Total_Dimension_Packing_CM_Cubic}'
        , Shipping_Contact_Number = '${Total_Weight_KG}'
        , Modifier = '${Modifier}'
        , Update_date = CURRENT_TIMESTAMP()
        , Status = 'pending'
        WHERE Delivery_Order_Number = '${Delivery_Order_Number}'
        and Delete_Mark != '1';
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

//update-delivery-order-shipping-info
app.post('/update-delivery-order-shipping-info',  async (req, res) => {
    var Delivery_Order_Number = req.query.Delivery_Order_Number;
    var Shipping_Address = req.query.Shipping_Address;
    var Shipping_Contact_Number = req.query.Shipping_Contact_Number;
    var Shipping_Fee = req.query.Shipping_Fee;
    var Shipping_Number = req.query.Shipping_Number;
    var Modifier = req.query.Modifier;
    var Courier = req.query.Courier;
    if(Delivery_Order_Number != undefined 
        && Shipping_Address !=undefined
        && Shipping_Contact_Number !=undefined
        && Shipping_Fee !=undefined
        && Shipping_Number !=undefined
        && Courier !=undefined
        && Modifier !=undefined
        ){
        if(
            (await check_Delivery_Order_Number_existance(Delivery_Order_Number).then(async value => {
                return await value;
            }))
        ){
            if(
                (await update_delivery_order_shipping_information_local_MYSQL(Delivery_Order_Number
                    , Shipping_Address
                    , Shipping_Contact_Number
                    , Shipping_Fee
                    , Shipping_Number
                    , Courier
                    ,Modifier).then(async value => {
                    return await value;
                }))
            ){
                res.send({
                    status: true,
                    reason: "successful update shipping information locally, please make an API call to 3rd party API"
                });
            }else{
                res.send({
                    status: false,
                    reason: "fail"
                });
            }
        }else{
            res.send({
                status: false,
                reason: "this Delivery_Order_Number does not exist"
            });
        }
    }else{
        res.send({
            status: false,
            reason: "You are not providing enough parameters"
        });
    }
    
})

async function update_delivery_order_shipping_information_local_MYSQL(
    Delivery_Order_Number
    , Shipping_Address
    , Shipping_Contact_Number
    , Shipping_Fee
    , Shipping_Number
    , Courier
    , Modifier){
    var sql = `
        UPDATE vtportal.delivery_order_management
        SET Shipping_Address = '${Shipping_Address}'
        , Shipping_Contact_Number = '${Shipping_Contact_Number}'
        , Shipping_Fee = '${Shipping_Fee}'
        , Shipping_Number = '${Shipping_Number}'
        , Courier = '${Courier}'
        , Modifier = '${Modifier}'
        , Update_date = CURRENT_TIMESTAMP()
        , Status = 'pending'
        WHERE Delivery_Order_Number = '${Delivery_Order_Number}'
        and Delete_Mark != '1';
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

//update-delivery-order-status
app.post('/update-delivery-order-status',  async (req, res) => {
    var Delivery_Order_Number = req.query.Delivery_Order_Number;
    var update_status = req.query.Update_Status;
    var Modifier = req.query.Modifier;
    if(Delivery_Order_Number != undefined && update_status != undefined && Modifier != undefined){
        if(
            (await check_Delivery_Order_Number_existance(Delivery_Order_Number).then(async value => {
                return await value;
            }))
        ){
            if(
                (await update_delivery_order_status(Delivery_Order_Number, update_status, Modifier).then(async value => {
                    return await value;
                }))
            ){
                res.send({
                    status: true,
                    reason: "success"
                });
            }else{
                res.send({
                    status: false,
                    reason: "fail"
                });
            }
        }else{
            res.send({
                status: false,
                reason: "this Delivery_Order_Number does not exist"
            });
        }
    }else{
        res.send({
            status: false,
            reason: "param incomplete"
        });
    }
    
})

async function update_delivery_order_status(Delivery_Order_Number, update_status, Modifier){
    var sql = `
        UPDATE vtportal.delivery_order_management
        SET Delivery_Status = '${update_status}',
        Modifier = '${Modifier}',
        Update_date = CURRENT_TIMESTAMP()
        , Status = 'pending'
        WHERE Delivery_Order_Number = '${Delivery_Order_Number}'
        and Delete_Mark != '1';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
} 

async function check_Delivery_Order_Number_existance(Delivery_Order_Number){
    var sql = `select * from vtportal.delivery_order_management where upper(Delivery_Order_Number) = '${Delivery_Order_Number.toUpperCase()}' and Delete_Mark != '1' limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    });
}

//create-new-delivery-order
app.post('/create-new-delivery-order',  async (req, res) => {
    var Order_Number = req.query.Order_Number;
    var Delivery_Order_Data = req.body.Delivery_Order_Data;
    var Delivery_Order_Detail_data = req.body.Delivery_Order_Detail_data;
    var Creator = req.query.Creator;
    if(Order_Number != undefined && Creator != undefined && Delivery_Order_Data != undefined && Delivery_Order_Detail_data != undefined){
        if(
            (await check_Order_Number_existance(Order_Number).then(async value => {
                return await value;
            }))
        ){
            if(
                await validation_check(Delivery_Order_Data, Order_Number).then(async value => {
                    return await value;
                })
            ){
                var Delivery_Order_Number = await delivery_order_number_creation().then(async value => {
                        return await value;
                });

                if(
                    await create_new_delivery_order(Delivery_Order_Data, Delivery_Order_Detail_data, Delivery_Order_Number, Creator).then(async value => {
                        return await value;
                    })
                ){
                    res.send({
                        status: true,
                        Delivery_Order_Number: Delivery_Order_Number
                    });
                }
            }else{
                res.send({
                    status: false,
                    reason: "this order is invalid",
                    subreason: "Order_Number is mismatch"
                });
            }
        }else{
            res.send({
                status: false,
                reason: "this sales order does not exist, you cannot create delivery order from non existing sales order"
            });
        }
    }
    
})

async function create_new_delivery_order(Delivery_Order_Data, Delivery_Order_Detail_data, Delivery_Order_Number, Creator){
    return new Promise(async resolve => {
        if(
            (
                await insert_into_delivery_order_management(Delivery_Order_Data, Delivery_Order_Number, Creator).then(async value => {
                    return await value;
                })
            )
        ){
            var i = 0;
            for(i; i < Delivery_Order_Detail_data.length;){
                if(
                    await insert_into_delivery_order_detail_management(Delivery_Order_Detail_data[i], Delivery_Order_Number).then(async value => {
                        return await value;
                    })
                ){
                    i++;
                }else{
                    resolve(false);
                }
            }
            resolve(true);
        }else{
            resolve(false);
        }
    });
} 

async function insert_into_delivery_order_detail_management(Delivery_Order_Detail_data, Delivery_Order_Number){
    var sql = `
        INSERT INTO vtportal.delivery_order_detail_management 
        (
            Order_Number,
            Delivery_Order_Number,
            Product_Code,
            Product_Name,
            Quantity_Requested
        )
        VALUES 
        (
            '${Delivery_Order_Detail_data.Order_Number}',
            '${Delivery_Order_Number}',
            '${Delivery_Order_Detail_data.Product_Code}',
            '${Delivery_Order_Detail_data.Product_Name}',
            '${Delivery_Order_Detail_data.Quantity_Requested}'
        );
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
} 

async function insert_into_delivery_order_management(Delivery_Order_Data, Delivery_Order_Number, Creator){
    var sql = `
        INSERT INTO vtportal.delivery_order_management 
        (
            Order_Number,
            Delivery_Order_Number,
            Total_Quantity,
            Unit,
            Shipping_Address,
            Shipping_Contact_Number,
            Shipping_Fee,
            Primary_Recipient_Name,
            Status,
            Created_Date,
            Courier,
            Total_Dimension_Packing_CM_Cubic,
            Total_Weight_KG,
            Delivery_Status,
            Creator,
            Create_Date,
            Modifier,
            Update_date,
            Delete_Mark
        )
        VALUES 
        (
            '${Delivery_Order_Data.Order_Number}',
            '${Delivery_Order_Number}',
            '${Delivery_Order_Data.Total_Quantity}',
            '${Delivery_Order_Data.Unit}',
            '${Delivery_Order_Data.Shipping_Address}',
            '${Delivery_Order_Data.Shipping_Contact_Number}',
            '${Delivery_Order_Data.Shipping_Fee}',
            '${Delivery_Order_Data.Primary_Recipient_Name}',
            'pending',
            CURDATE(),
            '${Delivery_Order_Data.Courier}',
            '${Delivery_Order_Data.Total_Dimension_Packing_CM_Cubic}',
            '${Delivery_Order_Data.Total_Weight_KG}',
            'pending',
            '${Creator}',
            CURRENT_TIMESTAMP(),
            '${Creator}',
            CURRENT_TIMESTAMP(),
            '0'
        );
    `;

    if(Delivery_Order_Data.Delivery_Status != undefined && Delivery_Order_Data.Delivery_Status.length > 0
        && Delivery_Order_Data.Shipping_Number != undefined && Delivery_Order_Data.Shipping_Number.length > 0){
        sql = `
            INSERT INTO vtportal.delivery_order_management 
            (
                Order_Number,
                Delivery_Order_Number,
                Total_Quantity,
                Unit,
                Shipping_Address,
                Shipping_Contact_Number,
                Shipping_Fee,
                Primary_Recipient_Name,
                Status,
                Created_Date,
                Courier,
                Total_Dimension_Packing_CM_Cubic,
                Total_Weight_KG,
                Delivery_Status,
                Shipping_Number,
                Creator,
                Create_Date,
                Modifier,
                Update_date,
                Delete_Mark
            )
            VALUES 
            (
                '${Delivery_Order_Data.Order_Number}',
                '${Delivery_Order_Number}',
                '${Delivery_Order_Data.Total_Quantity}',
                '${Delivery_Order_Data.Unit}',
                '${Delivery_Order_Data.Shipping_Address}',
                '${Delivery_Order_Data.Shipping_Contact_Number}',
                '${Delivery_Order_Data.Shipping_Fee}',
                '${Delivery_Order_Data.Primary_Recipient_Name}',
                'pending',
                CURDATE(),
                '${Delivery_Order_Data.Courier}',
                '${Delivery_Order_Data.Total_Dimension_Packing_CM_Cubic}',
                '${Delivery_Order_Data.Total_Weight_KG}',
                '${Delivery_Order_Data.Delivery_Status}',
                '${Delivery_Order_Data.Shipping_Number}',
                '${Creator}',
                CURRENT_TIMESTAMP(),
                '${Creator}',
                CURRENT_TIMESTAMP(),
                '0'
            );
        `;
    }
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
} 

async function delivery_order_number_creation(){
    return new Promise(async resolve => {
        var first_digits = Math.floor((Math.random() * 999) + 9999);
        var middle_digits = Math.floor((Math.random() * 3333) + 9999);
        var last_digits = Math.floor((Math.random() * 6666) + 9999);
        var today = new Date();
        var d = today.getDate();
        var mth = today.getMonth() + 1;
        var y = today.getFullYear();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();
        var time_stamp = d + `DO${first_digits}YU` + mth + `DO${middle_digits}YU` + y + `DO${last_digits}YU` + h + `DO${first_digits+last_digits}YU` + m + `DO${middle_digits+last_digits}YU` + s;
        resolve(time_stamp);
    });
}   

async function validation_check(Delivery_Order_Data, Order_Number){
    return new Promise(async resolve => {
        if(
            (Delivery_Order_Data.Order_Number == Order_Number)
        ){
            resolve(true);
        }else{
            resolve(false);
        }
    });
}   

async function check_Order_Number_existance(Order_Number){
    var sql = `select * from vtportal.sales_order_management where upper(Order_Number) = '${Order_Number.toUpperCase()}' and Delete_Mark != '1' limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(true);
            }else{
                resolve(false);
            }
        });
    });
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
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

//update-delivery-order-status
app.post('/update-delivery-order-status',  async (req, res) => {
    var Delivery_Order_Number = req.query.Delivery_Order_Number;
    var update_status = req.query.Update_Status;
    if(Delivery_Order_Number != undefined){
        if(
            (await check_Delivery_Order_Number_existance(Delivery_Order_Number).then(async value => {
                return await value;
            }))
        ){
            if(
                (await update_delivery_order_status(Delivery_Order_Number, update_status).then(async value => {
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
            reason: "this Delivery_Order_Number does not exist"
        });
    }
    
})

async function update_delivery_order_status(Delivery_Order_Number, update_status){
    var sql = `
        UPDATE vtportal.delivery_order_management
        SET Delivery_Status = '${update_status}'
        WHERE Delivery_Order_Number = '${Delivery_Order_Number}';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
} 

async function check_Delivery_Order_Number_existance(Delivery_Order_Number){
    var sql = `select * from vtportal.delivery_order_management where upper(Delivery_Order_Number) = '${Delivery_Order_Number.toUpperCase()}' and Status != 'deleted' limit 1;`;
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
    if(Order_Number != undefined && Delivery_Order_Data != undefined && Delivery_Order_Detail_data != undefined){
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
                    await create_new_delivery_order(Delivery_Order_Data, Delivery_Order_Detail_data, Delivery_Order_Number).then(async value => {
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

async function create_new_delivery_order(Delivery_Order_Data, Delivery_Order_Detail_data, Delivery_Order_Number){
    return new Promise(async resolve => {
        if(
            (
                await insert_into_delivery_order_management(Delivery_Order_Data, Delivery_Order_Number).then(async value => {
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

async function insert_into_delivery_order_management(Delivery_Order_Data, Delivery_Order_Number){
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
            Delivery_Status
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
            'active',
            CURDATE(),
            '${Delivery_Order_Data.Courier}',
            '${Delivery_Order_Data.Total_Dimension_Packing_CM_Cubic}',
            '${Delivery_Order_Data.Total_Weight_KG}',
            'not assigned'
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
                Shipping_Number
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
                'active',
                CURDATE(),
                '${Delivery_Order_Data.Courier}',
                '${Delivery_Order_Data.Total_Dimension_Packing_CM_Cubic}',
                '${Delivery_Order_Data.Total_Weight_KG}',
                '${Delivery_Order_Data.Delivery_Status}',
                '${Delivery_Order_Data.Shipping_Number}'
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
    var sql = `select * from vtportal.sales_order_management where upper(Order_Number) = '${Order_Number.toUpperCase()}' and Status != 'deleted' limit 1;`;
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
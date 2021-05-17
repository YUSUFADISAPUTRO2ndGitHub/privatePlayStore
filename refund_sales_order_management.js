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

//create-cancel-and-refund-order
app.post('/create-cancel-and-refund-order',  async (req, res) => {
    var Order_Number = req.query.Order_Number;
    var Customer_Code = req.body.Customer_Code;
    if(Order_Number != undefined && Customer_Code != undefined){
        if(
            (await check_Order_Number_existance(Order_Number).then(async value => {
                return await value;
            }))
        ){
                var Refund_Order_Number = await refund_order_number_creation().then(async value => {
                        return await value;
                });

                if(
                    await create_new_refund_order(Order_Number, Customer_Code, Refund_Order_Number).then(async value => {
                        return await value;
                    })
                ){
                    res.send({
                        status: true,
                        Refund_Order_Number: Refund_Order_Number
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

async function create_new_refund_order(Order_Number, Customer_Code, Refund_Order_Number){
    return new Promise(async resolve => {
        if(
            (
                await insert_into_refund_order_management(Order_Number, Customer_Code, Refund_Order_Number).then(async value => {
                    return await value;
                })
            )
        ){
            resolve(true);
        }else{
            resolve(false);
        }
    });
}  

async function insert_into_refund_order_management(Order_Number, Customer_Code, Refund_Order_Number){
    var sql = `
        INSERT INTO vtportal.delivery_order_management 
        (
            Refund_Number,
            Sales_Order_Number,
            Customer_Code,
            Refund_Payment_Status,
            Start_Date,
            Creator,
            Create_Date,
            Modifier,
            Update_date,
            Delete_Mark
        )
        VALUES 
        (
            '${Refund_Order_Number}',
            '${Order_Number}',
            '${Customer_Code}',
            'pending',
            CURRENT_TIMESTAMP(),
            '${Customer_Code}',
            CURRENT_TIMESTAMP(),
            '${Customer_Code}',
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
                Start_Date,
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
                CURRENT_TIMESTAMP(),
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

async function refund_order_number_creation(){
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
        var time_stamp = d + `RE${first_digits}FU` + mth + `RE${middle_digits}FU` + y + `RE${last_digits}FU` + h + `RE${first_digits+last_digits}FU` + m + `RE${middle_digits+last_digits}FU` + s;
        resolve(time_stamp);
    });
}   

async function check_Order_Number_existance(Order_Number){
    var sql = `select * from vtportal.sales_order_management where upper(Order_Number) = '${Order_Number.toUpperCase()}' 
    and Delete_Mark != '1' and upper(Status) = 'pending' limit 1;`;
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
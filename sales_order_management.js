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
            setTimeout(handleDisconnect, 2000);
        }
    });
    con.on('error', function(err) {
        console.log('db error', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            handleDisconnect();
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

//get-sales-order-data-per-customer
app.get('/get-sales-order-data-per-customer',  async (req, res) => {
    var Customer_Code = req.query.Customer_Code;
    if(Customer_Code != undefined){
        res.send(
            (await get_sales_order_based_on_customer_code(Customer_Code).then(async value => {
                return await value;
            }))
        );
    }else{
        res.send({
            status: false,
            reason: "Order_Number is incomplete"
        });
    }
})

async function get_sales_order_based_on_customer_code(Customer_Code){
    var sql = `
        select * from 
        vtportal.sales_order_management so
        where so.Customer_Code = '${Customer_Code}';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
} 

//get-sales-order-data-and-detail
app.get('/get-sales-order-data-and-detail',  async (req, res) => {
    var Order_Number = req.query.Order_Number;
    if(Order_Number != undefined){
        res.send(
            (await get_sales_order_based_on_order_number(Order_Number).then(async value => {
                return await value;
            }))
        );
    }else{
        res.send({
            status: false,
            reason: "Order_Number is incomplete"
        });
    }
})

async function get_sales_order_based_on_order_number(Order_Number){
    var sql = `
        select * from 
        vtportal.sales_order_management so
        inner join 
        vtportal.sales_order_detail_management sod
        on so.Order_Number = sod.Order_Number
        where so.Order_Number = '${Order_Number}';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
} 

//update-sales-order-payment-status-to-waitpay
app.post('/update-sales-order-payment-status-to-waitpay',  async (req, res) => {
    var Order_Number = req.query.Order_Number;
    if(Order_Number != undefined){
        res.send(
            (await update_Sales_Order_Payment_status_to_waitpay(Order_Number).then(async value => {
                return await value;
            }))  
        );
    }else{
        res.send({
            status: false,
            reason: "Order_Number is incomplete"
        });
    }
})

async function update_Sales_Order_Payment_status_to_waitpay(Order_Number){
    var sql = `
        UPDATE vtportal.sales_order_management
        SET 
        Payment_Status = 'waitpay'
        WHERE Order_Number = '${Order_Number}';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
} 

//update-sales-order-payment-status-to-cancelled
app.post('/update-sales-order-payment-status-to-cancelled',  async (req, res) => {
    var Order_Number = req.query.Order_Number;
    if(Order_Number != undefined){
        res.send(
            (await update_Sales_Order_Payment_status_to_cancelled(Order_Number).then(async value => {
                return await value;
            }))  
        );
    }else{
        res.send({
            status: false,
            reason: "Order_Number is incomplete"
        });
    }
})

async function update_Sales_Order_Payment_status_to_cancelled(Order_Number){
    var sql = `
        UPDATE vtportal.sales_order_management
        SET 
        Payment_Status = 'cancelled'
        WHERE Order_Number = '${Order_Number}';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
} 

//update-sales-order-payment-status-to-payment
app.post('/update-sales-order-payment-status-to-payment',  async (req, res) => {
    var Order_Number = req.query.Order_Number;
    if(Order_Number != undefined){
        res.send(
            (await update_Sales_Order_Payment_status_to_payment(Order_Number).then(async value => {
                return await value;
            }))  
        );
    }else{
        res.send({
            status: false,
            reason: "Order_Number is incomplete"
        });
    }
})

async function update_Sales_Order_Payment_status_to_payment(Order_Number){
    var sql = `
        UPDATE vtportal.sales_order_management
        SET 
        Payment_Status = 'payment'
        WHERE Order_Number = '${Order_Number}';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
} 

//update-sales-order-detail
app.post('/update-sales-order-detail',  async (req, res) => {
    var Customer_Code = req.query.Customer_Code;
    var Order_Number = req.query.Order_Number;
    var Sales_Order_Detail_data = req.body.Sales_Order_Detail_data;
    if(Customer_Code != undefined && Order_Number != undefined && Sales_Order_Detail_data != undefined){
        var existance_data = (await check_if_sales_order_exist_with_customer_code(Customer_Code, Order_Number).then(async value => {
            return await value;
        }));
        if(existance_data.status){
            if(
                !(await check_delivery_order_data_regarding_sales_order_number(Order_Number).then(async value => {
                    return await value;
                }))
            ){
                if(
                    (await iterate_through_sales_order_detail_update(Order_Number, Sales_Order_Detail_data).then(async value => {
                        return await value;
                    }))
                ){
                    res.send({
                        status: true
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
                    reason: "it has active delivery order, please delete the delivery order first"
                });
            }
        }else{
            res.send({
                status: false,
                reason: "data does not exist"
            });
        }
    }else{
        res.send({
            status: false,
            reason: "Customer_Code is incomplete or Order_Number is incomplete"
        });
    }
})

async function iterate_through_sales_order_detail_update(Order_Number, Sales_Order_Detail_data){
    return new Promise(async resolve => {
        if(
            (await delete_all_Sales_Order_Detail_data(Order_Number).then(async value => {
                return await value;
            }))
        ){
            var Total_Quantity_Requested = 0;
            var Total_Price_Based_On_Total_Quantity = 0;
            var i = 0;
            for(i; i < Sales_Order_Detail_data.length;){
                if(
                    (await update_Sales_Order_Detail_data(Order_Number, Sales_Order_Detail_data[i]).then(async value => {
                        return await value;
                    }))
                ){
                    Total_Quantity_Requested = Total_Quantity_Requested + parseFloat(Sales_Order_Detail_data[i].Quantity_Requested);
                    Total_Price_Based_On_Total_Quantity = Total_Price_Based_On_Total_Quantity + parseFloat(Sales_Order_Detail_data[i].Price_Based_On_Total_Quantity);
                    i++;
                }else{
                    resolve(false);
                }
            }
            if(
                (await update_total_quantity_and_total_price(Order_Number, Total_Quantity_Requested, Total_Price_Based_On_Total_Quantity).then(async value => {
                    return await value;
                }))
            ){
                resolve(true);   
            }else{
                resolve(false);
            }   
        }else{
            resolve(false);
        }
    });
}

async function update_total_quantity_and_total_price(Order_Number, Total_Quantity_Requested, Total_Price_Based_On_Total_Quantity){
    var sql = `
        UPDATE vtportal.sales_order_management
        SET Total_Price = '${Total_Price_Based_On_Total_Quantity}',
        Total_Quantity = '${Total_Quantity_Requested}'
        WHERE Order_Number = '${Order_Number}';
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

async function update_Sales_Order_Detail_data(Order_Number, Sales_Order_Detail_data){
    return new Promise(async resolve => {
        resolve(
            (await insert_into_sales_order_detail_management(Sales_Order_Detail_data, Order_Number).then(async value => {
                return await value;
            }))
        );
    });
} 

async function delete_all_Sales_Order_Detail_data(Order_Number){
    var sql = `
        delete from vtportal.sales_order_detail_management
        WHERE Order_Number = '${Order_Number}';
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

//update-sales-order
app.post('/update-sales-order',  async (req, res) => {
    var Customer_Code = req.query.Customer_Code;
    var Order_Number = req.query.Order_Number;
    var Sales_Order_Data = req.body.Sales_Order_Data;
    if(Customer_Code != undefined && Order_Number != undefined && Sales_Order_Data != undefined){
        var existance_data = (await check_if_sales_order_exist_with_customer_code(Customer_Code, Order_Number).then(async value => {
            return await value;
        }));
        if(existance_data.status){
            if(
                !(await check_delivery_order_data_regarding_sales_order_number(Order_Number).then(async value => {
                    return await value;
                }))
            ){
                if(
                    (await update_sales_order_data(Order_Number, Sales_Order_Data).then(async value => {
                        return await value;
                    }))
                ){
                    res.send({
                        status: true,
                        reason: Sales_Order_Data
                    });
                }else{
                    res.send({
                        status: false,
                        reason: "update failed"
                    });
                }
            }else{
                res.send({
                    status: false,
                    reason: "it has active delivery order, please delete the active delivery order before continuing"
                });
            }
        }else{
            res.send({
                status: false,
                reason: "data does not exist"
            });
        }
    }else{
        res.send({
            status: false,
            reason: "Customer_Code is incomplete or Order_Number is incomplete"
        });
    }
})

async function update_sales_order_data(Order_Number, Sales_Order_Data){
    var sql = `
        UPDATE vtportal.sales_order_management
        SET Status = 'active',
        Customer_Code = '${Sales_Order_Data.Customer_Code}',
        Unit = '${Sales_Order_Data.Unit}',
        Shipping_Address = '${Sales_Order_Data.Shipping_Address}',
        Shipping_Contact_Number = '${Sales_Order_Data.Shipping_Contact_Number}',
        Payment_Method = '${Sales_Order_Data.Payment_Method}',
        Shipping_Fee = '${Sales_Order_Data.Shipping_Fee}',
        Primary_Recipient_Name = '${Sales_Order_Data.Primary_Recipient_Name}'
        WHERE Order_Number = '${Order_Number}';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
} 

async function check_delivery_order_data_regarding_sales_order_number(Order_Number){
    var sql = `
        select * from vtportal.delivery_order_management
        WHERE Order_Number = '${Order_Number}' and Status != 'deleted';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined){
                    if(result[0] != undefined){
                        if(result[0].Order_Number == Order_Number){
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

//delete-sales-order
app.post('/delete-sales-order',  async (req, res) => {
    var Customer_Code = req.query.Customer_Code;
    var Order_Number = req.query.Order_Number;
    if(Customer_Code != undefined && Order_Number != undefined){
        var existance_data = (await check_if_sales_order_exist_with_customer_code(Customer_Code, Order_Number).then(async value => {
            return await value;
        }));
        if(existance_data.status){
            var existance_data_in_delivery_order = (await check_if_sales_order_has_delivery_order(Order_Number).then(async value => {
                return await value;
            }));
            if(existance_data_in_delivery_order.status == true){
                res.send({
                    status: false,
                    reason: "data cannot be deleted because it has gone to delivery order"
                });
            }else{
                if(
                    (await update_sales_order_status_to_deleted(Order_Number).then(async value => {
                        return await value;
                    }))
                ){
                    res.send({
                        status: true,
                        reason: Order_Number
                    });
                }else{
                    res.send({
                        status: false,
                        reason: "data cannot be deleted"
                    });
                }
            }
        }else{
            res.send({
                status: false,
                reason: "data does not exist"
            });
        }
    }else{
        res.send({
            status: false,
            reason: "Customer_Code is incomplete or Order_Number is incomplete"
        });
    }
})

async function update_sales_order_status_to_deleted(Order_Number){
    var sql = `
        UPDATE vtportal.sales_order_management
        SET Status = 'deleted'
        WHERE Order_Number = '${Order_Number}';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
} 

async function check_if_sales_order_has_delivery_order(Order_Number){
    var sql = `
        select * from vtportal.delivery_order_management where Order_Number = '${Order_Number}' and Status != 'deleted' limit 1;
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined){
                if(result[0] != undefined){
                    resolve(
                        {
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

async function check_if_sales_order_exist_with_customer_code(Customer_Code, Order_Number){
    var sql = `
        select * from vtportal.sales_order_management where Customer_Code = '${Customer_Code}' and Order_Number = '${Order_Number}' limit 1;
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined){
                if(result[0] != undefined){
                    resolve(
                        {
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

//create-new-sales-order
app.post('/create-new-sales-order',  async (req, res) => {
    var Customer_Code = req.query.Customer_Code;
    var Sales_Order_Data = req.body.Sales_Order_Data;
    var Sales_Order_Detail_data = req.body.Sales_Order_Detail_data;
    if(Customer_Code != undefined && Sales_Order_Data != undefined && Sales_Order_Detail_data != undefined){
        if(
            (await check_customer_code_existance(Customer_Code).then(async value => {
                return await value;
            }))
            &&(await check_customer_code_existance(Sales_Order_Data.Customer_Code).then(async value => {
                return await value;
            }))
        ){
            if(
                await validation_check(Sales_Order_Data, Customer_Code).then(async value => {
                    return await value;
                })
            ){
                var Order_Number = await order_number_creation().then(async value => {
                        return await value;
                });

                if(
                    await create_new_sales_order(Sales_Order_Data, Sales_Order_Detail_data, Order_Number).then(async value => {
                        return await value;
                    })
                ){
                    res.send({
                        status: true,
                        order_number: Order_Number
                    });
                }
            }else{
                res.send({
                    status: false,
                    reason: "this order is invalid",
                    subreason: "this maybe caused by numeric value is 0 or customer code is mismatch between order data and details"
                });
            }
        }else{
            res.send({
                status: false,
                reason: "this customer does not exist"
            });
        }
    }
    
})

async function create_new_sales_order(Sales_Order_Data, Sales_Order_Detail_data, Order_Number){
    return new Promise(async resolve => {
        if(
            (
                await insert_into_sales_order_management(Sales_Order_Data, Order_Number).then(async value => {
                    return await value;
                })
            )
        ){
            var i = 0;
            for(i; i < Sales_Order_Detail_data.length;){
                if(
                    await insert_into_sales_order_detail_management(Sales_Order_Detail_data[i], Order_Number).then(async value => {
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

async function insert_into_sales_order_detail_management(Sales_Order_Detail_data, Order_Number){
    var sql = `
        INSERT INTO vtportal.sales_order_detail_management 
        (
            Customer_Code,
            Order_Number,
            Product_Code,
            Product_Name,
            Quantity_Requested,
            Price_Based_On_Total_Quantity
        )
        VALUES 
        (
            '${Sales_Order_Detail_data.Customer_Code}',
            '${Order_Number}',
            '${Sales_Order_Detail_data.Product_Code}',
            '${Sales_Order_Detail_data.Product_Name}',
            '${Sales_Order_Detail_data.Quantity_Requested}',
            '${Sales_Order_Detail_data.Price_Based_On_Total_Quantity}'
        );
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
} 

async function insert_into_sales_order_management(Sales_Order_Data, Order_Number){
    var sql = `
        INSERT INTO vtportal.sales_order_management 
        (
            Order_Number,
            Customer_Code,
            Total_Price,
            Total_Quantity,
            Unit,
            Shipping_Address,
            Shipping_Contact_Number,
            Payment_Method,
            Shipping_Fee,
            Primary_Recipient_Name,
            Created_Date,
            Status
        )
        VALUES 
        (
            '${Order_Number}',
            '${Sales_Order_Data.Customer_Code}',
            '${Sales_Order_Data.Total_Price}',
            '${Sales_Order_Data.Total_Quantity}',
            '${Sales_Order_Data.Unit}',
            '${Sales_Order_Data.Shipping_Address}',
            '${Sales_Order_Data.Shipping_Contact_Number}',
            '${Sales_Order_Data.Payment_Method}',
            '${Sales_Order_Data.Shipping_Fee}',
            '${Sales_Order_Data.Primary_Recipient_Name}',
            CURDATE(),
            'active'
        );
    `;
    if(Sales_Order_Data.Payment_Method.toUpperCase() == 'BCA VA TRANSFER' || Sales_Order_Data.Payment_Method.toUpperCase().includes('VA')){
        var today = new Date();
        var d = today.getDate();
        var mth = today.getMonth() + 1;
        var y = today.getFullYear();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();
        var final_va = '12943' + y + '' + mth + '' + d + '' + h + '' + m + '' + s + '';
        var sql = `
            INSERT INTO vtportal.sales_order_management 
            (
                Order_Number,
                Customer_Code,
                Total_Price,
                Total_Quantity,
                Unit,
                Shipping_Address,
                Shipping_Contact_Number,
                Payment_Method,
                Shipping_Fee,
                Primary_Recipient_Name,
                Created_Date,
                Status,
                VA_Number,
                Payment_Status
            )
            VALUES 
            (
                '${Order_Number}',
                '${Sales_Order_Data.Customer_Code}',
                '${Sales_Order_Data.Total_Price}',
                '${Sales_Order_Data.Total_Quantity}',
                '${Sales_Order_Data.Unit}',
                '${Sales_Order_Data.Shipping_Address}',
                '${Sales_Order_Data.Shipping_Contact_Number}',
                '${Sales_Order_Data.Payment_Method}',
                '${Sales_Order_Data.Shipping_Fee}',
                '${Sales_Order_Data.Primary_Recipient_Name}',
                CURDATE(),
                'active',
                '${final_va}',
                'waitpay'
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

async function order_number_creation(){
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
        var time_stamp = d + `YU${first_digits}AD` + mth + `YU${middle_digits}AD` + y + `YU${last_digits}AD` + h + `YU${first_digits+last_digits}AD` + m + `YU${middle_digits+last_digits}AD` + s;
        resolve(time_stamp);
    });
}   

async function validation_check(Sales_Order_Data, Customer_Code){
    return new Promise(async resolve => {
        if(
            (Sales_Order_Data.Customer_Code == Customer_Code)
            && (parseFloat(Sales_Order_Data.Total_Price) > 0)
            && (parseInt(Sales_Order_Data.Total_Quantity) > 0)
            && await check_payment_method(Sales_Order_Data.Payment_Method).then(async value => {
                return await value;
            })
        ){
            resolve(true);
        }else{
            resolve(false);
        }
    });
}   

async function check_payment_method(Payment_Method_Name){
    var sql = `select * from vtportal.payment_method_management where upper(Payment_Method_Name) = '${Payment_Method_Name.toUpperCase()}' limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined && result[0] != undefined){
                    resolve(true);
                }else{
                    resolve(false);
                }
            }
        });
    });
}

async function check_customer_code_existance(Customer_Code){
    var sql = `select * from vtportal.customer_management where upper(Customer_Code) = '${Customer_Code.toUpperCase()}' limit 1;`;
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
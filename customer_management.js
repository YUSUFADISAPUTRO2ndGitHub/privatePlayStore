process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
var crypto = require('crypto');
var request = require('request');
var mysql = require('mysql');
var nodemailer = require('nodemailer');
const e = require('express');
const app = express();
const port = 3002;
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

//get-total-commission-of-all-months-gross
app.post('/get-total-commission-of-all-months-gross',  async (req, res) => {
    res.send(
        await get_total_commission_of_all_months(req.query.Customer_Code).then(async value => {
            return await value;
        })
    );
})

async function get_total_commission_of_all_months(Customer_Code){
    var sql = `
    select sum(Total_Price) as Total_Price from vtportal.sales_order_management som 
    where 
    Customer_Code in (
        select Customer_Code from vtportal.customer_management 
        where extra_column_2 ='${Customer_Code}' 
        and Delete_Mark = '0' 
        and Status = 'approving'
    ) 
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

//get-total-active-customers-of-a-referral-code
app.post('/get-total-active-customers-of-a-referral-code',  async (req, res) => {
    res.send(
        await get_total_active_customers_from_a_referral_code(req.query.Customer_Code).then(async value => {
            return await value;
        })
    );
})

async function get_total_active_customers_from_a_referral_code(Customer_Code){
    var sql = `
    select count(*) as total_active_customers from vtportal.sales_order_management som 
    where 
    Customer_Code in (
        select Customer_Code from vtportal.customer_management 
        where extra_column_2 ='${Customer_Code}' 
        and Delete_Mark = '0' 
        and Status = 'approving'
    ) 
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

//get-total-customers-of-a-referral-code
app.post('/get-total-customers-of-a-referral-code',  async (req, res) => {
    res.send(
        await get_total_customers_from_a_referral_code(req.query.Customer_Code).then(async value => {
            return await value;
        })
    );
})


async function get_total_customers_from_a_referral_code(Customer_Code){
    var sql = `
        select count(*) as Total_Customers from vtportal.customer_management where extra_column_2 ='${Customer_Code}'
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

//get-all-sales-orders-for-a-product-code
app.post('/get-all-sales-orders-for-a-product-code',  async (req, res) => {
    if(req.query.Product_Code != undefined && req.query.From_Date != undefined){
        res.send(
            await get_all_sales_order_for_a_product_code_start_date_from(req.query.Product_Code, req.query.From_Date).then(async value => {
                return await value;
            })
        );
    }
    res.send(
        await get_all_sales_order_for_a_product_code(req.query.Product_Code).then(async value => {
            return await value;
        })
    );
})

async function get_all_sales_order_for_a_product_code_start_date_from(Product_Code, From_Date){
    var sql = `
    select 
    sales.Order_Number
    , Product_Code
    , Quantity_Requested
    , Price_Based_On_Total_Quantity
    , sales.Create_Date 
    FROM 
    (select * from vtportal.sales_order_detail_management sodm where Product_Code = '${Product_Code}' group by Order_Number) details_sales
    inner join
    (select * from vtportal.sales_order_management) sales
    on 
    details_sales.Order_Number = sales.Order_Number
    where sales.Delete_Mark = '0' and sales.Create_Date >= '${From_Date}' ;
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

async function get_all_sales_order_for_a_product_code(Product_Code){
    var sql = `
    select 
    sales.Order_Number
    , Product_Code
    , Quantity_Requested
    , Price_Based_On_Total_Quantity
    , sales.Create_Date 
    FROM 
    (select * from vtportal.sales_order_detail_management sodm where Product_Code = '${Product_Code}' group by Order_Number) details_sales
    inner join
    (select * from vtportal.sales_order_management) sales
    on 
    details_sales.Order_Number = sales.Order_Number
    where sales.Delete_Mark = '0';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

//get-available-referral-codes
app.post('/get-available-referral-codes',  async (req, res) => {
    res.send(
        await get_all_avaible_referrals().then(async value => {
            return await value;
        })
    );
})

async function get_all_avaible_referrals(){
    var sql = `
    select Customer_Code, First_Name, Last_Name, Nama_Perusahaan from vtportal.customer_management where Delete_Mark = '0';
    `;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

//get-sales-order-which-referral-code-customer
app.post('/get-sales-order-which-referral-code-customer',  async (req, res) => {
    var referral_customer_code = req.query.referral_customer_code;
    var given_date = req.query.given_date;
    if(referral_customer_code != undefined && given_date != undefined){
        res.send(
            await get_today_salesorder_based_on_referral_code_and_given_date(referral_customer_code, given_date).then(async value => {
                return await value;
            })
        );
    }else if(referral_customer_code != undefined){
        res.send(
            await get_today_salesorder_based_on_referral_code(referral_customer_code).then(async value => {
                return await value;
            })
        );
    }else{
        res.send(false);
    }
})

async function get_today_salesorder_based_on_referral_code(referral_customer_code){
    var sql = `
    select Order_Number, Total_Quantity, Total_Price from vtportal.sales_order_management som 
    where 
    Customer_Code in (
        select Customer_Code from vtportal.customer_management 
        where extra_column_2 = '${referral_customer_code}' 
        and Delete_Mark = '0' and Status = 'approving'
        ) 
    and Create_Date >= CURRENT_DATE();
    `;
    console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

async function get_today_salesorder_based_on_referral_code_and_given_date(referral_customer_code, given_date){
    var sql = `
    select Order_Number, Total_Quantity, Total_Price from vtportal.sales_order_management som 
    where 
    Customer_Code in (
        select Customer_Code from vtportal.customer_management 
        where extra_column_2 = '${referral_customer_code}' 
        and Delete_Mark = '0' and Status = 'approving'
        ) 
    and Create_Date >= '${given_date}';
    `;
    console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

//get-otp
app.post('/get-otp',  async (req, res) => {
    var Email = req.query.Email;
    await send_OTP(Email);
    res.send(true);
})

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'automated.email.sold.co.id@gmail.com',
        pass: 'NOName1414++'
    }
});

var otps= [];
async function send_OTP(Email){
    var automated_email = 'automated.email.sold.co.id@gmail.com';
    if(Email.length > 0){
        var OTP = Math.floor((Math.random() * 999999) + 99999) + "YA";
        await otps.push(OTP);
        console.log("===========================");
        console.log(otps);
        var mailOptions = {
            from: automated_email,
            to: Email,
            subject: 'OTP Sold.co.id',
            text: `
YOUR OTP FOR SOLD.CO.ID:
${OTP}
Do not reply this email
Thank You
From SOLD.CO.ID
            `
        };
    
        await transporter.sendMail(mailOptions, async function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log("==============================================");
                console.log("Success sent email to " + Email);
            }
        });
    }
}

//verify-OTP
app.post('/verify-otp',  async (req, res) => {
    var Email = req.query.Email;
    var User_Password = req.query.User_Password;
    var otp = req.query.otp;
    if(User_Password != undefined && Email != undefined && otp != undefined
        && User_Password.length > 0 && Email.length > 0 && otp.length > 0
        ){
        var user_data_found = await check_user_data_email_and_password(Email, User_Password, otp).then(async value => {
            return await value;
        });
        if(user_data_found.status == true && user_data_found.data.Email.toUpperCase() == Email.toUpperCase()){
            res.send(true);
        }else{
            res.send(false);
        }
    }else{
        res.send(false);
    }
})

//verify-otp-with-unencrypted-password'
app.post('/verify-otp-with-unencrypted-password',  async (req, res) => {
    var Email = req.query.Email;
    var User_Password = req.query.User_Password;
    var otp = req.query.otp;
    if(User_Password != undefined && Email != undefined && otp != undefined
        && User_Password.length > 0 && Email.length > 0 && otp.length > 0
        ){
            var encrypted_password = await encrypt_password(User_Password).then(async value => {
                return await value;
            });
            var user_data_found = await check_user_data_email_and_password(Email, encrypted_password, otp).then(async value => {
                return await value;
            });
            if(user_data_found.status == true && user_data_found.data.Email.toUpperCase() == Email.toUpperCase()){
                res.send(true);
            }else{
                res.send(false);
            }
    }else{
        res.send(false);
    }
})

async function check_user_data_email_and_password(Email, User_Password, otp){
    var sql = `select * from vtportal.customer_management where upper(Email) like '%${Email.toUpperCase()}%' and upper(User_Password) like '%${User_Password.toUpperCase()}%' and Delete_Mark != '1' limit 1;`;
    console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
                resolve(false);
            }else{
                if(result != undefined && result[0] != undefined){
                    console.log("==========================================");
                    console.log("otp from user " + otp);
                    console.log("otps recorded " + otps);
                    var i = 0;
                    var counter = 0;
                    for(i; i < otps.length; i ++){
                        if(otps[i] == otp){
                            otps.splice(i, 1);
                            console.log("==========================================");
                            console.log("otp found");
                            console.log("otps recorded " + otps);
                            resolve({
                                data: result[0],
                                status: true
                            });
                        }else{
                            counter++;
                        }
                    }
                    if(counter == otps.length){
                        console.log("==========================================");
                        console.log("otp not found");
                        console.log("otps recorded " + otps);
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    });
}

//customer forgot password
app.post('/customer-forgot-password-request',  async (req, res) => {
    var Email = req.query.Email;
    var ktp = req.query.ktp;
    var PrimaryContactNumber = req.query.PrimaryContactNumber;
    var requestedNewPassword = req.query.requestedNewPassword;
    var otp = req.query.otp;
    if(PrimaryContactNumber != undefined && Email != undefined && ktp != undefined && otp != undefined){
        var user_data_found = await check_user_data_before_agreeing_to_reset_password(PrimaryContactNumber, ktp, Email, otp).then(async value => {
            return await value;
        });
        if(user_data_found.status == true && user_data_found.data.Email.toUpperCase() == Email.toUpperCase()){
            var encrypted_password = await encrypt_password(requestedNewPassword).then(async value => {
                return await value;
            });
            console.log(Email);
            console.log(PrimaryContactNumber);
            console.log(encrypted_password);
            res.send(
                await update_user_password(Email, PrimaryContactNumber, encrypted_password).then(async value => {
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

async function update_user_password(Email, PrimaryContactNumber, encrypted_password){
    var sql = `
        UPDATE vtportal.customer_management
        SET User_Password = '${encrypted_password}'
        WHERE Email = '${Email}' and Contact_Number_1 = '${PrimaryContactNumber}';
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

async function check_user_data_before_agreeing_to_reset_password(PrimaryContactNumber, ktp, Email, otp){
    var sql = `select * from vtportal.customer_management where upper(Email) like '%${Email.toUpperCase()}%' and upper(ktp) like '%${ktp.toUpperCase()}%' and upper(Contact_Number_1) like '%${PrimaryContactNumber.toUpperCase()}%' and Delete_Mark != '1' limit 1;`;
    console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
            }else{
                if(result != undefined && result[0] != undefined){
                    console.log("==========================================");
                    console.log("otp from user " + otp);
                    console.log("otps recorded " + otps);
                    var i = 0;
                    var counter = 0;
                    for(i; i < otps.length; i ++){
                        if(otps[i] == otp){
                            otps.splice(i, 1);
                            console.log("==========================================");
                            console.log("otp found");
                            console.log("otps recorded " + otps);
                            resolve({
                                data: result[0],
                                status: true
                            });
                        }else{
                            counter++;
                        }
                    }
                    if(counter == otps.length){
                        console.log("==========================================");
                        console.log("otp not found");
                        console.log("otps recorded " + otps);
                        resolve(false);
                    }
                }else{
                    resolve(false);
                }
            }
        });
    });
}

//customer login request
app.post('/customer-login-request',  async (req, res) => {
    var email = req.query.Email;
    var password = req.query.Password;
    var otp = req.query.otp;
    if(password != undefined && email != undefined && password.length > 0 && email.length > 0){
        if(otp != undefined && otp.length > 0){
            if(await verify_OTP_function(password, email, otp).then(async value => {
                return await value;
            })){
                var encrypted_password = await encrypt_password(password).then(async value => {
                    return await value;
                });
                var login_data = await get_user_credentials(email, encrypted_password).then(async value => {
                    return await value;
                });
                if(login_data.status == true){
                    await update_last_login(email, encrypted_password).then(async value => {
                        return await value;
                    });
                    res.send(login_data.data.Customer_Code);
                }else{
                    res.send(false);
                }
            }else{
                console.log("list OTP NOw: " + otps);
                console.log("otp is not verified " + otp);
                res.send(false);
            }
        }else{
            console.log("no OTP is given " + otp);
            res.send(false);
        }
    }else{
        console.log("email and password not provided");
        res.send(false);
    }
})

async function verify_OTP_function(User_Password, Email, otp){
    var encrypted_password = await encrypt_password(User_Password).then(async value => {
        return await value;
    });
    var options = {
        'method': 'POST',
        'url': `http://localhost:3002/verify-otp?User_Password=${encrypted_password}&Email=${Email}&otp=${otp}`,
        'headers': {
        }
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) {
                console.log(error);
                resolve(false);
            }else{
                console.log("======================================== Verify OTP");
                console.log(JSON.parse(response.body));
                resolve(JSON.parse(response.body));
            }
        });
    });
}

function get_user_credentials(email, encrypted_password){
    var sql = `select * from vtportal.customer_management where Email = '${email}' and User_Password = '${encrypted_password}' and Delete_Mark != '1' limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve({
                    data: result[0],
                    status: true
                });
            }else{
                resolve(false);
            }
        });
    });
}

function update_last_login(email, encrypted_password){
    var sql = `
        UPDATE vtportal.customer_management
        SET Last_Login = CURDATE()
        WHERE Email = '${email}' and User_Password = '${encrypted_password}' and Delete_Mark != '1';
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

//generate password
app.post('/password-generator',  async (req, res) => {
    var password = req.query.Password;
    if(password != undefined){
        if(password.length > 5){
            res.send(
                await encrypt_password(password).then(async value => {
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

async function encrypt_password(password){
    return new Promise(async resolve => {
        var mykey = crypto.createCipher('aes-128-cbc', password);
        var mystr = mykey.update('yusufadisaputro', 'utf8', 'hex');
        mystr += mykey.final('hex');
        resolve(mystr);
    });
}

//get customer information
app.post('/get-customer-information',  async (req, res) => {
    var Customer_Code = req.query.Customer_Code;
    var First_Name = req.query.First_Name;
    var Last_Name = req.query.Last_Name;
    var Email = req.query.Email;
    var Status = req.query.Status;
    if(Customer_Code != undefined || Customer_Code != null){
        res.send(await get_customer_details_based_on_customer_code(Customer_Code).then(async value => {
            return await value;
        }));
    }else if(First_Name != undefined || First_Name != null){
        res.send(await get_customer_details_based_on_customer_first_name(First_Name).then(async value => {
            return await value;
        }));
    }else if(Last_Name != undefined || Last_Name != null){
        res.send(await get_customer_details_based_on_customer_last_name(Last_Name).then(async value => {
            return await value;
        }));
    }else if(Email != undefined || Email != null){
        res.send(await get_customer_details_based_on_customer_email(Email).then(async value => {
            return await value;
        }));
    }else if(Status != undefined || Status != null){
        res.send(await get_customer_details_based_on_customer_status(Status).then(async value => {
            return await value;
        }));
    }else{
        res.send(await get_all_customer_details().then(async value => {
            return await value;
        }));
    }
})

async function get_all_customer_details(){
    var sql = `select * from vtportal.customer_management where Delete_Mark != '1' limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
}

async function get_customer_details_based_on_customer_code(Customer_Code){
    var sql = `select * from vtportal.customer_management where Customer_Code = '${Customer_Code}' and Delete_Mark != '1' limit 1;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                if(result[0].Customer_Code != undefined){
                    if(result[0].Customer_Code == Customer_Code){
                        console.log(Customer_Code);
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
        });
    });
}

async function get_customer_details_based_on_customer_first_name(First_Name){
    var sql = `select * from vtportal.customer_management where upper(First_Name) and Delete_Mark != '1' like '%${First_Name.toUpperCase()}%';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
}

async function get_customer_details_based_on_customer_last_name(Last_Name){
    var sql = `select * from vtportal.customer_management where upper(Last_Name) and Delete_Mark != '1' like '%${Last_Name.toUpperCase()}%';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
}

async function get_customer_details_based_on_customer_email(Email){
    var sql = `select * from vtportal.customer_management where upper(Email) and Delete_Mark != '1' like '%${Email.toUpperCase()}%';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
}

async function get_customer_details_based_on_customer_status(Status){
    var sql = `select * from vtportal.customer_management where upper(Status) like '%${Status.toUpperCase()}%';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result != undefined && result[0] != undefined){
                resolve(result);
            }else{
                resolve(false);
            }
        });
    });
}

//create new customer-by-admin
app.post('/create-new-customer-by-admin',  async (req, res) => {
    var customer_data = req.body.customer_data;
    if(customer_data != undefined || customer_data != null){
        if(customer_data.Email != undefined){
            if(customer_data.Email.length > 0){
                if(
                    (customer_data.Customer_Code != undefined || customer_data.Customer_Code.length != 0)
                    && (customer_data.First_Name != undefined || customer_data.First_Name.length >= 3)
                    && (customer_data.Last_Name != undefined || customer_data.Last_Name.length >= 3)
                    && (customer_data.User_Password != undefined || customer_data.User_Password.length >= 10)
                    && (customer_data.Email != undefined || customer_data.Email.length != 0)
                    && (customer_data.Contact_Number_1 != undefined || customer_data.Contact_Number_1.length != 0)
                    && (
                        customer_data.Email.toLowerCase().includes('@gmail.com') 
                        || customer_data.Email.toLowerCase().includes('@outlook.com') 
                        || customer_data.Email.toLowerCase().includes('@hotmail.com') 
                        || customer_data.Email.toLowerCase().includes('@yahoo.com') 
                        || customer_data.Email.toLowerCase().includes('@yahoo.co.id') 
                        || customer_data.Email.toLowerCase().includes('@aol.com')
                    )
                    ){
                        if(
                            (await check_existing_customer_code(customer_data).then(async value => {
                                return await value;
                            }))
                        ){
                            res.send(false);
                        }else{
                            res.send(await create_new_customer_by_admin(customer_data).then(async value => {
                                return await value;
                            }));
                        }
                }else{
                    res.send(false);
                }
            }else{
                res.send(false);
            }
        }else{
            res.send(false);
        }
    }else{
        res.send(false);
    }
})

//create new customer-direct-from-user
app.post('/create-new-customer-direct-from-user',  async (req, res) => {
    var customer_data = req.body.customer_data;
    if(customer_data != undefined){
        if(customer_data.Email != undefined){
            if(customer_data.Email.length > 0){
                if(customer_data.account_number != undefined && customer_data.referral_customer_code != undefined){
                    if(
                        // (await check_existing_referral_code(customer_data.referral_customer_code).then(async value => {
                        //     return await value;
                        // }))
                        true
                    ){
                        if(
                            (customer_data.Customer_Code != undefined || customer_data.Customer_Code.length != 0)
                            && (customer_data.First_Name != undefined || customer_data.First_Name.length >= 3)
                            && (customer_data.Last_Name != undefined || customer_data.Last_Name.length >= 3)
                            && (customer_data.User_Password != undefined || customer_data.User_Password.length >= 10)
                            && (customer_data.Email != undefined || customer_data.Email.length != 0)
                            && (customer_data.Contact_Number_1 != undefined || customer_data.Contact_Number_1.length != 0)
                            && (customer_data.account_number != undefined || customer_data.account_number.length != 0)
                            && (customer_data.referral_customer_code != undefined || customer_data.referral_customer_code.length != 0)
                            // && (customer_data.ktp != undefined || customer_data.ktp.length != 0)
                            && (
                                customer_data.Email.toLowerCase().includes('@gmail.com') 
                                || customer_data.Email.toLowerCase().includes('@outlook.com') 
                                || customer_data.Email.toLowerCase().includes('@hotmail.com') 
                                || customer_data.Email.toLowerCase().includes('@yahoo.com') 
                                || customer_data.Email.toLowerCase().includes('@yahoo.co.id') 
                                || customer_data.Email.toLowerCase().includes('@aol.com')
                            )
                            ){
                                if(
                                    (await check_existing_customer_code(customer_data).then(async value => {
                                        return await value;
                                    }))
                                ){
                                    console.log("===============================================");
                                    console.log(
                                        await check_existing_customer_code(customer_data).then(async value => {
                                            return await value;
                                        })
                                    );
                                    res.send(false);
                                }else{
                                    res.send(await create_new_customer_direct_from_customer(customer_data).then(async value => {
                                        return await value;
                                    }));
                                }
                        }else{
                            console.log(
                                (
                                    customer_data.Email.toLowerCase().includes('@gmail.com') 
                                    || customer_data.Email.toLowerCase().includes('@outlook.com') 
                                    || customer_data.Email.toLowerCase().includes('@hotmail.com') 
                                    || customer_data.Email.toLowerCase().includes('@yahoo.com') 
                                    || customer_data.Email.toLowerCase().includes('@yahoo.co.id') 
                                    || customer_data.Email.toLowerCase().includes('@aol.com')
                                )
                            );
                            console.log("===============================================");
                            console.log("Email ending is false");
                            res.send(false);
                        }
                    }else{
                        console.log("===============================================");
                        console.log("referral_customer_code not found");
                        res.send(false);
                    }
                }else{
                    console.log("===============================================");
                    console.log("customer_data.account_number = undefined && customer_data.referral_customer_code = undefined");
                    res.send(false);
                }
            }else{
                console.log("===============================================");
                console.log("email too short");
                res.send(false);
            }
        }else{
            console.log("===============================================");
            console.log("email cannot be read");
            res.send(false);
        }
    }else{
        console.log("===============================================");
        console.log("customer_data cannot be read");
        res.send(false);
    }
})

//create new customer-direct-from-user
app.post('/create-new-customer-supplier-direct-from-user',  async (req, res) => {
    var customer_data = req.body.customer_data;
    if(customer_data != undefined || customer_data != null){
        if(customer_data.Email != undefined){
            if(customer_data.Email.length > 0){
                if(customer_data.account_number != undefined && customer_data.npwp != undefined){
                    if(
                        (customer_data.Customer_Code != undefined || customer_data.Customer_Code.length != 0)
                        && (customer_data.First_Name != undefined || customer_data.First_Name.length >= 3)
                        && (customer_data.Last_Name != undefined || customer_data.Last_Name.length >= 3)
                        && (customer_data.User_Password != undefined || customer_data.User_Password.length >= 10)
                        && (customer_data.Email != undefined || customer_data.Email.length != 0)
                        && (customer_data.Contact_Number_1 != undefined || customer_data.Contact_Number_1.length != 0)
                        && (customer_data.account_number != undefined || customer_data.account_number.length != 0)
                        && (customer_data.npwp != undefined || customer_data.npwp.length != 0)
                        && (customer_data.nik != undefined || customer_data.nik.length != 0)
                        && (customer_data.Nama_Perusahaan != undefined || customer_data.Nama_Perusahaan.length != 0)
                        ){
                            if(
                                (await check_existing_customer_code(customer_data).then(async value => {
                                    return await value;
                                }))
                            ){
                                res.send(false);
                            }else{
                                res.send(await create_new_supplier_customer_direct_from_customer(customer_data).then(async value => {
                                    return await value;
                                }));
                            }
                    }else{
                        res.send(false);
                    }
                }else{
                    console.log("===============================================");
                    console.log("customer_data.account_number = undefined && customer_data.referral_customer_code = undefined");
                    res.send(false);
                }
            }else{
                res.send(false);
            }
        }else{
            res.send(false);
        }
    }else{
        res.send(false);
    }
})

async function check_existing_referral_code(referral_customer_code){
    var sql = `
        select * from vtportal.customer_management where Customer_Code = '${referral_customer_code}'
    ;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result[0] != undefined){
                resolve(true);
            }else{
                resolve(false);
            } 
        });
    });
}

async function check_existing_customer_code(customer_data){
    var sql = `
        select * from vtportal.customer_management where Customer_Code = '${customer_data.Customer_Code}' or upper(Email) like '%${customer_data.Email.toUpperCase()}%' 
    ;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result[0] != undefined){
                resolve(true);
            }else{
                resolve(false);
            } 
        });
    });
}

async function create_new_customer_direct_from_customer(customer_data){
    var sql = `INSERT into vtportal.customer_management 
    (
        Customer_Code,
        First_Name,
        Last_Name,
        User_Password,
        Birthday,
        Created_Date,
        Last_Login,
        Email,
        Contact_Number_1,
        Contact_Number_2,
        Address_1,
        Address_2,
        Address_3,
        Address_4,
        Address_5,
        Status,
        User_Type,
        Start_Date,
        Remark,
        Creator,
        Create_Date,
        Update_date,
        Delete_Mark,
        extra_column_1,
        extra_column_2,
        extra_column_3,
        ktp,
        user_license_agreement_status,
        bank_account_number
        )
        values
        ('${customer_data.Customer_Code}',
        '${customer_data.First_Name}',
        '${customer_data.Last_Name}',
        '${customer_data.User_Password}',
        '${customer_data.Birthday}',
        CURDATE(),
        CURDATE(),
        '${customer_data.Email}',
        '${customer_data.Contact_Number_1}',
        '${customer_data.Contact_Number_2}',
        '${customer_data.Address_1}',
        '${customer_data.Address_2}',
        '${customer_data.Address_3}',
        '${customer_data.Address_4}',
        '${customer_data.Address_5}',
        'approving',
        '${customer_data.User_Type}',
        CURRENT_TIMESTAMP(),
        'created by user',
        '${customer_data.Customer_Code}',
        CURRENT_TIMESTAMP(),
        CURRENT_TIMESTAMP(),
        '0',
        '${customer_data.account_number}',
        '${customer_data.referral_customer_code}',
        '3%',
        '${customer_data.ktp}',
        'true',
        '${customer_data.account_number}'
        );`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

async function create_new_supplier_customer_direct_from_customer(customer_data){
    var sql = `INSERT into vtportal.customer_management 
    (
        Customer_Code,
        First_Name,
        Last_Name,
        User_Password,
        Birthday,
        Created_Date,
        Last_Login,
        Email,
        Contact_Number_1,
        Contact_Number_2,
        Address_1,
        Address_2,
        Address_3,
        Address_4,
        Address_5,
        Status,
        User_Type,
        Start_Date,
        Remark,
        Creator,
        Create_Date,
        Update_date,
        Delete_Mark,
        extra_column_1,
        extra_column_2,
        extra_column_5,
        extra_column_3,
        ktp,
        Nama_Perusahaan,
        customer_type_status,
        user_license_agreement_status,
        npwp,
        bank_account_number
        )
        values
        ('${customer_data.Customer_Code}',
        '${customer_data.First_Name}',
        '${customer_data.Last_Name}',
        '${customer_data.User_Password}',
        '${customer_data.Birthday}',
        CURDATE(),
        CURDATE(),
        '${customer_data.Email}',
        '${customer_data.Contact_Number_1}',
        '${customer_data.Contact_Number_2}',
        '${customer_data.Address_1}',
        '${customer_data.Address_2}',
        '${customer_data.Address_3}',
        '${customer_data.Address_4}',
        '${customer_data.Address_5}',
        'approving',
        'Supplier',
        CURRENT_TIMESTAMP(),
        'created by user',
        '${customer_data.Customer_Code}',
        CURRENT_TIMESTAMP(),
        CURRENT_TIMESTAMP(),
        '0',
        '${customer_data.account_number}',
        '${customer_data.npwp}',
        '${customer_data.nik}',
        '7.5%',
        '${customer_data.ktp}',
        '${customer_data.Nama_Perusahaan}',
        'Supplier',
        'true',
        '${customer_data.npwp}',
        '${customer_data.account_number}'
        );`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

async function create_new_customer_by_admin(customer_data){
    var sql = `INSERT into vtportal.customer_management 
    (
        Customer_Code,
        First_Name,
        Last_Name,
        User_Password,
        Birthday,
        Created_Date,
        Last_Login,
        Email,
        Contact_Number_1,
        Contact_Number_2,
        Address_1,
        Address_2,
        Address_3,
        Address_4,
        Address_5,
        Status,
        User_Type,
        Start_Date,
        Remark,
        Creator,
        Create_Date,
        Update_date,
        Delete_Mark
        )
        values
        ('${customer_data.Customer_Code}',
        '${customer_data.First_Name}',
        '${customer_data.Last_Name}',
        '${customer_data.User_Password}',
        '${customer_data.Birthday}',
        CURDATE(),
        CURDATE(),
        '${customer_data.Email}',
        '${customer_data.Contact_Number_1}',
        '${customer_data.Contact_Number_2}',
        '${customer_data.Address_1}',
        '${customer_data.Address_2}',
        '${customer_data.Address_3}',
        '${customer_data.Address_4}',
        '${customer_data.Address_5}',
        'pending',
        '${customer_data.User_Type}',
        CURRENT_TIMESTAMP(),
        'created by admin',
        '${customer_data.Creator}',
        CURRENT_TIMESTAMP(),
        CURRENT_TIMESTAMP(),
        '0'
        );`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

//update-customer-data-by-admin
app.post('/update-customer-data-by-admin',  async (req, res) => {
    var Customer_Data = req.body.customer_data;
    if(Customer_Data != undefined){
        if(
            await check_existing_customer_code(Customer_Data).then(async value => {
                return await value;
            })
        ){
            res.send(
                await update_customer_by_admin(Customer_Data).then(async value => {
                    return await value;
                })
            );
        }
    }else{
        res.send(false);
    }
})

async function update_customer_by_admin(customer_data){
    var sql = `UPDATE vtportal.customer_management 
    SET Customer_Code = '${customer_data.Customer_Code}',
        First_Name = '${customer_data.First_Name}',
        Last_Name = '${customer_data.Last_Name}',
        User_Password = '${customer_data.User_Password}',
        Birthday = '${customer_data.Birthday}',
        Last_Login = CURRENT_TIMESTAMP(),
        Email = '${customer_data.Email}',
        Contact_Number_1 = '${customer_data.Contact_Number_1}',
        Contact_Number_2 = '${customer_data.Contact_Number_2}',
        Address_1 = '${customer_data.Address_1}',
        Address_2 = '${customer_data.Address_2}',
        Address_3 = '${customer_data.Address_3}',
        Address_4 = '${customer_data.Address_4}',
        Address_5 = '${customer_data.Address_5}',
        Status = 'pending',
        User_Type = '${customer_data.User_Type}',
        Update_date = CURRENT_TIMESTAMP(),
        Auditor_Id = '${customer_data.Auditor_Id}',
        Audited_Date = CURRENT_TIMESTAMP()
        WHERE Customer_Code = '${customer_data.Customer_Code}';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

//update-customer-data-by-user-themselves
app.post('/update-customer-data-by-user-themselves',  async (req, res) => {
    var Customer_Data = req.body.customer_data;
    if(Customer_Data != undefined){
        if(
            await check_existing_customer_code(Customer_Data).then(async value => {
                return await value;
            })
        ){
            res.send(
                await update_customer_direct_from_customer(Customer_Data).then(async value => {
                    return await value;
                })
            );
        }
    }else{
        res.send(false);
    }
})

async function update_customer_direct_from_customer(customer_data){
    var sql = `UPDATE vtportal.customer_management 
                SET Customer_Code = '${customer_data.Customer_Code}',
                First_Name = '${customer_data.First_Name}',
                Last_Name = '${customer_data.Last_Name}',
                Birthday = '${customer_data.Birthday}',
                Last_Login = CURRENT_TIMESTAMP(),
                Email = '${customer_data.Email}',
                Contact_Number_1 = '${customer_data.Contact_Number_1}',
                Contact_Number_2 = '${customer_data.Contact_Number_2}',
                Address_1 = '${customer_data.Address_1}',
                Address_2 = '${customer_data.Address_2}',
                Address_3 = '${customer_data.Address_3}',
                Address_4 = '${customer_data.Address_4}',
                Address_5 = '${customer_data.Address_5}',
                Status = 'approving',
                User_Type = '${customer_data.User_Type}',
                Update_date = CURRENT_TIMESTAMP()`;
    var sqlTail = ` WHERE Customer_Code = '${customer_data.Customer_Code}';`;
    if(customer_data.account_number != undefined){
        if(customer_data.account_number.length > 0){
            sql = sql + `,bank_account_number = '${customer_data.account_number}'`;
        }
    }
    if(customer_data.ktp != undefined){
        if(customer_data.ktp.length > 0){
            sql = sql + `,ktp = '${customer_data.ktp}'`;
        }
    }
    sql = sql + sqlTail;
    console.log(sql);
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

//update-customer-status-approving
app.post('/update-customer-status-approving',  async (req, res) => {
    var customer_code = req.query.Customer_Code;
    var Auditor_Id = req.query.Auditor_Id;
    if(customer_code != undefined || Auditor_Id != undefined){
        res.send(await update_customer_status_to_approving(customer_code, Auditor_Id).then(async value => {
            return await value;
        }));
    }else{
        res.send(false);
    }
})

async function update_customer_status_to_approving(customer_code, Auditor_Id){
    var sql = `update vtportal.customer_management 
    set Status='approving',
    Auditor_Id='${Auditor_Id}',
    Update_date=CURRENT_TIMESTAMP(),
    Audited_Date=CURRENT_TIMESTAMP()
    where Customer_Code = '${customer_code}'
    and Delete_Mark = '0';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

//update-customer-status-pending
app.post('/update-customer-status-pending',  async (req, res) => {
    var customer_code = req.query.Customer_Code;
    var Rejector_Id = req.query.Rejector_Id;
    if(customer_code != undefined || Rejector_Id != undefined){
        res.send(await update_customer_status_to_pending(customer_code, Rejector_Id).then(async value => {
            return await value;
        }));
    }else{
        res.send(false);
    }
})

async function update_customer_status_to_pending(customer_code, Rejector_Id){
    var sql = `update vtportal.customer_management 
    set Status='pending',
    Rejector_Id='${Rejector_Id}',
    Update_date=CURRENT_TIMESTAMP(),
    Rejector_Date=CURRENT_TIMESTAMP()
    where Customer_Code = '${customer_code}'
    and Delete_Mark = '0';`;
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

//delete customer
app.post('/delete-customer',  async (req, res) => {
    var customer_code = req.query.Customer_Code;
    var Deleter = req.query.Deleter;
    if(customer_code != undefined || Deleter != undefined){
        res.send(await delete_customer(customer_code, Deleter).then(async value => {
            return await value;
        }));
    }else{
        res.send(false);
    }
})

async function delete_customer(customer_code, Deleter){
    var sql = `update vtportal.customer_management 
    set Status='deleted',
    Deleter='${Deleter}',
    Delete_Date=CURRENT_TIMESTAMP(),
    Delete_Mark='1'
    where Customer_Code = '${customer_code}';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

//get-customer-code
app.post('/get-customer-code',  async (req, res) => {
    res.send(await customer_code_generator().then(async value => {
        return await value;
    }));
})

async function customer_code_generator(){
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    var customer_code = Date.now() + "YU" + h + "SU" + m + "FA" + s + "DI" + Math.floor((Math.random() * 999) + 9999);
    return new Promise(async resolve => {
        resolve(customer_code);
    });
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
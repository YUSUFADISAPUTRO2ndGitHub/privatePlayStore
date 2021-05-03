process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
var request = require('request');
var mysql = require('mysql');
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

//get customer information
app.get('/get-customer-information',  async (req, res) => {
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
        res.send(false);
    }
})

async function get_customer_details_based_on_customer_code(Customer_Code){
    var sql = `select * from vtportal.customer_management where Customer_Code = '${Customer_Code}' and Status != 'deleted' limit 1;`;
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
    var sql = `select * from vtportal.customer_management where upper(First_Name) and Status != 'deleted' like '%${First_Name.toUpperCase()}%';`;
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
    var sql = `select * from vtportal.customer_management where upper(Last_Name) and Status != 'deleted' like '%${Last_Name.toUpperCase()}%';`;
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
    var sql = `select * from vtportal.customer_management where upper(Email) and Status != 'deleted' like '%${Email.toUpperCase()}%';`;
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

//create new customer
app.post('/create-new-customer',  async (req, res) => {
    var customer_data = req.body.customer_data;
    if(customer_data != undefined || customer_data != null){
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
                    await check_existing_customer_code(customer_data).then(async value => {
                        return await value;
                    })
                    && 
                    await check_existing_customer_email(customer_data).then(async value => {
                        return await value;
                    })
                ){
                    res.send(false);
                }else{
                    res.send(await create_new_customer(customer_data).then(async value => {
                        return await value;
                    }));
                }
        }else{
            res.send(false);
        }
    }else{
        res.send(false);
    }
})

async function check_existing_customer_code(customer_data){
    var sql = `
        select * from vtportal.customer_management where Customer_Code = '${customer_data.Customer_Code}' 
    ;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result[0] != undefined){
                if(result[0].Customer_Code == customer_data.Customer_Code){
                    resolve(true);
                }else{
                    resolve(false);
                }
            }else{
                resolve(false);
            } 
        });
    });
}

async function check_existing_customer_email(customer_data){
    sql = `
        select * from vtportal.customer_management where upper(Email) like '%${customer_data.Email}%' 
    ;`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            if(result[0] != undefined){
                if(result[0].Email == customer_data.Email){
                    resolve(true);
                }else{
                    resolve(false);
                }
            }else{
                resolve(false);
            }
        });
    });
}

async function create_new_customer(customer_data){
    var sql = `INSERT into vtportal.customer_management 
    (Customer_Code,First_Name,Last_Name,User_Password,Birthday,Created_Date,Last_Login,Email,Contact_Number_1,Contact_Number_2,Address_1,Address_2,Address_3,Address_4,Address_5,Status,User_Type)
    values
    ('${customer_data.Customer_Code}',
    '${customer_data.First_Name}',
    '${customer_data.Last_Name}',
    '${customer_data.User_Password}',
    '${customer_data.Birthday}',
    'CURDATE()',
    '${customer_data.Last_Login}',
    '${customer_data.Email}',
    '${customer_data.Contact_Number_1}',
    '${customer_data.Contact_Number_2}',
    '${customer_data.Address_1}',
    '${customer_data.Address_2}',
    '${customer_data.Address_3}',
    '${customer_data.Address_4}',
    '${customer_data.Address_5}',
    '${customer_data.Status}',
    '${customer_data.User_Type}');`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

//delete customer
app.post('/delete-customer',  async (req, res) => {
    var customer_code = req.query.Customer_Code;
    if(customer_code != undefined || customer_code != null){
        res.send(await delete_customer(customer_code).then(async value => {
            return await value;
        }));
    }else{
        res.send(false);
    }
})

async function delete_customer(customer_code){
    var sql = `update vtportal.customer_management 
    set Status='deleted'
    where Customer_Code = '${customer_code}';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) await console.log(err);
            resolve(true);
        });
    });
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
var request = require('request');
var mysql = require('mysql');
const app = express();
const port = 3005;
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

//get-all-payment-method
app.post('/get-all-payment-method',  async (req, res) => {
    res.send(
        (await get_all_payment_methode().then(async value => {
            return await value;
        }))
    );
})

async function get_all_payment_methode(){
    var sql = `select * from vtportal.payment_method_management where Delete_Mark != '1';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err){
                await console.log(err);
                resolve(false);
            }else{
                resolve(result);
            }
        });
    });
}

//delete-delivery-order
app.post('/delete-payment-method',  async (req, res) => {
    var Payment_Method_Name = req.query.Payment_Method_Name;
    if(Payment_Method_Name != undefined){
        if(
            (await check_Payment_Name_existance(Payment_Method_Name).then(async value => {
                return await value;
            }))
        ){
            if(
                await delete_payment_method(Payment_Method_Name).then(async value => {
                    return await value;
                })
            ){
                res.send({
                    status: true,
                    Payment_Method_Name: Payment_Method_Name
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
                reason: "not found target"
            });
        }
    }
    else{
        res.send({
            status: false,
            reason: "incomplete param"
        });
    }
    
})

async function delete_payment_method(Payment_Method_Name){
    var sql = `UPDATE vtportal.payment_method_management 
    SET Delete_Mark = '1'
    where upper(Payment_Method_Name) = '${Payment_Method_Name.toUpperCase()}';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err){
                await console.log(err);
                resolve(false);
            }else{
                resolve(true);
            }
        });
    });
}

//create-new-delivery-order
app.post('/create-new-payment-method',  async (req, res) => {
    var Payment_Method_Name = req.query.Payment_Method_Name;
    var Payment_Method_Desc = req.query.Payment_Method_Desc;
    var Payment_Method_Default_Charge = req.query.Payment_Method_Default_Charge;
    var Payment_Method_Default_Discount = req.query.Payment_Method_Default_Discount;
    var Creator = req.query.Creator;
    if(Creator != undefined && Payment_Method_Name != undefined && Payment_Method_Desc != undefined && Payment_Method_Default_Charge != undefined && Payment_Method_Default_Discount != undefined){
        if(
            !(await check_Payment_Name_existance(Payment_Method_Name).then(async value => {
                return await value;
            }))
        ){
            if(
                await create_new_payment_method(Payment_Method_Name, Payment_Method_Desc, Payment_Method_Default_Charge, Payment_Method_Default_Discount, Creator).then(async value => {
                    return await value;
                })
            ){
                res.send({
                    status: true,
                    Payment_Method_Name: Payment_Method_Name
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
                reason: "duplicate target"
            });
        }
    }else{
        res.send({
            status: false,
            reason: "incomplete param"
        });
    }
    
})

async function check_Payment_Name_existance(Payment_Method_Name){
    var sql = `select * from vtportal.payment_method_management where upper(Payment_Method_Name) = '${Payment_Method_Name.toUpperCase()}' and Delete_Mark != '1' limit 1;`;
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

async function create_new_payment_method(Payment_Method_Name, Payment_Method_Desc, Payment_Method_Default_Charge, Payment_Method_Default_Discount, Creator){
    var sql = `
        INSERT INTO vtportal.payment_method_management 
        (
            Payment_Method_Name,
            Payment_Method_Desc,
            Payment_Method_Default_Charge,
            Payment_Method_Default_Discount,
            Status,
            Creator,
            Create_Date,
            Modifier,
            Update_date,
            Delete_Mark
        )
        VALUES 
        (
            '${Payment_Method_Name}',
            '${Payment_Method_Desc}',
            '${Payment_Method_Default_Charge}',
            '${Payment_Method_Default_Discount}',
            'approving',
            '${Creator}',
            CURRENT_TIMESTAMP(),
            '${Creator}',
            CURRENT_TIMESTAMP(),
            '0'
        );
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

app.get('/download-sold-co-id-trial', (req, res) => {
    const file = `./sold.apk`;
    res.download(file); // Set disposition and send it.
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
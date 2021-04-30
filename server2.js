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

var refresh_token = 'a1bf6530-0fbf-40e8-a3a2-6eed29886c7e';
var access_token = '843ea222-291b-4c6d-adbf-1c514c1da77c';
var session_id_for_accurate_db = '';
var request = require('request');
async function getRefreshedToken() {
    console.log("=============== TOKEN UPDATE EXECUTED ===============");
    var sql = `select access_token, refresh_token from vtportal.accurateCredentials as acc order by acc.last_updated desc limit 1`;
    await con.query(sql, async function (err, result, fields) {
        if (err) console.log(err);
        access_token = result[0].access_token;
        refresh_token = result[0].refresh_token;
        console.log("=============== MYSQL TOKEN GATHERED ===============");
        console.log("last updated access token : " + access_token);
        console.log("last updated refresh token : " + refresh_token);
        var options = {
            'method': 'POST',
            'url': 'https://account.accurate.id/oauth/token?grant_type=refresh_token&refresh_token=' + refresh_token,
            'headers': {
                'Authorization': 'Basic ZTI3MTQzYTktNmU4NC00MGE0LTlhYmUtNGQ1NzM2YzZlNDdkOmYxOGU2ZjRiMjE5NTUwNWFiZjZjMWZmOTZlOTJlZDY3'
            }
        };
        await request(options, async function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                console.log("=============== RENEW TOKEN DONE ===============");
                var save_status = await save_new_token_to_accurate(result).then(async value => {
                    return await value;
                });
                if(save_status){
                    refresh_token = result.refresh_token;
                    access_token = result.access_token;
                    console.log("RENEWED refresh_token > " + refresh_token);
                    console.log("RENEWED access_token > " + access_token);
                    
                    await get_session_id(access_token).then(async value => {
                        return await value;
                    })
                }
            }
        });
    });
}
setInterval(getRefreshedToken, 5000);//513997357

async function save_new_token_to_accurate(result){
    var sql = `INSERT INTO vtportal.accurateCredentials (access_token, refresh_token, expires_in, access_scope, last_updated) VALUES ('${result.access_token}', '${result.refresh_token}', ${result.expires_in}, '${result.scope}', NOW())`;
    return new Promise(async resolve => {
        con.query(sql, function (err, result) {
            if (err) console.log(err);
            console.log("=============== RENEWED TOKEN RECORDED ===============");
            resolve(true);
        });
    });
}

async function get_session_id(accessToken){
    var options = {
        'method': 'GET',
        'url': 'https://account.accurate.id/api/open-db.do?id=300600',
        'headers': {
            'Authorization': 'Bearer ' + accessToken
        }
    };
    return new Promise(async resolve => {
        await request(options, async function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                if(await update_session_id_to_MYSQL(result, accessToken).then(async value => {
                    return await value;
                })){
                    session_id_for_accurate_db = result.session;
                    console.log("session id for db : " + session_id_for_accurate_db);
                    resolve(true);
                }
            }
        });
    });
}

async function update_session_id_to_MYSQL(result, accessToken){
    var sql = `UPDATE vtportal.accurateCredentials SET session_id='${result.session}' WHERE access_token ='${accessToken}';`;
    return new Promise(async resolve => {
        await con.query(sql, async function (err, result) {
            if (err) console.log(err);
            console.log("Recorded update session db in  MySQL");
            resolve(true);
        });
    });
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
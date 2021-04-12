const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;
app.use(cors(), express.json());
var oracledb = require('oracledb'); 
var mysql = require('mysql');
var request = require('request');
const e = require('express');
try {
    oracledb.initOracleClient({libDir: 'C:\\Users\\Asus\\OneDrive\\Desktop\\instantclient_19_10'});
} catch (err) {
    console.error('Whoops!');
    console.error(err);
    process.exit(1);
}
var con = mysql.createConnection({
    host: "172.31.207.222",
    port: 3306,
    database: "vtportal",
    user: "root",
    password: "Root@123"
});
con.connect(async function(err) {
    if (err) console.log(err);
    console.log("Connected! to MySQL");
});

app.get('/get-accurate-token-and-session', async (req, res) => {
    var sql = `select access_token, session_id from vtportal.accurateCredentials as acc order by acc.last_updated desc limit 1;`;
    await con.query(sql, function (err, result) {
        if (err) console.log(err);
        var result = {
            access_token: result[0].access_token,
            session_id: result[0].session_id
        };
        res.send(result);
    });
})

app.get('/access-employee-datas-from-accurate', async (req, res) => {
    var options = {
        'method': 'GET',
        'url': 'http://localhost:3001/get-accurate-token-and-session',
        'headers': {
        }
    };
    await request(options, async function (error, response) {
        if (error) throw new Error(error);
        // console.log(response.body);
        var token_and_session = JSON.parse(response.body);
        var token = token_and_session.access_token;
        var session = token_and_session.session_id;
        var page_requested = 1;
        var total_page_available = 0;
        var saved_sales_order_id_list = [];
        options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/employee/list.do?' + 'sp.page=' + 1,
            'headers': {
                'Authorization': 'Bearer ' + token,
                'X-Session-ID': session,
            }
        };
        await request(options, async function (error, response) {
            if (error) throw new Error(error);
            total_page_available = JSON.parse(response.body).sp.pageCount;
            var temp ;
            while(page_requested <= total_page_available){
                gettingSalesOrderList(token, session, page_requested, saved_sales_order_id_list);
                page_requested++;
            }
            setTimeout(function(){  
                var saved_sales_order_id_list_with_details = [];
                var i = 0;
                for(i; i < saved_sales_order_id_list.length; i ++){
                    gettingSalesOrderListWithDetails(token, session, saved_sales_order_id_list[i].id, saved_sales_order_id_list_with_details, i);
                }
                setTimeout(function(){ 
                    var sorted_out_saved_sales_order_id_list_with_details = [];
                    sortOutSalesOrderDetails(saved_sales_order_id_list_with_details, sorted_out_saved_sales_order_id_list_with_details);
                    sendDataToMySQL(sorted_out_saved_sales_order_id_list_with_details);
                    var responseTemp = {
                        totalLength : saved_sales_order_id_list.length,
                        totalLengthAfterDetails : saved_sales_order_id_list_with_details.length,
                        totalLengthAfterDetailsSorted : sorted_out_saved_sales_order_id_list_with_details.length
                    };
                    console.log(responseTemp);
                    setTimeout(() => {
                        res.send(sorted_out_saved_sales_order_id_list_with_details);
                    }, sorted_out_saved_sales_order_id_list_with_details * 3000);
                }, saved_sales_order_id_list.length*3600*1.2);
                // res.send(saved_sales_order_id_list);
            }, total_page_available*1000);
        });
    });
})

async function sendDataToMySQL(sorted_out_saved_sales_order_id_list_with_details){
    var i=0;
    for(i; i < sorted_out_saved_sales_order_id_list_with_details.length; i++){
        accessingMySQL(sorted_out_saved_sales_order_id_list_with_details, i);
    }
}

async function accessingMySQL(sorted_out_saved_sales_order_id_list_with_details, i){
    setTimeout(() => {
        console.log(sorted_out_saved_sales_order_id_list_with_details[i].number);
        var existingData;
        var sql = `select * from vtportal.employee_data_accurate where emp_number = '${sorted_out_saved_sales_order_id_list_with_details[i].number}';`;
        con.query(sql, function (err, result) {
            if (err) console.log(err);
            existingData = result[0];
        });
        setTimeout(() => {
            if(existingData == undefined){ // data does not exist
                var sql = `insert into vtportal.employee_data_accurate values 
                ('${sorted_out_saved_sales_order_id_list_with_details[i].name}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].number}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].mobilePhone}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].position}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].email}'
                );`;
                con.query(sql, function (err, result) {
                    if (err) console.log(err);
                });
            }else{
                var sql = `UPDATE vtportal.employee_data_accurate SET 
                name = '${sorted_out_saved_sales_order_id_list_with_details[i].name}'
                , mobilePhone = '${sorted_out_saved_sales_order_id_list_with_details[i].mobilePhone}'
                , emp_position = '${sorted_out_saved_sales_order_id_list_with_details[i].position}'
                , email = '${sorted_out_saved_sales_order_id_list_with_details[i].email}'
                WHERE emp_number = '${sorted_out_saved_sales_order_id_list_with_details[i].number}';`;
                con.query(sql, function (err, result) {
                    if (err) console.log(err);
                });
            }
        }, 3000);
    }, 500*i);
}

async function sortOutSalesOrderDetails(saved_sales_order_id_list_with_details, sorted_out_saved_sales_order_id_list_with_details){
    var i=0;
    for(i; i < saved_sales_order_id_list_with_details.length; i++){
        var sorted = {
            name: saved_sales_order_id_list_with_details[i].name,
            number: saved_sales_order_id_list_with_details[i].number,
            mobilePhone: saved_sales_order_id_list_with_details[i].mobilePhone,
            position: saved_sales_order_id_list_with_details[i].position,
            email: saved_sales_order_id_list_with_details[i].email
        }
        sorted_out_saved_sales_order_id_list_with_details.push(sorted);
    }
}

async function gettingSalesOrderListWithDetails(token, session, id, saved_sales_order_id_list_with_details, time){
    setTimeout(function(){ 
        var options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/employee/detail.do?id=' + id,
            'headers': {
              'Authorization': 'Bearer ' + token,
              'X-Session-ID': session
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(id);
            saved_sales_order_id_list_with_details.push(JSON.parse(response.body).d);
        });
    }, time*3500);   
}

async function gettingSalesOrderList(token, session, page_requested, saved_sales_order_id_list){
    setTimeout(async () => {
        options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/employee/list.do?' + 'sp.page=' + page_requested,
            'headers': {
                'Authorization': 'Bearer ' + token,
                'X-Session-ID': session,
            }
        };
        await request(options, async function (error, response) {
            if (error) throw new Error(error);
            var i = 0;
            for(i; i < JSON.parse(response.body).d.length; i ++){
                await saved_sales_order_id_list.push(JSON.parse(response.body).d[i]);
            }
        });
    }, 500*page_requested);
}




























app.get('/access-delivery-order-datas-from-accurate', async (req, res) => {
    var options = {
        'method': 'GET',
        'url': 'http://localhost:3001/get-accurate-token-and-session',
        'headers': {
        }
    };
    await request(options, async function (error, response) {
        if (error) throw new Error(error);
        // console.log(response.body);
        var token_and_session = JSON.parse(response.body);
        var token = token_and_session.access_token;
        var session = token_and_session.session_id;
        var page_requested = 1;
        var total_page_available = 0;
        var saved_sales_order_id_list = [];
        options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/delivery-order/list.do?' + 'sp.page=' + 1,
            'headers': {
                'Authorization': 'Bearer ' + token,
                'X-Session-ID': session,
            }
        };
        await request(options, async function (error, response) {
            if (error) throw new Error(error);
            total_page_available = JSON.parse(response.body).sp.pageCount;
            var temp ;
            while(page_requested <= total_page_available){
                gettingDeliveryOrderList(token, session, page_requested, saved_sales_order_id_list);
                page_requested++;
            }
            setTimeout(function(){  
                var saved_sales_order_id_list_with_details = [];
                var i = 0;
                for(i; i < saved_sales_order_id_list.length; i ++){
                    gettingDeliveryOrderListWithDetails(token, session, saved_sales_order_id_list[i].id, saved_sales_order_id_list_with_details, i);
                }
                setTimeout(function(){ 
                    var sorted_out_saved_sales_order_id_list_with_details = [];
                    sortOutDeliveryOrderDetails(saved_sales_order_id_list_with_details, sorted_out_saved_sales_order_id_list_with_details);
                    sendDataToMySQLDeliveryOrder(sorted_out_saved_sales_order_id_list_with_details);
                    var responseTemp = {
                        totalLength : saved_sales_order_id_list.length,
                        totalLengthAfterDetails : saved_sales_order_id_list_with_details.length,
                        totalLengthAfterDetailsSorted : sorted_out_saved_sales_order_id_list_with_details.length
                    };
                    console.log(responseTemp);
                    setTimeout(() => {
                        res.send(sorted_out_saved_sales_order_id_list_with_details);
                    }, sorted_out_saved_sales_order_id_list_with_details * 3000);
                }, saved_sales_order_id_list.length*3600*1.2);
                // res.send(saved_sales_order_id_list);
            }, total_page_available*1000);
        });
    });
})

async function sendDataToMySQLDeliveryOrder(sorted_out_saved_sales_order_id_list_with_details){
    var i=0;
    for(i; i < sorted_out_saved_sales_order_id_list_with_details.length; i++){
        accessingMySQLDeliveryOrder(sorted_out_saved_sales_order_id_list_with_details, i);
    }
}

async function accessingMySQLDeliveryOrder(sorted_out_saved_sales_order_id_list_with_details, i){
    setTimeout(() => {
        console.log(sorted_out_saved_sales_order_id_list_with_details[i].number);
        var existingData;
        var sql = `select * from vtportal.delivery_order_list_accurate where delivery_number = '${sorted_out_saved_sales_order_id_list_with_details[i].number}';`;
        con.query(sql, function (err, result) {
            if (err) console.log(err);
            existingData = result[0];
        });
        setTimeout(() => {
            var shippingDate = sorted_out_saved_sales_order_id_list_with_details[i].delivery_time;
            if(sorted_out_saved_sales_order_id_list_with_details[i].delivery_time != null || sorted_out_saved_sales_order_id_list_with_details[i].delivery_time != undefined){
                var thedate = new Date(sorted_out_saved_sales_order_id_list_with_details[i].delivery_time);
                var day = thedate.getDate().toString();
                var month = (thedate.getMonth() + 1).toString();
                var year = thedate.getUTCFullYear().toString();
                shippingDate = year + "-" + month + "-" + day;
            }
            if(shippingDate == 'NaN-NaN-NaN' || shippingDate == null){
                console.log("============================= date is null =============================");
                shippingDate = "1971-01-01";
            }
            if(existingData == undefined){ // data does not exist
                var sql = `insert into vtportal.delivery_order_list_accurate values 
                ('${sorted_out_saved_sales_order_id_list_with_details[i].number}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].customer_name}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].shipping_address}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].responsible_user}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].sales_order_number}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].status}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].total_price}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].total_quantity}'
                , '${shippingDate}'
                );`;
                con.query(sql, function (err, result) {
                    if (err) console.log(err);
                });
                var x = 0;
                for(x ; x < sorted_out_saved_sales_order_id_list_with_details[i].delivery_order_detail.length; x++){
                    insertOrderDetails(sorted_out_saved_sales_order_id_list_with_details, i , x);
                }
            }else{
                console.log("=========================== update function is not available ===========================");
            }
        }, 3000);
    }, 500*i);
}

async function insertOrderDetails(sorted_out_saved_sales_order_id_list_with_details, i , x){
    setTimeout(() => {
        var sql = `insert into vtportal.delivery_order_details_accurate values 
        ('${sorted_out_saved_sales_order_id_list_with_details[i].delivery_order_detail[x].oid}'
        , '${sorted_out_saved_sales_order_id_list_with_details[i].delivery_order_detail[x].number}'
        , '${sorted_out_saved_sales_order_id_list_with_details[i].delivery_order_detail[x].product_code}'
        , '${sorted_out_saved_sales_order_id_list_with_details[i].delivery_order_detail[x].product_name}'
        , '${sorted_out_saved_sales_order_id_list_with_details[i].delivery_order_detail[x].quantity}'
        , '${sorted_out_saved_sales_order_id_list_with_details[i].delivery_order_detail[x].total_price}'
        );`;
        con.query(sql, function (err, result) {
            if (err) console.log(err);
        });
    }, 1000);
}

async function sortOutDeliveryOrderDetails(saved_sales_order_id_list_with_details, sorted_out_saved_sales_order_id_list_with_details){
    var i=0;
    for(i; i < saved_sales_order_id_list_with_details.length; i++){
        var total_price = 0;
        var total_quantity = 0;
        var x = 0;
        var delivery_order_detail = [];
        for(x; x < saved_sales_order_id_list_with_details[i].detailItem.length; x++){
            var thedate = new Date();
            var uniqueCode = 
                (
                (Math.floor((Math.random() * 10) + 1)*2) +
                (Math.floor((Math.random() * 20) + 11)*3) +
                (Math.floor((Math.random() * 30) + 21)*4) +
                (Math.floor((Math.random() * 40) + 31)*5) +
                (Math.floor((Math.random() * 50) + 41)*6) +
                (Math.floor((Math.random() * 60) + 51)*7) +
                (Math.floor((Math.random() * 70) + 61)*8) +
                (Math.floor((Math.random() * 80) + 71)*9) +
                (Math.floor((Math.random() * 90) + 81)*10) +
                (Math.floor((Math.random() * 100) + 91)*11) +
                (Math.floor((Math.random() * 110) + 101)*12) +
                (Math.floor((Math.random() * 210) + 201)*13) +
                (Math.floor((Math.random() * 310) + 301)*14) +
                (Math.floor((Math.random() * 410) + 401)*15) +
                (Math.floor((Math.random() * 510) + 501)*16) +
                (Math.floor((Math.random() * 610) + 601)*17) +
                (Math.floor((Math.random() * 710) + 701)*18) +
                (Math.floor((Math.random() * 810) + 801)*19) +
                (Math.floor((Math.random() * 910) + 901)*20) +
                (Math.floor((Math.random() * 1010) + 1001)*21) +
                (Math.floor((Math.random() * 1110) + 1101)*22) +
                (Math.floor((Math.random() * 1210) + 1201)*23) +
                (Math.floor((Math.random() * 1310) + 1301)*24)
                ) * (Math.floor((Math.random() * 10) + 1)*2) * (Math.floor((Math.random() * 7) + 1)*7) + thedate.getMilliseconds()
            ;
            total_price = total_price + saved_sales_order_id_list_with_details[i].detailItem[x].totalPrice;
            total_quantity = total_quantity + saved_sales_order_id_list_with_details[i].detailItem[x].quantity;
            delivery_order_detail.push({
                oid: uniqueCode,
                number: saved_sales_order_id_list_with_details[i].number,
                product_code: saved_sales_order_id_list_with_details[i].detailItem[x].item.no,
                product_name: saved_sales_order_id_list_with_details[i].detailItem[x].item.name,
                quantity: saved_sales_order_id_list_with_details[i].detailItem[x].quantity,
                total_price: saved_sales_order_id_list_with_details[i].detailItem[x].totalPrice,
            });
        }
        var sorted = {
            number: saved_sales_order_id_list_with_details[i].number,
            customer_name: saved_sales_order_id_list_with_details[i].customer.name,
            shipping_address: saved_sales_order_id_list_with_details[i].toAddress,
            responsible_user: saved_sales_order_id_list_with_details[i].printUserName,
            sales_order_number: saved_sales_order_id_list_with_details[i].detailItem[0].salesOrder.number,
            delivery_time: saved_sales_order_id_list_with_details[i].printedTime,
            status: '232334',
            total_price: total_price,
            total_quantity: total_quantity,
            delivery_order_detail : delivery_order_detail
        };
        // "approvalStatus":"APPROVED"
        if(saved_sales_order_id_list_with_details[i].approvalStatus == "APPROVED"){
            sorted_out_saved_sales_order_id_list_with_details.push(sorted);
        }
    }
}

async function gettingDeliveryOrderListWithDetails(token, session, id, saved_sales_order_id_list_with_details, time){
    setTimeout(function(){ 
        var options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/delivery-order/detail.do?id=' + id,
            'headers': {
              'Authorization': 'Bearer ' + token,
              'X-Session-ID': session
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            console.log(id);
            saved_sales_order_id_list_with_details.push(JSON.parse(response.body).d);
        });
    }, time*3500);   
}

async function gettingDeliveryOrderList(token, session, page_requested, saved_sales_order_id_list){
    setTimeout(async () => {
        options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/delivery-order/list.do?' + 'sp.page=' + page_requested,
            'headers': {
                'Authorization': 'Bearer ' + token,
                'X-Session-ID': session,
            }
        };
        await request(options, async function (error, response) {
            if (error) throw new Error(error);
            var i = 0;
            for(i; i < JSON.parse(response.body).d.length; i ++){
                await saved_sales_order_id_list.push(JSON.parse(response.body).d[i]);
            }
        });
    }, 500*page_requested);
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
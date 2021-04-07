const express = require('express');
const cors = require('cors');
const app = express();
const port = 8888;
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
let connection;
runOracle();
async function runOracle() {
    try {
        connection = await oracledb.getConnection( {
            user          : "vt",
            password      : "vt",
            connectString : "172.31.207.223:1521/ORCL"
        });
        console.log("Connected! to ORCL");
    } catch (err) {
        console.error(err);
    } 
}

app.get('/test-oracle-access', async (req, res) => {
    // var sql = `insert into vtportal.sales_order_list_accurate values 
    // ('SO.2021.03.00044', '2021-03-26', '2021-03-26', 'C.O.D', 'Tb Wsm', '3788', 'Lutfhi Maulana Bachtiar', 'Fatmawati\nCilandak DKI Jakarta\nIndoneisa', 84, '1440000');`;
    // con.query(sql, function (err, result) {
    //     if (err) console.log(err);
    // });
    // var sql = `select * from vtportal.sales_order_list_accurate where so_number = 'SO.2021.03.00044';`;
    // con.query(sql, function (err, result) {
    //     if (err) console.log(err);
    //     res.send(result[0] == undefined);
    // });
    var test = "26 Mar 2021";
    var thedate = new Date(test);
    // thedate.setDate(thedate.getDate() + 30);
    var day = thedate.getDate().toString();
    var month = (thedate.getMonth() + 1).toString();
    var year = thedate.getUTCFullYear().toString();

    // var day = thedate.getDate() + 30;
    // if(day > 31 ){

    // }
    // var month = (thedate.getMonth() + 1);
    // var year = thedate.getUTCFullYear();
    res.send(year + "-" + month + "-" + day);
})

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

app.get('/access-sales-orders-from-accurate', async (req, res) => {
    var options = {
        'method': 'GET',
        'url': 'http://localhost:8888/get-accurate-token-and-session',
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
            'url': 'https://public.accurate.id/accurate/api/sales-order/list.do?' + 'sp.page=' + 1,
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
                        totalLengthAfterDetailsSorted : sorted_out_saved_sales_order_id_list_with_details
                    };
                    console.log(responseTemp);
                    res.send(sorted_out_saved_sales_order_id_list_with_details);
                }, saved_sales_order_id_list.length*3000*1.2);
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
    var existingData;
    var sql = `select * from vtportal.sales_order_list_accurate where so_number = '${sorted_out_saved_sales_order_id_list_with_details[i].sales_order_number}';`;
    con.query(sql, function (err, result) {
        if (err) console.log(err);
        existingData = result[0];
    });
    console.log("hereeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee");
    console.log(existingData);
    setTimeout(() => {
        if(existingData == undefined){ // data does not exist
            var thedate = new Date(sorted_out_saved_sales_order_id_list_with_details[i].order_date);
            var day = thedate.getDate().toString();
            var month = (thedate.getMonth() + 1).toString();
            var year = thedate.getUTCFullYear().toString();
            thedate.setDate(thedate.getDate() + sorted_out_saved_sales_order_id_list_with_details[i].period_date);
            var dayPeriod = thedate.getDate().toString();
            var monthPeriod = (thedate.getMonth() + 1).toString();
            var yearPeriod = thedate.getUTCFullYear().toString();
            var sql = `insert into vtportal.sales_order_list_accurate values 
            ('${sorted_out_saved_sales_order_id_list_with_details[i].sales_order_number}'
            , '${year + "-" + month + "-" + day}'
            , '${yearPeriod + "-" + monthPeriod + "-" + dayPeriod}'
            , '${sorted_out_saved_sales_order_id_list_with_details[i].payment_method}'
            , '${sorted_out_saved_sales_order_id_list_with_details[i].customer_name}'
            , '${sorted_out_saved_sales_order_id_list_with_details[i].customer_code}'
            , '${sorted_out_saved_sales_order_id_list_with_details[i].salesman}'
            , '${sorted_out_saved_sales_order_id_list_with_details[i].delivery_address}'
            , ${sorted_out_saved_sales_order_id_list_with_details[i].total_quantities}
            , '${sorted_out_saved_sales_order_id_list_with_details[i].total_amount}');`;
            con.query(sql, function (err, result) {
                if (err) console.log(err);
            });
            var x = 0;
            for(x ; x < sorted_out_saved_sales_order_id_list_with_details[i].order_details.length; x++){
                insertOrderDetails(sorted_out_saved_sales_order_id_list_with_details, i , x);
            }
        }else{
            var thedate = new Date(sorted_out_saved_sales_order_id_list_with_details[i].order_date);
            var day = thedate.getDate().toString();
            var month = (thedate.getMonth() + 1).toString();
            var year = thedate.getUTCFullYear().toString();
            thedate.setDate(thedate.getDate() + sorted_out_saved_sales_order_id_list_with_details[i].period_date);
            var dayPeriod = thedate.getDate().toString();
            var monthPeriod = (thedate.getMonth() + 1).toString();
            var yearPeriod = thedate.getUTCFullYear().toString();
            var sql = `UPDATE vtportal.sales_order_list_accurate SET 
            order_date = '${year + "-" + month + "-" + day}'
            , period_date = '${yearPeriod + "-" + monthPeriod + "-" + dayPeriod}'
            , payment_method = '${sorted_out_saved_sales_order_id_list_with_details[i].payment_method}'
            , customer_name = '${sorted_out_saved_sales_order_id_list_with_details[i].customer_name}'
            , customer_code = '${sorted_out_saved_sales_order_id_list_with_details[i].customer_code}'
            , salesman = '${sorted_out_saved_sales_order_id_list_with_details[i].salesman}'
            , delivery_address = '${sorted_out_saved_sales_order_id_list_with_details[i].delivery_address}'
            , total_quantities = ${sorted_out_saved_sales_order_id_list_with_details[i].total_quantities}
            , total_amount = '${sorted_out_saved_sales_order_id_list_with_details[i].total_amount}'
            WHERE so_number = '${sorted_out_saved_sales_order_id_list_with_details[i].sales_order_number}';`;
            con.query(sql, function (err, result) {
                if (err) console.log(err);
            });
            var x = 0;
            for(x ; x < sorted_out_saved_sales_order_id_list_with_details[i].order_details.length; x++){
                updateOrderDetails(sorted_out_saved_sales_order_id_list_with_details, i , x);
            }
        }
    }, 2000);
}

async function updateOrderDetails(sorted_out_saved_sales_order_id_list_with_details, i , x){
    var sql = `UPDATE vtportal.sales_order_details_accurate SET 
    name = '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].name}'
    , product_code = '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].product_code}'
    , quantity_bought = '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].quantity_bought}'
    , price_per_unit = '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].price_per_unit}'
    , total_price = '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].total_price_based_on_quantity}'
    WHERE so_number = '${sorted_out_saved_sales_order_id_list_with_details[i].sales_order_number}';`;
    con.query(sql, function (err, result) {
        if (err) console.log(err);
    });
}

async function insertOrderDetails(sorted_out_saved_sales_order_id_list_with_details, i , x){
    var sql = `insert into vtportal.sales_order_details_accurate values 
    ('${sorted_out_saved_sales_order_id_list_with_details[i].sales_order_number}'
    , '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].name}'
    , '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].product_code}'
    , '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].quantity_bought}'
    , '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].price_per_unit}'
    , '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].total_price_based_on_quantity}');`;
    con.query(sql, function (err, result) {
        if (err) console.log(err);
    });
}


async function sortOutSalesOrderDetails(saved_sales_order_id_list_with_details, sorted_out_saved_sales_order_id_list_with_details){
    var i=0;
    for(i; i < saved_sales_order_id_list_with_details.length; i++){
        var x=0;
        var totalQuantities = 0;
        var orderDetailsArray = [];
        for(x; x < (saved_sales_order_id_list_with_details[i].detailItem).length; x++){
            totalQuantities = totalQuantities + saved_sales_order_id_list_with_details[i].detailItem[x].quantityDefault;
            orderDetailsArray.push({
                name : saved_sales_order_id_list_with_details[i].detailItem[x].item.name,
                product_code : saved_sales_order_id_list_with_details[i].detailItem[x].item.no,
                quantity_bought : saved_sales_order_id_list_with_details[i].detailItem[x].quantityDefault,
                price_per_unit : saved_sales_order_id_list_with_details[i].detailItem[x].availableUnitPrice,
                total_price_based_on_quantity : saved_sales_order_id_list_with_details[i].detailItem[x].totalPrice
            });
        }

        var sorted = {
            sales_order_number: saved_sales_order_id_list_with_details[i].number,
            order_date: saved_sales_order_id_list_with_details[i].transDateView,
            period_date: saved_sales_order_id_list_with_details[i].paymentTerm.netDays,
            payment_method: saved_sales_order_id_list_with_details[i].paymentTerm.name,
            customer_name: saved_sales_order_id_list_with_details[i].customer.name,
            customer_code: saved_sales_order_id_list_with_details[i].customer.customerNo,
            salesman: saved_sales_order_id_list_with_details[i].detailItem[0].salesmanName,
            delivery_address: saved_sales_order_id_list_with_details[i].toAddress,
            // delivery_address_details: saved_sales_order_id_list_with_details[i].customer.shipAddress,
            total_quantities: totalQuantities,
            total_amount: saved_sales_order_id_list_with_details[i].totalAmount,
            order_details: orderDetailsArray
        }
        // console.log(saved_sales_order_id_list_with_details[i].approvalStatus);
        // console.log(saved_sales_order_id_list_with_details[i].percentShipped == 100.000000);
        // console.log(saved_sales_order_id_list_with_details[i].approvalStatus == "APPROVED" && saved_sales_order_id_list_with_details[i].percentShipped == 100.000000);
        if(saved_sales_order_id_list_with_details[i].approvalStatus == "APPROVED" && saved_sales_order_id_list_with_details[i].percentShipped == 100.000000){
            // console.log(saved_sales_order_id_list_with_details[i].approvalStatus);
            sorted_out_saved_sales_order_id_list_with_details.push(sorted);
        }
        // sorted_out_saved_sales_order_id_list_with_details.push(sorted);
    }
}

async function gettingSalesOrderListWithDetails(token, session, id, saved_sales_order_id_list_with_details, time){
    setTimeout(function(){ 
        var options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/sales-order/detail.do?id=' + id,
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
    }, time*3000);   
}

async function gettingSalesOrderList(token, session, page_requested, saved_sales_order_id_list){
    options = {
        'method': 'GET',
        'url': 'https://public.accurate.id/accurate/api/sales-order/list.do?' + 'sp.page=' + page_requested + '&fields=id,number,percentShipped',
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
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
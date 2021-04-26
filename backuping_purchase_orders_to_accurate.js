const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;
app.use(cors(), express.json());
var mysql = require('mysql');
var request = require('request');
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

app.get('/access-purchase-orders-from-accurate', async (req, res) => {
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
            'url': 'https://public.accurate.id/accurate/api/purchase-order/list.do?' + 'sp.page=' + 1,
            'headers': {
                'Authorization': 'Bearer ' + token,
                'X-Session-ID': session,
            }
        };
        await request(options, async function (error, response) {
            if (error) throw new Error(error);
            // console.log(JSON.parse(response.body));
            total_page_available = JSON.parse(response.body).sp.pageCount;
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
                    console.log("===================== sortOutSalesOrderDetails =====================");
                    // res.send(saved_sales_order_id_list_with_details);
                    var sorted_out_saved_sales_order_id_list_with_details = [];
                    sortOutSalesOrderDetails(saved_sales_order_id_list_with_details, sorted_out_saved_sales_order_id_list_with_details);
                    // res.send(sorted_out_saved_sales_order_id_list_with_details);
                    execution(saved_sales_order_id_list, saved_sales_order_id_list_with_details, sorted_out_saved_sales_order_id_list_with_details);
                    setTimeout(() => {
                        res.send(sorted_out_saved_sales_order_id_list_with_details);
                    }, saved_sales_order_id_list.length*700*1.2);
                }, saved_sales_order_id_list.length*650*1.25);
                // res.send(saved_sales_order_id_list);
            }, total_page_available*1000);
        });
    });
})

function execution(saved_sales_order_id_list, saved_sales_order_id_list_with_details, sorted_out_saved_sales_order_id_list_with_details){
    setTimeout(() => {
        console.log("===================== responseTemp =====================");
        var responseTemp = {
            totalLength : saved_sales_order_id_list.length,
            totalLengthAfterDetails : saved_sales_order_id_list_with_details.length,
            totalLengthAfterDetailsSorted : sorted_out_saved_sales_order_id_list_with_details.length
        };
        sendDataToMySQL(sorted_out_saved_sales_order_id_list_with_details);
        console.log(responseTemp);
    }, saved_sales_order_id_list.length*250);
}

async function sendDataToMySQL(sorted_out_saved_sales_order_id_list_with_details){
    var i=0;
    for(i; i < sorted_out_saved_sales_order_id_list_with_details.length; i++){
        accessingMySQL(sorted_out_saved_sales_order_id_list_with_details, i);
    }
}

async function accessingMySQL(sorted_out_saved_sales_order_id_list_with_details, i){
    setTimeout(() => {
        console.log(sorted_out_saved_sales_order_id_list_with_details[i].purchase_order_number);
        var existingData;
        var sql = `select * from vtportal.purchaseOrderDetails where purchase_order_number = '${sorted_out_saved_sales_order_id_list_with_details[i].purchase_order_number}';`;
        con.query(sql, function (err, result) {
            if (err) console.log(err);
            existingData = result[0];
        });
        setTimeout(() => {
            if(existingData == undefined){ // data does not exist
                var sql = `insert into vtportal.purchaseOrderDetails values 
                ('${sorted_out_saved_sales_order_id_list_with_details[i].purchase_order_number}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].order_date}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].printed_by}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].supplier_name}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].supplier_no}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].supplier_tax_type}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].status}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].total_amount}'
                , '${sorted_out_saved_sales_order_id_list_with_details[i].total_quantities}'
                );`;
                con.query(sql, function (err, result) {
                    if (err) console.log(err);
                });
                var x = 0;
                for(x ; x < sorted_out_saved_sales_order_id_list_with_details[i].order_details.length; x++){
                    insertOrderDetails(sorted_out_saved_sales_order_id_list_with_details, i , x);
                }
            }else{
                var sql = `UPDATE vtportal.sales_order_list_accurate SET 
                order_date = '${sorted_out_saved_sales_order_id_list_with_details[i].order_date}'
                , printed_by = '${sorted_out_saved_sales_order_id_list_with_details[i].printed_by}'
                , supplier_name = '${sorted_out_saved_sales_order_id_list_with_details[i].supplier_name}'
                , supplier_no = '${sorted_out_saved_sales_order_id_list_with_details[i].supplier_no}'
                , supplier_tax_type = '${sorted_out_saved_sales_order_id_list_with_details[i].supplier_tax_type}'
                , status = '${sorted_out_saved_sales_order_id_list_with_details[i].status}'
                , total_amount = '${sorted_out_saved_sales_order_id_list_with_details[i].total_amount}'
                , total_quantities = '${sorted_out_saved_sales_order_id_list_with_details[i].total_quantities}'
                WHERE so_number = '${sorted_out_saved_sales_order_id_list_with_details[i].purchase_order_number}';`;
                con.query(sql, function (err, result) {
                    if (err) console.log(err);
                });
                var x = 0;
                for(x ; x < sorted_out_saved_sales_order_id_list_with_details[i].order_details.length; x++){
                    updateOrderDetails(sorted_out_saved_sales_order_id_list_with_details, i , x);
                }
            }
        }, 3001);
    }, 500*i);
}

async function updateOrderDetails(sorted_out_saved_sales_order_id_list_with_details, i , x){
    setTimeout(() => {
        var sql = `UPDATE vtportal.purchaseOrderItemDetails SET 
        name = '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].name}'
        , quantity_bought = '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].quantity_bought}'
        , price_per_unit = '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].price_per_unit}'
        , total_price = '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].total_price_based_on_quantity}'
        WHERE purchase_order_number = '${sorted_out_saved_sales_order_id_list_with_details[i].purchase_order_number}'
        and product_code = '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].product_code}';`;
        con.query(sql, function (err, result) {
            if (err) console.log(err);
        });
    }, 100);
}

async function insertOrderDetails(sorted_out_saved_sales_order_id_list_with_details, i , x){
    setTimeout(() => {
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
        var sql = `insert into vtportal.purchaseOrderItemDetails values 
        ('${sorted_out_saved_sales_order_id_list_with_details[i].purchase_order_number}'
        , '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].name}'
        , '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].product_code}'
        , '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].quantity_bought}'
        , '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].price_per_unit}'
        , '${sorted_out_saved_sales_order_id_list_with_details[i].order_details[x].total_price_based_on_quantity}'
        , '${uniqueCode}'
        );`;
        con.query(sql, function (err, result) {
            if (err) console.log(err);
        });
    }, 100);
}

async function sortOutSalesOrderDetails(saved_sales_order_id_list_with_details, sorted_out_saved_sales_order_id_list_with_details){
    var i=0;
    for(i; i < saved_sales_order_id_list_with_details.length; i++){
        var x=0;
        var totalQuantities = 0;
        var orderDetailsArray = [];
        if(saved_sales_order_id_list_with_details[i].detailItem != undefined){
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
                purchase_order_number: saved_sales_order_id_list_with_details[i].number,
                order_date: saved_sales_order_id_list_with_details[i].printedTime,
                printed_by: saved_sales_order_id_list_with_details[i].printUserName,
                supplier_name: saved_sales_order_id_list_with_details[i].vendor.wpName,
                supplier_no: saved_sales_order_id_list_with_details[i].vendor.vendorNo,
                supplier_tax_type: saved_sales_order_id_list_with_details[i].vendor.vendorTaxType,
                status: saved_sales_order_id_list_with_details[i].statusName,
                total_amount: saved_sales_order_id_list_with_details[i].totalAmount,
                total_quantities: totalQuantities,
                order_details: orderDetailsArray
            }
            sorted_out_saved_sales_order_id_list_with_details.push(sorted);
        }
    }
}

async function gettingSalesOrderListWithDetails(token, session, id, saved_sales_order_id_list_with_details, time){
    setTimeout(function(){ 
        var options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/purchase-order/detail.do?id=' + id,
            'headers': {
              'Authorization': 'Bearer ' + token,
              'X-Session-ID': session
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            console.log(id);
            if(response != undefined){
                saved_sales_order_id_list_with_details.push(JSON.parse(response.body).d);   
            }
        });
    }, time*500);   
}

async function gettingSalesOrderList(token, session, page_requested, saved_sales_order_id_list){
    setTimeout(async () => {
        options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/purchase-order/list.do?' + 'sp.page=' + page_requested + '',
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
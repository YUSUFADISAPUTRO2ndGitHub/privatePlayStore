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
    // const result = await connection.execute(
    //     `INSERT INTO AJT_SO (LNGSTOCKORDEROID, STRSTOCKORDERID, DELETED, STATUS, DATAPPDEF4, DATAPPDEF5, STRPAYMENT, STRAPPDEF2, STRAPPDEF3, STRAPPDEF9, STRAPPDEF10, LNGAPPDEF2, LNGAPPDEF3)
    //     VALUES(23223232323, '23223232323', 'DEV', 232313, TO_DATE('2020-09-11','YYYY-MM-DD'), TO_DATE('2020-09-11','YYYY-MM-DD') + 90, 'period', 'Fajar', '2000', 'Bagus', 'TB Tuongku Jaya Jaya Jl.KH. Abdullah Syafei;Tebet;Kota Administrasi Jakarta Selatan;DKI Jakarta', 24, 600000)`
    // );

    const result = await connection.execute(
        "INSERT INTO AJT_SO (LNGSTOCKORDEROID, STRSTOCKORDERID, DELETED, STATUS, DATAPPDEF4, DATAPPDEF5, STRPAYMENT, STRAPPDEF2, STRAPPDEF3, STRAPPDEF9, STRAPPDEF10, LNGAPPDEF2, LNGAPPDEF3)" +
        " VALUES " + 
        "(:0, :1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13)", 
        ["23232323232", "23232323232", "DEV", "232313", "TO_DATE(\'2020-09-11\',\'YYYY-MM-DD\')", "TO_DATE(\'2020-09-11\',\'YYYY-MM-DD\')", "period", "Fajar", "2000", "Bagus", "TB Tuongku Jaya Jaya Jl.KH. Abdullah Syafei;Tebet;Kota Administrasi Jakarta Selatan;DKI Jakarta", "24", "600000"],
        { autoCommit: true }
    );
    res.send(result);
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
        console.log(response.body);
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
                    // sendDataToORCL(sorted_out_saved_sales_order_id_list_with_details);
                    var responseTemp = {
                        totalLength : saved_sales_order_id_list.length,
                        totalLengthAfterDetails : saved_sales_order_id_list_with_details.length,
                        totalLengthAfterDetailsSorted : sorted_out_saved_sales_order_id_list_with_details
                    };
                    console.log(responseTemp);
                    res.send(sorted_out_saved_sales_order_id_list_with_details);
                }, saved_sales_order_id_list.length*1000*1.2);
                // res.send(saved_sales_order_id_list);
            }, total_page_available*1000);
        });
    });
})

async function sendDataToORCL(sorted_out_saved_sales_order_id_list_with_details){
    var i=0;
    for(i; i < sorted_out_saved_sales_order_id_list_with_details.length; i++){
        const result = await connection.execute(
            `SELECT strstockorderid FROM ajt_so WHERE strstockorderid = \'${sorted_out_saved_sales_order_id_list_with_details[i].sales_order_number}\'`
        );
        console.log(result.rows);
        if((result.rows).length == 0){
            console.log(sorted_out_saved_sales_order_id_list_with_details[i].sales_order_number + " NOT FOUND IN ORCL");
            let sectionId = await connection.execute(
                    `select bs_danju.nextval from dual`
            );
            sectionId = sectionId.rows[0][0];
            const insertIntoORCL = await connection.execute(
                `insert into AJT_SO(lngstockorderoid, strstockorderid, deleted, status,  datappdef4, trappdef9, strpayment, strappdef2, strappdef6, strappdef9, strappdef10, lngappdef2, lngappdef3) 
                values(${sectionId}, ${sorted_out_saved_sales_order_id_list_with_details[i].sales_order_number}, 'dev', '232314', order_date(yyyy/mm/dd), ${sorted_out_saved_sales_order_id_list_with_details[i].payment_method}, ${sorted_out_saved_sales_order_id_list_with_details[i].customer_name}, ${sorted_out_saved_sales_order_id_list_with_details[i].customer_code},${sorted_out_saved_sales_order_id_list_with_details[i].salesman},${sorted_out_saved_sales_order_id_list_with_details[i].delivery_address},${sorted_out_saved_sales_order_id_list_with_details[i].total_quantities},${sorted_out_saved_sales_order_id_list_with_details[i].total_amount}) `
            );
        }else{
            
        }
        // const result = await connection.execute(
        //     `insert into AJT_SO(lngstockorderoid, strstockorderid, deleted, status,  datappdef4, trappdef9, strpayment, strappdef2, strappdef6, strappdef9, strappdef10, lngappdef2, lngappdef3) 
        //     values(sales_order_number, sales_order_number, 'dev', '232314', order_date(yyyy/mm/dd), payment_method, customer_name, customer_code,salesman,delivery_address,total_quantities,total_amount) `
        // );
        // const result = await connection.execute(
        //     `insert into AJT_SO_DETAIL(lngstockorderoid, status,  strappdef3, strappdef2, lngnumber, fltprice, fltpricenum) 
        //     values(sales_order_number, '232314', name, product_code, quantity_bought, price_per_unit, total_price_based_on_quantity) `
        // );
    }
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
    }, time*1000);   
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
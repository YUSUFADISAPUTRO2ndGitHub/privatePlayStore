process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
var mysql = require('mysql');
const app = express();
const port = 3000;
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

app.post('/make-sales-order-normal', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting sales order");
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var customerNo = req.query.customerNo;
    var transDate = req.query.transDate;
    var address = req.query.address;
    var paymentTermName = req.query.paymentTermName;
    var items = req.body.item;
    var accurateRequestURL = 'https://public.accurate.id/accurate/api/sales-order/save.do?customerNo=' + customerNo + '&transDate=' + transDate + '&toAddress=' + address + '&paymentTermName=' + paymentTermName + '&branchId=50&branchName=Head Quarter';
    var i = 0;
    for(i ; i < items.length ; i++){
        accurateRequestURL = accurateRequestURL + `&detailItem[${i}].itemNo=${items[i].no}&detailItem[${i}].unitPrice=${items[i].unitPrice}&detailItem[${i}].quantity=${items[i].requestQuantity}`;
    }
    console.log(accurateRequestURL);
    var request = require('request');
    var options = {
        'method': 'POST',
        'url': accurateRequestURL,
        'headers': {
            'X-Session-ID': clientSessionId,
            'Authorization': 'Bearer ' + clientAccessToken
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(result != undefined || result != null){
            if(result.r != undefined){
                var result = JSON.parse(response.body);
                var returnResponse = {
                    salesOrderNumber: result.r.detailItem[0].salesOrder.number,
                    salesOrderId: result.r.detailItem[0].salesOrder.id,
                    paymentTermId: result.r.paymentTermId
                };
                res.send(returnResponse);
            }
        }
    });

})

app.get('/create-automated-sales', (req, res) => {
    initiateSalesOrders(req.query.vaNumber, res);
})

function initiateSalesOrders(vaNumber, res){
    var getSalesOrderInformation = "http://localhost:8080/getSalesOrderFromVA.jsp?vaNumber=" + vaNumber;

    var request = require('request');
    var options = {
        'method': 'GET',
        'url': getSalesOrderInformation,
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var datas = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'http://localhost:8888/get-lastest-token-and-session',
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                if(response != undefined || response != null){

                }
                var result = JSON.parse(response.body);
                var items = {"item":datas.item};
                options = {
                    'method': 'POST',
                    'url': 'http://localhost:3000/make-sales-order-normal?accessToken=' + result.access_token + '&sessionId=' + result.session_id + '&customerNo=' + datas.customerDetails.customerNo + '&transDate=' + datas.customerDetails.transDate + '&address=' + datas.customerDetails.address + '&paymentTermName=' + datas.customerDetails.paymentTermName + '',
                    'headers': {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(items)
                };
                request(options, function (error, response) {
                    if (error) console.log(error);
                    if(response != undefined || response != null){
                        console.log(response.body);
                        result = JSON.parse(response.body);
                        res.send(result);
                    }
                });

            });
        }
    });
}

app.listen(port, () => {
    console.log(`Sales order app listening at http://localhost:${port}`)
})
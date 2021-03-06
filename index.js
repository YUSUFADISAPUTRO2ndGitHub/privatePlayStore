process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
var path = require('path');
var mysql = require('mysql');
const app = express();
const port = 8888; //8888
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
var latestVersion = '1.0.8';
app.get('/check-app-latest-version', (req, res) => {
    var userAppVersion = req.query.version;
    console.log(userAppVersion);
    var response ={
        status: true,
        version: latestVersion
    };
    if(latestVersion == userAppVersion){
        response ={
            status: true,
            version: latestVersion
        }
    }else{
        response ={
            status: false,
            version: latestVersion
        }
    }
    res.send(response);
})

app.get('/download-vantsing-mobile-shopping', (req, res) => {
    const file = `./Vantsing.apk`;
    res.download(file); // Set disposition and send it.
})

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname + '/index.html'));
})

// this is just a token at the beginning, token will be dynamic and refreshed based on time interval
var refresh_token = 'c253ec12-5bba-4343-a4d1-04c9b7fb958f';
var access_token = '6674cbb0-c250-40df-a3c4-ec07dd1a087b';
var session_id_for_accurate_db = '';
var request = require('request');
function getRefreshedToken() {
    console.log("################################################################");
    con.query("select access_token, refresh_token from vtportal.accurateCredentials as acc order by acc.last_updated desc limit 1", function (err, result, fields) {
        if (err) console.log(err);
        access_token = result[0].access_token;
        refresh_token = result[0].refresh_token;
        console.log("last updated access token : " + access_token);
        console.log("last updated refresh token : " + refresh_token);
        var options = {
            'method': 'POST',
            'url': 'https://account.accurate.id/oauth/token?grant_type=refresh_token&refresh_token=' + refresh_token,
            'headers': {
                'Authorization': 'Basic ZTI3MTQzYTktNmU4NC00MGE0LTlhYmUtNGQ1NzM2YzZlNDdkOmYxOGU2ZjRiMjE5NTUwNWFiZjZjMWZmOTZlOTJlZDY3'
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                // console.log(result);
                var sql = `INSERT INTO vtportal.accurateCredentials (access_token, refresh_token, expires_in, access_scope, last_updated) VALUES ('${result.access_token}', '${result.refresh_token}', ${result.expires_in}, '${result.scope}', NOW())`;
                con.query(sql, function (err, result) {
                    if (err) console.log(err);
                    console.log("Recorded in  MySQL");
                });
                refresh_token = result.refresh_token;
                access_token = result.access_token;
                console.log("newest refresh_token > " + refresh_token);
                console.log("newest access_token > " + access_token);
                getSessionId(access_token);
            }
        });
    });
}
setInterval(getRefreshedToken, 513997357);//513997357

function getSessionId(accessToken){
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'https://account.accurate.id/api/open-db.do?id=300600',
        'headers': {
            'Authorization': 'Bearer ' + accessToken
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            var sql = `UPDATE vtportal.accurateCredentials SET session_id='${result.session}' WHERE access_token ='${accessToken}';`;
            con.query(sql, function (err, result) {
                if (err) console.log(err);
                console.log("Recorded update session db in  MySQL");
            });
            session_id_for_accurate_db = result.session;
            console.log("session id for db : " + session_id_for_accurate_db);
        }
    });

}

engineJumpStart();
function engineJumpStart(){
    allItems = {};
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'http://localhost:8888/get-lastest-token-and-session',
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'http://localhost:8888/get-item-all?accessToken=' + result.access_token + '&sessionId=' + result.session_id + '',
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                if(response != undefined){
                    allItems = JSON.parse(response.body);
                    // console.log(allItems);
                    console.log("all items saved to MEM =============================================== ");
                }
            });
        }
    });
    groupBuyItems = {};
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'http://localhost:8888/get-lastest-token-and-session',
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'http://localhost:8888/get-item-all-group-buy?accessToken=' + result.access_token + '&sessionId=' + result.session_id + '',
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                // groupBuyItems = JSON.parse(response.body);
                if(response != undefined){
                    groupBuyItems = JSON.parse(response.body);
                    console.log("group items saved to MEM =============================================== ");
                }
            });
        }
    });
    newItems = {};
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'http://localhost:8888/get-lastest-token-and-session',
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'http://localhost:8888/get-item-all-new?accessToken=' + result.access_token + '&sessionId=' + result.session_id + '',
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                // newItems = JSON.parse(response.body);
                if(response != undefined){
                    newItems = JSON.parse(response.body);
                    console.log("new items saved to MEM =============================================== ");
                }
                // console.log(newItems);
            });
        }
    });
    console.log("collectingSalesOrders to MEM =============================================== ");
    collectingSalesOrders();
    var options = {
        'method': 'GET',
        'url': 'http://localhost:8888/get-lastest-token-and-session',
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'http://localhost:8888/get-item-all-complete?accessToken=' + result.access_token + '&sessionId=' + result.session_id + '',
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                if(response != undefined){
                    console.log("allCompleteItems items saved to MEM =============================================== ");
                    allCompleteItems = {};
                    allCompleteItems = JSON.parse(response.body);
                    console.log(allCompleteItems);
                }
            });
        }
    });
}

app.get('/get-lastest-token-and-session',  (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting token and session");
    var sql = `select access_token, session_id from vtportal.accurateCredentials as acc order by acc.last_updated desc limit 1;`;
    con.query(sql, function (err, result) {
        if (err) console.log(err);
        console.log("accessing latest token and session request");
        console.log("result[0].access_token : " + result[0].access_token);
        console.log("result[0].session_id : " + result[0].session_id);
        access_token = result[0].access_token;
        session_id_for_accurate_db = result[0].session_id;
        var result = {
            access_token: result[0].access_token,
            session_id: result[0].session_id
        };
        res.send(result);
    });
})

app.get('/get-customer',  (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting customer complete");
    var customerList = [];
    var pageCount = 0;
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var pageRequested = req.query.page;
    if(req.query.page == undefined){
        pageRequested = 1;
    }
    var time = 1;
    var request = require('request');
    var url = 'https://public.accurate.id/accurate/api/customer/list.do' + '?sp.page=' + pageRequested + "&fields=charField6,id,name,customerNo,shipSameAsBill,shipStreet,shipCity,shipProvince,shipCountry,shipZipCode,shipAddressId,billStreet,billCity,billProvince,billCountry,billZipCode,billAddressId,mobilePhone,workPhone,email,npwpNo,idCard,discountCategoryId";
    console.log(url);
    var options = {
        'method': 'GET',
        'url': url,
        'headers': {
            'Authorization': 'Bearer ' + clientAccessToken,
            'X-Session-ID': clientSessionId
        }
    };
     request(options,  function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result =  JSON.parse(response.body);
            console.log(result);
            var i = 0;
            pageCount = result.sp.pageCount;
            time = (result.d).length;
            for (i ; i < (result.d).length; i ++){
                var resultCustomerObject = {
                    customerId : result.d[i].id,
                    name: result.d[i].name,
                    customerNo: result.d[i].customerNo,
                    shipSameAsBill: result.d[i].shipSameAsBill,
                    shipStreet: result.d[i].shipStreet,
                    shipCity: result.d[i].shipCity,
                    shipProvince: result.d[i].shipProvince,
                    shipCountry: result.d[i].shipCountry,
                    shipZipCode: result.d[i].shipZipCode,
                    shipAddressId: result.d[i].shipAddressId,
                    billStreet: result.d[i].billStreet,
                    billCity: result.d[i].billCity,
                    billProvince: result.d[i].billProvince,
                    billCountry: result.d[i].billCountry,
                    billZipCode: result.d[i].billZipCode,
                    billAddressId: result.d[i].billAddressId,
                    mobilePhone: result.d[i].mobilePhone,
                    workPhone: result.d[i].workPhone,
                    email: result.d[i].email,
                    npwpNo: result.d[i].npwpNo,
                    idCard: result.d[i].idCard,
                    discountCategoryId: result.d[i].discountCategoryId,

                }
                customerList.push(resultCustomerObject);
            }
            res.send({customerList, page_count: pageCount});
        }
    });
    // setTimeout(function(){ res.send({customerList, page_count: pageCount}); }, 1000);
})

app.get('/get-customer-all',  (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting customer all complete");
    var customerList = [];
    var pageCount = 0;
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var pageRequested;
    if(req.query.page == undefined){
        pageRequested = 1;
    }
    // var time = 1;
    console.log("clientAccessToken : " + clientAccessToken);
    console.log("clientSessionId : " + clientSessionId);
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'https://public.accurate.id/accurate/api/customer/list.do' + '?sp.page=' + pageRequested,
        'headers': {
            'Authorization': 'Bearer ' + clientAccessToken,
            'X-Session-ID': clientSessionId
        }
    };
    request(options,  function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result =  JSON.parse(response.body);
            pageCount = result.sp.pageCount;
            var status = true;
            while(status){

                var options = {
                    'method': 'GET',
                    'url': 'https://public.accurate.id/accurate/api/customer/list.do' + '?sp.page=' + pageRequested,
                    'headers': {
                        'Authorization': 'Bearer ' + clientAccessToken,
                        'X-Session-ID': clientSessionId
                    }
                };
                request(options,  function (error, response) {
                    if (error) console.log(error);
                    if(response != undefined || response != null){
                        var result =  JSON.parse(response.body);
                        var i = 0;
                        // time = (result.d).length;
                        for (i ; i < (result.d).length; i ++){
                            var options = {
                                'method': 'GET',
                                'url': 'https://public.accurate.id/accurate/api/customer/detail.do?id=' + result.d[i].id,
                                'headers': {
                                    'Authorization': 'Bearer ' + clientAccessToken,
                                    'X-Session-ID': clientSessionId
                                }
                            };
                            request(options,  function (error, response) {
                                if (error) console.log(error);
                                if(response != undefined || response != null){
                                    var resultDetails =  JSON.parse(response.body);
                                    customerList.push( {
                                        customerId : resultDetails.d.id,
                                        name: resultDetails.d.name,
                                        customerNo: resultDetails.d.customerNo,
                                        shipSameAsBill: resultDetails.d.shipSameAsBill,
                                        shipStreet: resultDetails.d.shipStreet,
                                        shipCity: resultDetails.d.shipCity,
                                        shipProvince: resultDetails.d.shipProvince,
                                        shipCountry: resultDetails.d.shipCountry,
                                        shipZipCode: resultDetails.d.shipZipCode,
                                        shipAddressId: resultDetails.d.shipAddressId,
                                        billStreet: resultDetails.d.billStreet,
                                        billCity: resultDetails.d.billCity,
                                        billProvince: resultDetails.d.billProvince,
                                        billCountry: resultDetails.d.billCountry,
                                        billZipCode: resultDetails.d.billZipCode,
                                        billAddressId: resultDetails.d.billAddressId,
                                        mobilePhone: resultDetails.d.mobilePhone,
                                        workPhone: resultDetails.d.workPhone,
                                        email: resultDetails.d.email,
                                        npwpNo: resultDetails.d.npwpNo,
                                        idCard: resultDetails.d.idCard,
                                        discountCategoryId: resultDetails.d.discountCategoryId,
                                    });
                                }
                                // customerList.push(resultCustomerObject);
                            });
                        }
                    }
                });
                pageRequested++;
                if(pageRequested > pageCount){
                    status = false;
                }
            }
            setTimeout(function(){ res.send({customerList, page_count: pageCount}); }, pageCount * 400);
        }
    });

    
    // setTimeout(function(){ setTimeout(function(){ res.send({customerList, page_count: pageCount}); }, time * 400); }, 1200);
})

app.get('/get-customer-details',  (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting customer details complete");
    var resultCustomerObject = {};
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var customerNo = req.query.customerNo;
    var customerName = req.query.customerName;
    var request = require('request');
    var fields = "fields=id,name,customerNo";
    var options = {
    'method': 'GET',
    'url': 'https://public.accurate.id/accurate/api/customer/list.do?' + fields + '&filter.keywords.op=CONTAIN&filter.keywords.val=' + customerName,
    'headers': {
            'Authorization': 'Bearer ' + clientAccessToken,
            'X-Session-ID': clientSessionId
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result =  JSON.parse(response.body);
            var i = 0;
            if(result.d != undefined || result.d != null){
                for(i; i < result.d.length; i ++){
                    if(result.d[i].customerNo == customerNo){
                        var request = require('request');
                        var options = {
                        'method': 'GET',
                        'url': 'https://public.accurate.id/accurate/api/customer/detail.do?id=' + result.d[i].id,
                        'headers': {
                                'Authorization': 'Bearer ' + clientAccessToken,
                                'X-Session-ID': clientSessionId
                            }
                        };
                        request(options, function (error, response) {
                            if (error) console.log(error);
                            if(response != undefined || response != null){
                                result =  JSON.parse(response.body);
                                resultCustomerObject = {
                                    customerId : result.d.id,
                                    name: result.d.name,
                                    customerNo: result.d.customerNo,
                                    shipSameAsBill: result.d.shipSameAsBill,
                                    shipStreet: result.d.shipStreet,
                                    shipCity: result.d.shipCity,
                                    shipProvince: result.d.shipProvince,
                                    shipCountry: result.d.shipCountry,
                                    shipZipCode: result.d.shipZipCode,
                                    shipAddressId: result.d.shipAddressId,
                                    billStreet: result.d.billStreet,
                                    billCity: result.d.billCity,
                                    billProvince: result.d.billProvince,
                                    billCountry: result.d.billCountry,
                                    billZipCode: result.d.billZipCode,
                                    billAddressId: result.d.billAddressId,
                                    mobilePhone: result.d.mobilePhone,
                                    workPhone: result.d.workPhone,
                                    email: result.d.email,
                                    npwpNo: result.d.npwpNo,
                                    idCard: result.d.idCard,
                                    discountCategoryId: result.d.discountCategoryId,
                                    detailShipAddress: result.d.detailShipAddress
                                };
                                res.send(resultCustomerObject);
                            }
                        });
                    }
                }
            }else{
                console.log("token maybe invalid");
            }
        }
    });     
})

app.get('/get-item', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting list complete");
    var itemList = [];
    var totalObjects = 0;
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var pageRequested = req.query.page;
    var pageCount = 0;
    if(req.query.page == undefined){
        pageRequested = 1;
    }
    var time = 1;
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.page=' + pageRequested + "&fields=charField6,numericField2,id,name,no,shortName,itemCategoryId,unitPrice,defaultDiscount,unit1Name,totalUnit1Quantity,availableToSell,detailItemImage,charField1,numericField1,charField2,notes",
        'headers': {
            'Authorization': 'Bearer ' + clientAccessToken,
            'X-Session-ID': clientSessionId
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            if(result.d != undefined || result.d != null){
                time = (result.d).length;
                pageCount = result.sp.pageCount;
                totalObjects = totalObjects + (result.d).length;
                var i = 0;
                for (i ; i < (result.d).length; i ++){
                    var resultItemObject = {};
                    if(result.d[i].detailItemImage[0] != undefined){
                        resultItemObject = {
                            itemId : result.d[i].id,
                            name: result.d[i].name,
                            shortName: result.d[i].shortName,
                            category: result.d[i].itemCategoryId,
                            no: result.d[i].no,
                            unitPrice: result.d[i].unitPrice,
                            defaultDiscount: result.d[i].defaultDiscount,
                            unitNameWarehouse: result.d[i].unit1Name,
                            totalUnitQuantity: result.d[i].totalUnit1Quantity,
                            availableToSell: result.d[i].availableToSell,
                            itemMainImage: "https://public.accurate.id" + result.d[i].detailItemImage[0].fileName,
                            itemImages: result.d[i].detailItemImage,
                            groupBuyStatus: result.d[i].charField1,
                            groupBuyAvaiableQuantity: result.d[i].numericField1,
                            groupBuyDiscount: result.d[i].numericField2,
                            promotedNew: result.d[i].charField2,
                            notes: result.d[i].notes
                        };
                    }else{
                        resultItemObject = {
                            itemId : result.d[i].id,
                            name: result.d[i].name,
                            shortName: result.d[i].shortName,
                            category: result.d[i].itemCategoryId,
                            no: result.d[i].no,
                            unitPrice: result.d[i].unitPrice,
                            defaultDiscount: result.d[i].defaultDiscount,
                            unitNameWarehouse: result.d[i].unit1Name,
                            totalUnitQuantity: result.d[i].totalUnit1Quantity,
                            availableToSell: result.d[i].availableToSell,
                            itemMainImage: "",
                            itemImages: [],
                            groupBuyStatus: result.d[i].charField1,
                            groupBuyAvaiableQuantity: result.d[i].numericField1,
                            groupBuyDiscount: result.d[i].numericField2,
                            promotedNew: result.d[i].charField2,
                            notes: result.d[i].notes
                        };
                    }
                    if(result.d[i].charField6 == "yes"){
                                        itemList.push(resultItemObject);
                                    }
                }
                res.send({itemList, page_count: pageCount, totalItems: totalObjects});
            }else{
                console.log("token maybe invalid");
            }
        }
    });
    // res.send({itemList, page_count: pageCount});
    // setTimeout(function(){ res.send({itemList, page_count: pageCount, totalItems: totalObjects}); }, 1000);
})

app.get('/get-item-details-from-complete-list', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting complete list details complete");
    var itemNo = req.query.itemNo;
    if(Object.keys(allCompleteItems).length != 0){
        console.log("get-item-details-from-complete-list search within MEM ================================ search within MEM");
        var i = 0;
        var itemList = allCompleteItems.itemList;
        if(itemNo != undefined){
            console.log("get-item-details-from-complete-list search within MEM ================================ " + itemNo);
            for(i ; i < itemList.length; i++){
                if(itemList[i].no == itemNo){
                    console.log("get-item-details-from-complete-list found within MEM ================================ found within MEM");
                    res.send(itemList[i]);
                    break;
                }
            }
            if(i >= itemList.length){
                console.log("get-item-details-from-complete-list not found within MEM ================================ not found within MEM");
                res.send(false);
            }
        }else{
            console.log("itemNo is not readable ================================ not found within MEM");
            res.send(false);
        }
    }else{
        console.log(allCompleteItems);
        console.log("saved data is empty ================================ not found within MEM");
        res.send(false);
    }
})

var allCompleteItems = {};

function retrieveCompleteItems(addedCondition, pageRequested, itemList){
    setTimeout(() => {
        console.log("accessing all items from Accurate ================================================ initated");
        var request = require('request');
        var options = {
            'method': 'GET',
            'url': 'http://localhost:8888/get-lastest-token-and-session',
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(response.body);
            var url = 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.pageSize=' + 100 + '&sp.page=' + pageRequested + addedCondition + "&fields=charField6,numericField2,id,name,no,shortName,itemCategoryId,unitPrice,defaultDiscount,unit1Name,totalUnit1Quantity,availableToSell,detailItemImage,charField1,numericField1,charField2,notes";
            // console.log(url);
            var options = {
                'method': 'GET',
                'url': url,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            request(options, function (error, response) {
                if (error) throw new Error(error);
                if(response != undefined || response != null){
                    var result = JSON.parse(response.body);
                    var i = 0;
                    var resultItemObject = {}; 
                    console.log("getAllCompleteItemsImageCoverPerItem ================================================ entering loop");
                    for (i ; i < (result.d).length; i ++){
                        getAllCompleteItemsImageCoverPerItem(result, i, resultItemObject, itemList);
                    }
                    console.log("getAllCompleteItemsImageCoverPerItem ================================================ loop ended");
                }
            });
        });
    }, 1000*pageRequested);
}

function getAllCompleteItemsImageCoverPerItem(result, i, resultItemObject, itemList){
    setTimeout(() => {
        var options = {
            'method': 'GET',
            'url': 'http://147.139.168.202:8080/products.jsp?productNo=' + result.d[i].no,
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            if(response != undefined || response != null){
                var imageSearchResult = JSON.parse(response.body);
                // console.log(imageSearchResult);
                if(imageSearchResult.length != 0){
                    resultItemObject = {
                        itemId : result.d[i].id,
                        name: result.d[i].name,
                        shortName: result.d[i].shortName,
                        category: result.d[i].itemCategoryId,
                        no: result.d[i].no,
                        unitPrice: result.d[i].unitPrice,
                        defaultDiscount: result.d[i].defaultDiscount,
                        unitNameWarehouse: result.d[i].unit1Name,
                        totalUnitQuantity: result.d[i].totalUnit1Quantity,
                        availableToSell: result.d[i].availableToSell,
                        // itemMainImage: "https://public.accurate.id" + result.d[i].detailItemImage[0].fileName,
                        // itemImages: result.d[i].detailItemImage,
                        groupBuyStatus: result.d[i].charField1,
                        groupBuyAvaiableQuantity: result.d[i].numericField1,
                        groupBuyDiscount: result.d[i].numericField2,
                        promotedNew: result.d[i].charField2,
                        notes: result.d[i].notes,
                        productImageCover: imageSearchResult[0].default_pic
                    };
                }else{
                    resultItemObject = {
                        itemId : result.d[i].id,
                        name: result.d[i].name,
                        shortName: result.d[i].shortName,
                        category: result.d[i].itemCategoryId,
                        no: result.d[i].no,
                        unitPrice: result.d[i].unitPrice,
                        defaultDiscount: result.d[i].defaultDiscount,
                        unitNameWarehouse: result.d[i].unit1Name,
                        totalUnitQuantity: result.d[i].totalUnit1Quantity,
                        availableToSell: result.d[i].availableToSell,
                        // itemMainImage: "https://public.accurate.id" + result.d[i].detailItemImage[0].fileName,
                        // itemImages: result.d[i].detailItemImage,
                        groupBuyStatus: result.d[i].charField1,
                        groupBuyAvaiableQuantity: result.d[i].numericField1,
                        groupBuyDiscount: result.d[i].numericField2,
                        promotedNew: result.d[i].charField2,
                        notes: result.d[i].notes
                    };
                }
                itemList.push(resultItemObject);
            }
        });
    }, i*1000);
}

app.get('/get-item-all-complete', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting list all full complete");
    if(Object.keys(allCompleteItems).length != 0){
        console.log("accessing saved content");
        res.send(allCompleteItems);
    }else{
        console.log("accessing non saved content");
        var itemList = [];
        var clientAccessToken = req.query.accessToken;
        var clientSessionId = req.query.sessionId;
        var pageRequested = 1;
        var pageCount = 0;
        var request = require('request');
        var options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.pageSize=' + 100 ,
            'headers': {
                'Authorization': 'Bearer ' + clientAccessToken,
                'X-Session-ID': clientSessionId
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                if(result.sp != undefined || result.sp != null){
                    pageCount = result.sp.pageCount;
                    var status = true;
                    var addedCondition = "&sp.sort=";
                    if(req.query.sortBy != undefined && req.query.sortDirection != undefined){
                        addedCondition = addedCondition + req.query.sortBy + "|" + req.query.sortDirection;
                    }
                    while(status){
                        console.log("retrieveCompleteItems ================================================ loop");
                        retrieveCompleteItems(addedCondition, pageRequested, itemList);
                        pageRequested++;
                        if(pageRequested > pageCount){
                            status = false;
                        }
                    }
                    console.log("retrieveCompleteItems ================================================ loop ended");
                    setTimeout(function(){
                        console.log("response initated all ================================================ start to response");
                        allCompleteItems = {itemList, page_count: pageCount};
                        res.send({itemList, page_count: pageCount}); 
                    }, 1000*pageCount*100);
                }else{
                    console.log("token maybe invalid");
                }
            }
        });
    }
})

setInterval(() => {
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'http://localhost:8888/get-lastest-token-and-session',
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'http://localhost:8888/get-item-all-complete?accessToken=' + result.access_token + '&sessionId=' + result.session_id + '',
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                if(response != undefined){
                    allCompleteItems = {};
                    allCompleteItems = JSON.parse(response.body);
                    console.log(allCompleteItems);
                }
            });
        }
    });
}, 92660400);

var allItems = {};

function retrieveItems(addedCondition, pageRequested, itemName, itemList){
    setTimeout(() => {
        console.log("accessing all items from Accurate ================================================ initated");
        var request = require('request');
        var options = {
            'method': 'GET',
            'url': 'http://localhost:8888/get-lastest-token-and-session',
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(response.body);
            var url = 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.pageSize=' + 100 + '&sp.page=' + pageRequested + addedCondition + "&fields=charField6,numericField2,id,name,no,shortName,itemCategoryId,unitPrice,defaultDiscount,unit1Name,totalUnit1Quantity,availableToSell,detailItemImage,charField1,numericField1,charField2,notes";
            // console.log(url);
            var options = {
                'method': 'GET',
                'url': url,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            request(options, function (error, response) {
                if (error) throw new Error(error);
                if(response != undefined || response != null){
                    var result = JSON.parse(response.body);
                    var i = 0;
                    var resultItemObject = {}; 
                    console.log("getAllItemsImageCoverPerItem ================================================ entering loop");
                    for (i ; i < (result.d).length; i ++){
                        // console.log(result.d[i]);
                        // console.log(result.d[i].numericField2);
                        getAllItemsImageCoverPerItem(result, i, resultItemObject, itemName, itemList);
                    }
                    console.log("getAllItemsImageCoverPerItem ================================================ loop ended");
                }
            });
        });
    }, 1000*pageRequested);
}

function getAllItemsImageCoverPerItem(result, i, resultItemObject, itemName, itemList){
    setTimeout(() => {
        var options = {
            'method': 'GET',
            'url': 'http://147.139.168.202:8080/products.jsp?productNo=' + result.d[i].no,
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            if(response != undefined || response != null){
                var imageSearchResult = JSON.parse(response.body);
                // console.log(imageSearchResult);
                if(imageSearchResult.length != 0){
                    resultItemObject = {
                        itemId : result.d[i].id,
                        name: result.d[i].name,
                        shortName: result.d[i].shortName,
                        category: result.d[i].itemCategoryId,
                        no: result.d[i].no,
                        unitPrice: result.d[i].unitPrice,
                        defaultDiscount: result.d[i].defaultDiscount,
                        unitNameWarehouse: result.d[i].unit1Name,
                        totalUnitQuantity: result.d[i].totalUnit1Quantity,
                        availableToSell: result.d[i].availableToSell,
                        // itemMainImage: "https://public.accurate.id" + result.d[i].detailItemImage[0].fileName,
                        // itemImages: result.d[i].detailItemImage,
                        groupBuyStatus: result.d[i].charField1,
                        groupBuyAvaiableQuantity: result.d[i].numericField1,
                        groupBuyDiscount: result.d[i].numericField2,
                        promotedNew: result.d[i].charField2,
                        notes: result.d[i].notes,
                        productImageCover: imageSearchResult[0].default_pic
                    };
                }else{
                    resultItemObject = {
                        itemId : result.d[i].id,
                        name: result.d[i].name,
                        shortName: result.d[i].shortName,
                        category: result.d[i].itemCategoryId,
                        no: result.d[i].no,
                        unitPrice: result.d[i].unitPrice,
                        defaultDiscount: result.d[i].defaultDiscount,
                        unitNameWarehouse: result.d[i].unit1Name,
                        totalUnitQuantity: result.d[i].totalUnit1Quantity,
                        availableToSell: result.d[i].availableToSell,
                        // itemMainImage: "https://public.accurate.id" + result.d[i].detailItemImage[0].fileName,
                        // itemImages: result.d[i].detailItemImage,
                        groupBuyStatus: result.d[i].charField1,
                        groupBuyAvaiableQuantity: result.d[i].numericField1,
                        groupBuyDiscount: result.d[i].numericField2,
                        promotedNew: result.d[i].charField2,
                        notes: result.d[i].notes
                    };
                }
                if(itemName != undefined && resultItemObject.name != undefined){
                    if(resultItemObject.name.includes(itemName.toUpperCase())){
                        // console.log("here");
                        if(result.d[i].charField6 == "yes"){
                            itemList.push(resultItemObject);
                        }
                    }else if (resultItemObject.name.includes(itemName.toLowerCase())){
                        // console.log("here");
                        if(result.d[i].charField6 == "yes"){
                            itemList.push(resultItemObject);
                        }
                    }else if (resultItemObject.name.includes(itemName)){
                        // console.log("here");
                        if(result.d[i].charField6 == "yes"){
                            itemList.push(resultItemObject);
                        }
                    }
                }else{
                    if(result.d[i].charField6 == "yes"){
                        itemList.push(resultItemObject);
                    }
                }
            }
        });
    }, i*1000);
}

app.get('/get-item-all', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting list all complete");
    var itemName = req.query.itemName;
    if(Object.keys(allItems).length != 0){
        console.log("accessing saved content");
        if(itemName != undefined){
            var i = 0;
            var itemList = allItems.itemList;
            var itemListFiltered = [];
            for(i ; i < itemList.length; i++){
                if((itemList[i].name).toUpperCase().includes(itemName.toUpperCase())){
                    itemListFiltered.push(itemList[i]);
                }
            }
            if(req.query.sortBy != undefined && req.query.sortDirection !=undefined){
                if(req.query.sortBy == "unitPrice" && req.query.sortDirection == "up"){
                    itemListFiltered.sort((a,b) => (a.unitPrice > b.unitPrice) ? 1 : ((b.unitPrice > a.unitPrice) ? -1 : 0));
                }else if(req.query.sortBy == "name" && req.query.sortDirection == "up"){
                    itemListFiltered.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
                }else if(req.query.sortBy == "unitPrice" && req.query.sortDirection == "down"){
                    itemListFiltered.sort((a,b) => (a.unitPrice < b.unitPrice) ? 1 : ((b.unitPrice < a.unitPrice) ? -1 : 0));
                }else if(req.query.sortBy == "name" && req.query.sortDirection == "down"){
                    itemListFiltered.sort((a,b) => (a.name < b.name) ? 1 : ((b.name < a.name) ? -1 : 0));
                }
            }
            itemList = itemListFiltered;
            var filterResult = {
                itemList: itemList
            };
            res.send(filterResult);
        }else{
            res.send(allItems);
        }
    }else{
        console.log("accessing non saved content");
        var itemList = [];
        var clientAccessToken = req.query.accessToken;
        var clientSessionId = req.query.sessionId;
        var pageRequested = 1;
        var pageCount = 0;
        var request = require('request');
        var options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.pageSize=' + 100 ,
            'headers': {
                'Authorization': 'Bearer ' + clientAccessToken,
                'X-Session-ID': clientSessionId
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                if(result.sp != undefined || result.sp != null){
                    pageCount = result.sp.pageCount;
                    var status = true;
                    var addedCondition = "&sp.sort=";
                    if(req.query.sortBy != undefined && req.query.sortDirection != undefined){
                        addedCondition = addedCondition + req.query.sortBy + "|" + req.query.sortDirection;
                    }
                    while(status){
                        // console.log("addedCondition : " + addedCondition + " || itemName: " + itemName);
                        // console.log("pageRequested " + pageRequested);
                        // console.log("pageCount " + pageCount);
                        console.log("retrieveItems ================================================ loop");
                        retrieveItems(addedCondition, pageRequested, itemName, itemList);
                        pageRequested++;
                        if(pageRequested > pageCount){
                            status = false;
                        }
                    }
                    console.log("retrieveItems ================================================ loop ended");
                    setTimeout(function(){
                        console.log("response initated all ================================================ start to response");
                        allItems = {itemList, page_count: pageCount};
                        res.send({itemList, page_count: pageCount}); 
                    }, 1000*pageCount*100);
                }else{
                    console.log("token maybe invalid");
                }
            }
        });
    }
})

setInterval(() => {
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'http://localhost:8888/get-lastest-token-and-session',
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'http://localhost:8888/get-item-all?accessToken=' + result.access_token + '&sessionId=' + result.session_id + '',
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                if(response != undefined){
                    // allItems = {};
                    allItems = JSON.parse(response.body);
                    console.log(allItems);
                }
            });
        }
    });
}, 92660400);

var groupBuyItems = {};

function retrieveGroupBuyItems(clientAccessToken, clientSessionId, pageRequested, itemList, totalObjects){
    setTimeout(() => {
        var request = require('request');
        var options = {
            'method': 'GET',
            'url': 'http://localhost:8888/get-lastest-token-and-session',
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(response.body);
            var options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.page=' + pageRequested + "&fields=charField6,numericField2,id,name,no,shortName,itemCategoryId,unitPrice,defaultDiscount,unit1Name,totalUnit1Quantity,availableToSell,detailItemImage,charField1,numericField1,charField2,notes",
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                if(response != undefined || response != null){
                    var result = JSON.parse(response.body);
                    time = (result.d).length;
                    var i = 0;
                    totalObjects = totalObjects + (result.d).length;
                    for (i ; i < (result.d).length; i ++){
                        var resultItemObject = {};
                        getGroupBuyImageCoverPerItem(result, i, resultItemObject, itemList);
                    }
                }
            });
        });
    }, 1000*pageRequested);
}

function getGroupBuyImageCoverPerItem(result, i, resultItemObject, itemList){
    setTimeout(() => {
        // console.log(result.d[i].no);
        var options = {
            'method': 'GET',
            'url': 'http://147.139.168.202:8080/products.jsp?productNo=' + result.d[i].no,
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var imageSearchResult = JSON.parse(response.body);
                // console.log(imageSearchResult);
                if(imageSearchResult.length != 0){
                    resultItemObject = {
                        itemId : result.d[i].id,
                        name: result.d[i].name,
                        shortName: result.d[i].shortName,
                        category: result.d[i].itemCategoryId,
                        no: result.d[i].no,
                        unitPrice: result.d[i].unitPrice,
                        defaultDiscount: result.d[i].defaultDiscount,
                        unitNameWarehouse: result.d[i].unit1Name,
                        totalUnitQuantity: result.d[i].totalUnit1Quantity,
                        availableToSell: result.d[i].availableToSell,
                        groupBuyStatus: result.d[i].charField1,
                        groupBuyAvaiableQuantity: result.d[i].numericField1,
                        groupBuyDiscount: result.d[i].numericField2,
                        promotedNew: result.d[i].charField2,
                        notes: result.d[i].notes,
                        productImageCover: imageSearchResult[0].default_pic
                    };
                }else{
                    resultItemObject = {
                        itemId : result.d[i].id,
                        name: result.d[i].name,
                        shortName: result.d[i].shortName,
                        category: result.d[i].itemCategoryId,
                        no: result.d[i].no,
                        unitPrice: result.d[i].unitPrice,
                        defaultDiscount: result.d[i].defaultDiscount,
                        unitNameWarehouse: result.d[i].unit1Name,
                        totalUnitQuantity: result.d[i].totalUnit1Quantity,
                        availableToSell: result.d[i].availableToSell,
                        groupBuyStatus: result.d[i].charField1,
                        groupBuyAvaiableQuantity: result.d[i].numericField1,
                        groupBuyDiscount: result.d[i].numericField2,
                        promotedNew: result.d[i].charField2,
                        notes: result.d[i].notes
                    };
                }
                if(resultItemObject.groupBuyStatus == "yes"){
                    if(result.d[i].charField6 == "yes"){
                        itemList.push(resultItemObject);
                    }
                }
            }
        });
    }, i*1000);
}

app.get('/get-item-all-group-buy', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting list all group complete");
    if(Object.keys(groupBuyItems).length !== 0){
        console.log("accessing saved content with timeout");
        res.send(groupBuyItems);
    }else{
        console.log("accessing non saved content");
        var itemList = [];
        var totalObjects = 0;
        var clientAccessToken = req.query.accessToken;
        var clientSessionId = req.query.sessionId;
        var pageRequested = 1;
        var pageCount = 0;
        var request = require('request');
        var options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.page=' + pageRequested,
            'headers': {
                'Authorization': 'Bearer ' + clientAccessToken,
                'X-Session-ID': clientSessionId
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                if(result.sp != undefined || result.sp != null){
                    pageCount = result.sp.pageCount;
                    var status = true;
                    while(status){
                        retrieveGroupBuyItems(clientAccessToken, clientSessionId, pageRequested, itemList, totalObjects);
                        pageRequested++;
                        if(pageRequested > pageCount){
                            status = false;
                        }
                    }
                }else{
                    console.log("token maybe invalid");
                }
            }
            setTimeout(function(){ 
                console.log("response initated group ================================================ start to response");
                groupBuyItems = {itemList, page_count: pageCount, totalItems: totalObjects};
                res.send({itemList, page_count: pageCount, totalItems: totalObjects}); 
            }, 1000*pageCount*20);
        });
    }
})

setInterval(() => {
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'http://localhost:8888/get-lastest-token-and-session',
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'http://localhost:8888/get-item-all-group-buy?accessToken=' + result.access_token + '&sessionId=' + result.session_id + '',
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                // groupBuyItems = JSON.parse(response.body);
                if(response != undefined){
                    // groupBuyItems = {};
                    groupBuyItems = JSON.parse(response.body);
                }
            });
        }
    });
}, 92660400);

var newItems = {};

function retrieveNewItems(pageRequested, itemList, totalObjects){
    setTimeout(() => {
        var request = require('request');
        var options = {
            'method': 'GET',
            'url': 'http://localhost:8888/get-lastest-token-and-session',
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.page=' + pageRequested + "&fields=charField6,numericField2,id,name,no,shortName,itemCategoryId,unitPrice,defaultDiscount,unit1Name,totalUnit1Quantity,availableToSell,detailItemImage,charField1,numericField1,charField2,notes",
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                if(response != undefined || response != null){
                    var result = JSON.parse(response.body);
                    totalObjects = totalObjects + (result.d).length;
                    time = (result.d).length;
                    var i = 0;
                    for (i ; i < (result.d).length; i ++){
                        var resultItemObject = {};
                        getNewItemsImageCoverPerItem(result, i, resultItemObject, itemList)
                    }
                }
            });
        });
    }, 1000*pageRequested);
}

function getNewItemsImageCoverPerItem(result, i, resultItemObject, itemList){
    setTimeout(() => {
        // console.log(result.d[i].no);
        var options = {
            'method': 'GET',
            'url': 'http://147.139.168.202:8080/products.jsp?productNo=' + result.d[i].no,
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var imageSearchResult = JSON.parse(response.body);
                // console.log(imageSearchResult);
                if(imageSearchResult.length != 0){
                    resultItemObject = {
                        itemId : result.d[i].id,
                        name: result.d[i].name,
                        shortName: result.d[i].shortName,
                        category: result.d[i].itemCategoryId,
                        no: result.d[i].no,
                        unitPrice: result.d[i].unitPrice,
                        defaultDiscount: result.d[i].defaultDiscount,
                        unitNameWarehouse: result.d[i].unit1Name,
                        totalUnitQuantity: result.d[i].totalUnit1Quantity,
                        availableToSell: result.d[i].availableToSell,
                        groupBuyStatus: result.d[i].charField1,
                        groupBuyAvaiableQuantity: result.d[i].numericField1,
                        groupBuyDiscount: result.d[i].numericField2,
                        promotedNew: result.d[i].charField2,
                        notes: result.d[i].notes,
                        productImageCover: imageSearchResult[0].default_pic
                    };
                }else{
                    resultItemObject = {
                        itemId : result.d[i].id,
                        name: result.d[i].name,
                        shortName: result.d[i].shortName,
                        category: result.d[i].itemCategoryId,
                        no: result.d[i].no,
                        unitPrice: result.d[i].unitPrice,
                        defaultDiscount: result.d[i].defaultDiscount,
                        unitNameWarehouse: result.d[i].unit1Name,
                        totalUnitQuantity: result.d[i].totalUnit1Quantity,
                        availableToSell: result.d[i].availableToSell,
                        groupBuyStatus: result.d[i].charField1,
                        groupBuyAvaiableQuantity: result.d[i].numericField1,
                        groupBuyDiscount: result.d[i].numericField2,
                        promotedNew: result.d[i].charField2,
                        notes: result.d[i].notes
                    };
                }
                if(resultItemObject.promotedNew == "yes"){
                    if(result.d[i].charField6 == "yes"){
                            itemList.push(resultItemObject);
                        }
                }
            }
        });
    }, i*1000);
}

app.get('/get-item-all-new', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting list all new complete");
    if(Object.keys(newItems).length !== 0){
        console.log("accessing saved content");
        res.send(newItems);
    }else{
        console.log("accessing non saved content");
        var itemList = [];
        var totalObjects = 0;
        var clientAccessToken = req.query.accessToken;
        var clientSessionId = req.query.sessionId;
        var pageRequested = 1;
        var pageCount = 0;
        var time = 1;
        var request = require('request');
        var options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.page=' + pageRequested,
            'headers': {
                'Authorization': 'Bearer ' + clientAccessToken,
                'X-Session-ID': clientSessionId
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                if(result.sp != undefined || result.sp != null){
                    pageCount = result.sp.pageCount;
                    var status = true;
                    while(status){
                        retrieveNewItems(pageRequested, itemList, totalObjects);
                        pageRequested++;
                        if(pageRequested > pageCount){
                            status = false;
                        }
                    }
                    setTimeout(function(){ 
                        console.log("response initated new ================================================ start to response");
                        newItems = {itemList, page_count: pageCount, totalItems: totalObjects};
                        res.send({itemList, page_count: pageCount, totalItems: totalObjects}); 
                    }, 1000*pageCount*20);   
                }else{
                    console.log("token maybe invalid");
                }
            }
        });
    }
})

setInterval(() => {
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'http://localhost:8888/get-lastest-token-and-session',
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'http://localhost:8888/get-item-all-new?accessToken=' + result.access_token + '&sessionId=' + result.session_id + '',
                'headers': {
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                // newItems = JSON.parse(response.body);
                if(response != undefined){
                    // newItems = {};
                    newItems = JSON.parse(response.body);
                }
                // console.log(newItems);
            });
        }
    });
}, 92660400);

app.get('/get-item-details-by-name', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting list details complete");
    var resultToBeReturn = [];
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var completeName = req.query.completeName;
    var pageRequested = 1;
    var filterRequest = '&filter.keywords.op=EQUAL&filter.keywords.val=' + completeName;
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.page=' + pageRequested  + filterRequest + "&fields=charField6,numericField2,id,name,no,shortName,itemCategoryId,unitPrice,defaultDiscount,unit1Name,totalUnit1Quantity,availableToSell,charField1,numericField1,charField2,notes,numericField3,numericField4",
        'headers': {
            'Authorization': 'Bearer ' + clientAccessToken,
            'X-Session-ID': clientSessionId
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            // console.log(response);
            resultToBeReturn = result.d;
            res.send(resultToBeReturn);
        }
    });
})

app.get('/get-item-details', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting list details complete");
    var itemNo = req.query.itemNo;
    if(Object.keys(allItems).length != 0){
        console.log("search within MEM ================================ search within MEM");
        var i = 0;
        var itemList = allItems.itemList;
        if(itemNo != undefined){
            console.log("search within MEM ================================ " + itemNo);
            for(i ; i < itemList.length; i++){
                if(itemList[i].no == itemNo){
                    console.log("found within MEM ================================ found within MEM");
                    res.send(itemList[i]);
                }
            }
            if(i >= itemList.length){
                console.log("not found within MEM ================================ not found within MEM");
                res.send(false);
            }
        }else{
            res.send(false);
        }
    }else{
        var resultItemObject = {};
        var clientAccessToken = req.query.accessToken;
        var clientSessionId = req.query.sessionId;
        var pageRequested = 1;
        var pageCount = 0;
        // var time = 1;
        var request = require('request');
        var options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.page=' + pageRequested,
            'headers': {
                'Authorization': 'Bearer ' + clientAccessToken,
                'X-Session-ID': clientSessionId
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                if(result.sp != undefined){
                    pageCount = result.sp.pageCount;
                    var status = true;
                    while(status){
                        getItemDetailsByItemNo(pageRequested, clientAccessToken, clientSessionId, itemNo, resultItemObject, res);
                        pageRequested++;
                        if(pageRequested > pageCount){
                            status = false;
                        }
                    }
                    // setTimeout(function(){ res.send(resultItemObject); }, 3000*pageCount*3);
                }else{
                    console.log("token maybe invalid");
                }
            }
        });
    }
    // setTimeout(function(){setTimeout(function(){ res.send(resultItemObject); }, 1000*pageCount);}, 400);
})

function getItemDetailsByItemNo(pageRequested, clientAccessToken, clientSessionId, itemNo, resultItemObject, res){
    setTimeout(() => {
        var options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.page=' + pageRequested + "&fields=charField6,numericField2,id,name,no,shortName,itemCategoryId,unitPrice,defaultDiscount,unit1Name,totalUnit1Quantity,availableToSell,detailItemImage,charField1,numericField1,charField2,notes,numericField3,numericField4",
            'headers': {
                'Authorization': 'Bearer ' + clientAccessToken,
                'X-Session-ID': clientSessionId
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                var i = 0;
                for (i ; i < (result.d).length; i ++){
                    // console.log(result.d[i].no);
                    // console.log(result.d[i]);
                    if(itemNo == result.d[i].no){
                        console.log("Found match item details with item no > " + itemNo);
                        resultItemObject = {
                            itemId : result.d[i].id,
                            name: result.d[i].name,
                            shortName: result.d[i].shortName,
                            category: result.d[i].itemCategoryId,
                            no: result.d[i].no,
                            unitPrice: result.d[i].unitPrice,
                            defaultDiscount: result.d[i].defaultDiscount,
                            unitNameWarehouse: result.d[i].unit1Name,
                            totalUnitQuantity: result.d[i].totalUnit1Quantity,
                            availableToSell: result.d[i].availableToSell,
                            groupBuyStatus: result.d[i].charField1,
                            groupBuyAvaiableQuantity: result.d[i].numericField1,
                            groupBuyDiscount: result.d[i].numericField2,
                            promotedNew: result.d[i].charField2,
                            periodPrice: result.d[i].numericField3,
                            cashPrice: result.d[i].numericField4,
                            notes: result.d[i].notes
                        };
                        res.send(resultItemObject);
                    }
                }
            }
        });
    }, 1000*pageRequested);
}

app.get('/get-item-details-by-id', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting list details complete");
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var itemId = req.query.itemId;
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'https://public.accurate.id/accurate/api/item/detail.do' + '?id=' + itemId,
        'headers': {
            'Authorization': 'Bearer ' + clientAccessToken,
            'X-Session-ID': clientSessionId
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            if(result.d != undefined){
                res.send(result.d);
            }
            // res.send(result.d);
        }
    });
})

app.get('/get-category-list', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting list category complete");
    con.query("select * from vtportal.accurateCategoryList;", function (err, result, fields) {
        if (err) console.log(err);
        access_token = result[0].access_token;
        refresh_token = result[0].refresh_token;
        console.log("last updated access token : " + access_token);
        console.log("last updated refresh token : " + refresh_token);
        var i = 0;
        var categoryList = [];
        for(i; i < result.length; i++){
            categoryList.push({
                accurateId: result[i].accurateId,
                categoryName: result[i].name
            });
        }
        res.send(categoryList);
        
    });
})

app.get('/get-item-all-by-category-id', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting item list all by category");
    var itemList = [];
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var categoryId = req.query.categoryId;
    var pageRequested = 1;
    var addedCondition = "&sp.pageSize=100&filter.itemCategoryId.op=EQUAL&filter.itemCategoryId.val=" + categoryId;
    var pageCount = 0;
    var request = require('request');
    var url = 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.page=' + pageRequested + addedCondition + "&fields=charField6,numericField2,id,name,no,shortName,itemCategoryId,unitPrice,defaultDiscount,unit1Name,totalUnit1Quantity,availableToSell,charField1,numericField1,charField2,notes";
    var options = {
        'method': 'GET',
        'url': url,
        'headers': {
            'Authorization': 'Bearer ' + clientAccessToken,
            'X-Session-ID': clientSessionId
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            if(result.sp != undefined){
                pageCount = result.sp.pageCount;
                if(pageCount == 1){
                    var i = 0;
                    var resultItemObject = {}; 
                    for(i; i < result.d.length; i++){
                        getItemDetailsBasedOnCategoryId(result, i, resultItemObject, itemList)
                        // resultItemObject = {
                        //     itemId : result.d[i].id,
                        //     name: result.d[i].name,
                        //     shortName: result.d[i].shortName,
                        //     category: result.d[i].itemCategoryId,
                        //     no: result.d[i].no,
                        //     unitPrice: result.d[i].unitPrice,
                        //     defaultDiscount: result.d[i].defaultDiscount,
                        //     unitNameWarehouse: result.d[i].unit1Name,
                        //     totalUnitQuantity: result.d[i].totalUnit1Quantity,
                        //     availableToSell: result.d[i].availableToSell,
                        //     groupBuyStatus: result.d[i].charField1,
                        //     groupBuyAvaiableQuantity: result.d[i].numericField1,
                        //     promotedNew: result.d[i].charField2,
                        //     notes: result.d[i].notes
                        // };
                        // if(result.d[i].charField6 == "yes"){
                        //                 itemList.push(resultItemObject);
                        //             }
                    }
                    setTimeout(function(){
                        res.send({itemList, page_count: pageCount}); 
                    }, 100*pageCount*result.d.length);
                }else{
                    var i = 0;
                    var resultItemObject = {}; 
                    for(i; i < pageCount; i++){
                        getItemBasedOnCategoryId(pageRequested, addedCondition, clientAccessToken, clientSessionId, itemList, time)
                    }
                    setTimeout(function(){
                        res.send({itemList, page_count: pageCount}); 
                    }, 1000*pageCount*100);
                }
            }else{
                console.log("token maybe invalid");
            }
        }
    });
})

function getItemBasedOnCategoryId(pageRequested, addedCondition, clientAccessToken, clientSessionId, itemList, time){
    setTimeout(() => {
        var url = 'https://public.accurate.id/accurate/api/item/list.do' + '?sp.page=' + pageRequested + addedCondition + "&fields=charField6,numericField2,id,name,no,shortName,itemCategoryId,unitPrice,defaultDiscount,unit1Name,totalUnit1Quantity,availableToSell,charField1,numericField1,charField2,notes";
        var options = {
            'method': 'GET',
            'url': url,
            'headers': {
                'Authorization': 'Bearer ' + clientAccessToken,
                'X-Session-ID': clientSessionId
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                var x = 0;
                var resultItemObject = {}; 
                for(x; x < result.d.length; x++){
                    getItemDetailsBasedOnCategoryId(result, x, resultItemObject, itemList);
                }
            }
        });
    }, 1000*time);
}

function getItemDetailsBasedOnCategoryId(result, x, resultItemObject, itemList){
    setTimeout(() => {
        // console.log(result.d[i].no);
        var options = {
            'method': 'GET',
            'url': 'http://147.139.168.202:8080/products.jsp?productNo=' + result.d[x].no,
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var imageSearchResult = JSON.parse(response.body);
                // console.log(imageSearchResult);
                if(imageSearchResult.length != 0){
                    resultItemObject = {
                        itemId : result.d[x].id,
                        name: result.d[x].name,
                        shortName: result.d[x].shortName,
                        category: result.d[x].itemCategoryId,
                        no: result.d[x].no,
                        unitPrice: result.d[x].unitPrice,
                        defaultDiscount: result.d[x].defaultDiscount,
                        unitNameWarehouse: result.d[x].unit1Name,
                        totalUnitQuantity: result.d[x].totalUnit1Quantity,
                        availableToSell: result.d[x].availableToSell,
                        groupBuyStatus: result.d[x].charField1,
                        groupBuyAvaiableQuantity: result.d[x].numericField1,
                        promotedNew: result.d[x].charField2,
                        notes: result.d[x].notes,
                        productImageCover: imageSearchResult[0].default_pic
                    };
                }else{
                    resultItemObject = {
                        itemId : result.d[x].id,
                        name: result.d[x].name,
                        shortName: result.d[x].shortName,
                        category: result.d[x].itemCategoryId,
                        no: result.d[x].no,
                        unitPrice: result.d[x].unitPrice,
                        defaultDiscount: result.d[x].defaultDiscount,
                        unitNameWarehouse: result.d[x].unit1Name,
                        totalUnitQuantity: result.d[x].totalUnit1Quantity,
                        availableToSell: result.d[x].availableToSell,
                        groupBuyStatus: result.d[x].charField1,
                        groupBuyAvaiableQuantity: result.d[x].numericField1,
                        promotedNew: result.d[x].charField2,
                        notes: result.d[x].notes
                    };
                }
                if(result.d[x].charField6 == "yes"){
                    itemList.push(resultItemObject);
                }
            }
        });
    }, x*100);
}

app.get('/get-branch', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting branch complete");
    var branchList = [];
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var branchId = "";
    // get branch details from given ID
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'https://public.accurate.id/accurate/api/branch/list.do',
        'headers': {
            'Authorization': 'Bearer ' + clientAccessToken,
            'X-Session-ID': clientSessionId
        }
    };
    if(req.query.branchId !=  null || req.query.branchId != undefined){
        branchId = req.query.branchId;
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                var i = 0;
                var ifBranchIdExist = 0;
                if(result.d != undefined){
                    for (i ; i < (result.d).length; i ++){
                        if(result.d[i].id == branchId){
                            res.send({
                                branch_id: result.d[i].id,
                                branch_name: result.d[i].name
                            });
                            ifBranchIdExist = 1;
                            break;
                        }
                    }
                    if(ifBranchIdExist == 0){
                        res.send(false);
                    }
                }
            }
        });
    }else{
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                var i = 0;
                if(result.d != undefined){
                    for (i ; i < (result.d).length; i ++){
                        branchList.push(
                            {
                                branch_id: result.d[i].id,
                                branch_name: result.d[i].name
                            });
                    }
                    
                    setTimeout(function(){ res.send(branchList); }, 400);
                }
            }
        });
    }
})

app.get('/get-payment-term', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting payment term complete");
    var paymentTermList = [];
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    console.log("clientAccessToken : " + clientAccessToken);
    console.log("clientSessionId : " + clientSessionId);
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'https://public.accurate.id/accurate/api/payment-term/list.do',
        'headers': {
            'Authorization': 'Bearer ' + clientAccessToken,
            'X-Session-ID': clientSessionId
        }
    };
    if(req.query.paymentId !=  null || req.query.paymentId != undefined){
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                // console.log(result.d);
                var i = 0;
                var ifPaymentIdExist = 0;
                if(result.d != undefined){
                    for (i ; i < (result.d).length; i ++){
                        if(result.d[i].id == req.query.paymentId){
                            res.send({
                                paymentId: result.d[i].id,
                                paymentName: result.d[i].name,
                                paymentDays: result.d[i].netDays
                            });
                            ifPaymentIdExist = 1;
                            break;
                        }
                    }
                    if(ifPaymentIdExist == 0){
                        res.send(false);
                    }   
                }
            }
        });
    }else{
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                var result = JSON.parse(response.body);
                var i = 0;
                if(result.d != undefined){
                    for (i ; i < (result.d).length; i ++){
                        paymentTermList.push(
                            {
                                paymentId: result.d[i].id,
                                paymentName: result.d[i].name,
                                paymentDays: result.d[i].netDays
                            });
                    }
                    
                    setTimeout(function(){ res.send(paymentTermList); }, 400);
                }
            }
        });
    }
})

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

app.post('/make-new-customer', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting sales order");
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var customer = req.body.customer;
    var accurateRequestURL = `https://public.accurate.id/accurate/api/customer/save.do?name=${customer.name}&billStreet=${customer.billStreet}&billCity=${customer.billCity}&billProvince=${customer.billProvince}&billCountry=${customer.billCountry}&billZipCode=${customer.billZipCode}&branchId=50&branchName=Head Quarter&currencyCode=IDR&email=${customer.email}&mobilePhone=${customer.mobilePhone}&workPhone=${customer.workPhone}&npwpNo=${customer.npwpNo}&shipStreet=${customer.shipStreet}&shipCity=${customer.shipCity}&shipProvince=${customer.shipProvince}&shipCountry=${customer.shipCountry}&shipZipCode=${customer.shipZipCode}&customerNo=${customer.customerNo}`;
    var i = 0;
    for(i ; i < (customer.customerOtherShippingDetails).length ; i++){
        accurateRequestURL = accurateRequestURL + `&detailShipAddress[${i}].street=${customer.customerOtherShippingDetails[i].street}&detailShipAddress[${i}].city=${customer.customerOtherShippingDetails[i].city}&detailShipAddress[${i}].province=${customer.customerOtherShippingDetails[i].province}&detailShipAddress[${i}].country=${customer.customerOtherShippingDetails[i].country}&detailShipAddress[${i}].zipCode=${customer.customerOtherShippingDetails[i].zipCode}`;
    }
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
        if(response != undefined || response != null){
            var result = JSON.parse(response.body);
            console.log(result);
            var returnResponse = {
                customerNo: result.r.customerNo,
                customerId: result.r.id
            };
            res.send(returnResponse);
        }
    });

})

app.get('/delete-customer', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting delete customer");
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var customerId = req.query.customerId;
    console.log(customerId);
    var request = require('request');
    var options = {
        'method': 'DELETE',
        'url': 'https://public.accurate.id/accurate/api/customer/delete.do?id=' + customerId,
        'headers': {
            'Authorization': 'Bearer ' + clientAccessToken,
            'X-Session-ID': clientSessionId
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        if(response != undefined || response != null){
            console.log(response.body);
            var result = JSON.parse(response.body);
            res.send(result.d[0]);
        }
    });

})

app.get('/get-sales-order-by-customer-id', (req, res) => {
    console.log("---------------------------------------------------------------------------- requesting sales order customer");
    console.log(collectedSalesOrdersWithDetails.length);
    var filteredSalesOrderBasedOnCustomerNo = [];
    if(collectedSalesOrdersWithDetails.length != 0 && req.query.customerNo != undefined){
        var customerNo = req.query.customerNo;
        var i = 0;
        for(i; i < collectedSalesOrdersWithDetails.length; i++){
            if(collectedSalesOrdersWithDetails[i].customerNo == customerNo && customerNo != undefined){
                console.log("found > " + collectedSalesOrdersWithDetails[i].salesOrderNumber);
                filteredSalesOrderBasedOnCustomerNo.push(collectedSalesOrdersWithDetails[i]);
            }
        }
        res.send(filteredSalesOrderBasedOnCustomerNo);
    }else if(filteredSalesOrderBasedOnCustomerNo.length == 0){
        res.send(false);
        // var clientAccessToken = req.query.accessToken;
        // var clientSessionId = req.query.sessionId;
        // var customerId = req.query.customerId;
        // var customerNo = req.query.customerNo;
        // var salesOrders = [];
        // var pageFlipper = 1;
        // var pageCount = 0;
        // var request = require('request');
        // var options = {
        //     'method': 'GET',
        //     'url': 'https://public.accurate.id/accurate/api/sales-order/list.do?sp.page=' + pageFlipper,
        //     'headers': {
        //         'Authorization': 'Bearer ' + clientAccessToken,
        //         'X-Session-ID': clientSessionId
        //     }
        // };
        // request(options, function (error, response) {
        //     if (error) console.log(error);
        //     if(response != undefined || response != null){
        //         var result = JSON.parse(response.body);
        //         if(result != undefined && result.sp != undefined && result.d != undefined){
        //             pageCount = result.sp.pageCount;
        //             var totalObjectsInPage = result.d.length;
        //             if(pageCount != undefined){
        //                 for(pageFlipper; pageFlipper <= pageCount; pageFlipper++){
        //                     gettingSalesOrderListPerPage(clientAccessToken, clientSessionId, pageFlipper, salesOrders, customerId, customerNo, pageCount);
        //                 }
        //                 // res.send(salesOrders);
        //                 console.log("totalObjectsInPagetotalObjectsInPagetotalObjectsInPagetotalObjectsInPagetotalObjectsInPagetotalObjectsInPage");
        //                 console.log((totalObjectsInPage*1000*1.5));
        //                 // res.send(salesOrders);
        //                 setTimeout(function(){ res.send(salesOrders); }, (totalObjectsInPage*1000*1.5));   
        //             }else{
        //                 console.log("Bad pagecount");
        //             }
        //         }else{
        //             console.log("token incorrect");
        //             res.send(false);
        //         }
        //     }
        // });
    }
})

var collectedSalesOrdersWithDetails = [];

function collectingSalesOrders(){
    var request = require('request');
    collectedSalesOrdersWithDetails = [];
    var pageFlipper = 1;
    var pageCount = 0;
    var options = {
        'method': 'GET',
        'url': 'http://localhost:8888/get-lastest-token-and-session',
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        var credentials = JSON.parse(response.body);
        options = {
            'method': 'GET',
            'url': 'https://public.accurate.id/accurate/api/sales-order/list.do?sp.page=' + pageFlipper,
            'headers': {
                'Authorization': 'Bearer ' + credentials.access_token,
                'X-Session-ID': credentials.session_id
            }
        };
        request(options, function (error, response) {
            if (error) console.log(error);
            if(response != undefined || response != null){
                console.log(response.body);
                var result = JSON.parse(response.body);
                if(result != undefined && result.sp != undefined){
                    pageCount = result.sp.pageCount;
                    if(pageCount != undefined){
                        for(pageFlipper; pageFlipper <= pageCount; pageFlipper++){
                            gettingSalesOrderListPerPageToBeStoredInMEM(pageFlipper, collectedSalesOrdersWithDetails, pageCount);
                        }
                        console.log("saving sales order loop has finished, but data has not been saved yet ====================== saving sales order attempt");
                        // setTimeout(function(){ res.send(salesOrders); }, (totalObjectsInPage*1000*1.5));   
                    }else{
                        console.log("Bad pagecount");
                    }
                }else{
                    console.log("ERROR FROM ACCURATE, NO JSON RESPONSE WHEN GETTING SALES ORDER LIST");
                }
            }
        });
    });
}

setInterval(() => {
    collectingSalesOrders();
}, 4932000);

function gettingSalesOrderListPerPageToBeStoredInMEM(pageFlipper, collectedSalesOrdersWithDetails, pageCount){
    setTimeout(() => {
        options = {
            'method': 'GET',
            'url': 'http://localhost:8888/get-lastest-token-and-session',
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/sales-order/list.do?sp.page=' + pageFlipper,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                if(response != undefined || response != null){
                    result = JSON.parse(response.body);
                    var i =0;
                    for(i ; i < result.d.length; i ++){
                        gettingSalesOrderDetails(result.d[i].id, collectedSalesOrdersWithDetails, pageCount, pageFlipper, i);
                    }
                }
            }); 
        });
    }, pageFlipper*2000);
}

function gettingSalesOrderDetails(id, collectedSalesOrdersWithDetails, pageCount, pageFlipper, time){
    setTimeout(() => {
        var request = require('request');
        console.log("saving data to MEM -> " + id);
        options = {
            'method': 'GET',
            'url': 'http://localhost:8888/get-lastest-token-and-session',
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            var credentials = JSON.parse(response.body);
            options = {
                'method': 'GET',
                'url': 'https://public.accurate.id/accurate/api/sales-order/detail.do?id=' + id,
                'headers': {
                    'Authorization': 'Bearer ' + credentials.access_token,
                    'X-Session-ID': credentials.session_id
                }
            };
            request(options, function (error, response) {
                if (error) console.log(error);
                if(response != undefined || response != null){
                    result = JSON.parse(response.body);
                    pageFlipper = pageCount + 1;
                    var u = 0;
                    var detailItem = [];
                    if(result.d != undefined ){
                        if(result.d.detailItem != undefined ){
                            for(u; u < result.d.detailItem.length; u ++){
                                detailItem.push({
                                    name: result.d.detailItem[u].item.shortName,
                                    no: result.d.detailItem[u].item.no,
                                    itemId: result.d.detailItem[u].itemId,
                                    pricePerItem: result.d.detailItem[u].totalPrice,
                                    quantity: result.d.detailItem[u].quantity
                                })
                            }
                            collectedSalesOrdersWithDetails.push({
                                status: result.d.percentShipped,
                                salesOrderId: result.d.id,
                                salesOrderNumber: result.d.number,
                                customerId: result.d.customerId,
                                customerNo: result.d.customer.customerNo,
                                transDate: result.d.transDateView,
                                toAddress: result.d.toAddress,
                                subTotal: result.d.subTotal,
                                totalAmount: result.d.totalAmount,
                                paymentTerm: result.d.paymentTerm.name,
                                detailItem: detailItem
                            });
                        }
                    }
                }
            });
        });
    }, 5000*time);
}

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
                    'url': 'http://localhost:8888/make-sales-order-normal?accessToken=' + result.access_token + '&sessionId=' + result.session_id + '&customerNo=' + datas.customerDetails.customerNo + '&transDate=' + datas.customerDetails.transDate + '&address=' + datas.customerDetails.address + '&paymentTermName=' + datas.customerDetails.paymentTermName + '',
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

// import xlsx from 'node-xlsx';
const xlsx = require('node-xlsx');

app.post('/import-past-sales-order', (req, res) => {
    const workSheetsFromFile = xlsx.parse(`${__dirname}/test.xlsx`);
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var excelDatas = workSheetsFromFile[0].data;
    var i = 1;
    var data = [];
    var detailItemInformations = [];
    for(i ; i < excelDatas.length; i++){
        var salesOrderDetailItems = {
            number: excelDatas[i][1],
            itemNo: excelDatas[i][6],
            unitPrice: excelDatas[i][7],
            detailName: excelDatas[i][8],
            detailNotes: excelDatas[i][9],
            itemUnitName: excelDatas[i][10],
            quantity: excelDatas[i][11],
            salesmanListNumber: excelDatas[i][12],
        }
        detailItemInformations.push(salesOrderDetailItems);
    }
    var i = 1;
    for(i ; i < excelDatas.length; i++){
        var x =0;
        var detailItem = [];
        for(x ; x < detailItemInformations.length; x++){
            if(excelDatas[i][1] == detailItemInformations[x].number){
                detailItem.push({
                    itemNo: detailItemInformations[x].itemNo,
                    unitPrice: detailItemInformations[x].unitPrice,
                    detailName: detailItemInformations[x].detailName,
                    detailNotes: detailItemInformations[x].detailNotes,
                    itemUnitName: detailItemInformations[x].itemUnitName,
                    quantity: detailItemInformations[x].quantity,
                    salesmanListNumber: detailItemInformations[x].salesmanListNumber,
                });
            }
        }

        var salesOrderInformations = {
            number: excelDatas[i][1],
            transDate: excelDatas[i][2].split(" ").join("/"),
            paymentTermName: "net " + excelDatas[i][3],
            customerNo: excelDatas[i][4],
            toAddress: excelDatas[i][5],
            detailItem: detailItem
        }
        var d = 0;
        var dataDuplicate =  false;
        for(d ; d < excelDatas.length; d++){
            if(data[d] != undefined){
                if(data[d].number == salesOrderInformations.number){
                    dataDuplicate = true;
                }
            }
        }
        if(dataDuplicate == false){
            data.push(salesOrderInformations);
        }
    }
    // res.send(data);
    console.log(data);
    var dataparameter = [];
    var i = 0;
    for(i; i < data.length; i++){
        dataparameter.push("data[" + i + "].number=" + data[i].number);
        dataparameter.push("data[" + i + "].transDate=" + data[i].transDate);
        dataparameter.push("data[" + i + "].paymentTermName=" + data[i].paymentTermName);
        dataparameter.push("data[" + i + "].customerNo=" + data[i].customerNo);
        dataparameter.push("data[" + i + "].toAddress=" + data[i].toAddress);
        
        var x = 0;
        for(x; x < detailItem.length; x++){
            dataparameter.push("data[" + i + "].detailItem[" + x + "].itemNo=" + data[i].detailItem[x].itemNo);
            dataparameter.push("data[" + i + "].detailItem[" + x + "].unitPrice=" + data[i].detailItem[x].unitPrice);
            dataparameter.push("data[" + i + "].detailItem[" + x + "].detailName=" + data[i].detailItem[x].detailName);
            dataparameter.push("data[" + i + "].detailItem[" + x + "].detailNotes=" + data[i].detailItem[x].detailNotes);
            dataparameter.push("data[" + i + "].detailItem[" + x + "].itemUnitName=" + data[i].detailItem[x].itemUnitName);
            dataparameter.push("data[" + i + "].detailItem[" + x + "].quantity=" + data[i].detailItem[x].quantity);
            dataparameter.push("data[" + i + "].detailItem[" + x + "].salesmanListNumber=" + data[i].detailItem[x].salesmanListNumber);
        }
    }
    // res.send(dataparameter);
    var i = 0;
    var requestParameter = "";
    for(i; i < dataparameter.length; i++){
        requestParameter = requestParameter + dataparameter[i] + "&";
    }
    var url = 'https://public.accurate.id/accurate/api/sales-order/bulk-save.do?' + requestParameter;
    // res.send(url);

    var request = require('request');
    var options = {
        'method': 'POST',
        'url': url,
        'headers': {
            'X-Session-ID': clientSessionId,
            'Authorization': 'Bearer ' + clientAccessToken
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        // console.log(response.body);
        var result = JSON.parse(response.body);
        res.send(result.s);
    });
})

app.post('/import-past-delivery-order', (req, res) => {
    const workSheetsFromFile = xlsx.parse(`${__dirname}/testDeliveryOrder.xlsx`);
    var clientAccessToken = req.query.accessToken;
    var clientSessionId = req.query.sessionId;
    var excelDatas = workSheetsFromFile[0].data;
    var i = 1;
    var data = [];
    var detailItemInformations = [];
    for(i ; i < excelDatas.length; i++){
        var salesOrderDetailItems = {
            number: excelDatas[i][1],
            itemNo: excelDatas[i][6],
            detailName: excelDatas[i][7],
            quantity: excelDatas[i][8],
            salesOrderNumber: excelDatas[i][9],
        }
        detailItemInformations.push(salesOrderDetailItems);
    }
    var i = 1;
    for(i ; i < excelDatas.length; i++){
        var x =0;
        var detailItem = [];
        for(x ; x < detailItemInformations.length; x++){
            if(excelDatas[i][1] == detailItemInformations[x].number){
                detailItem.push({
                    itemNo: detailItemInformations[x].itemNo,
                    detailName: detailItemInformations[x].detailName,
                    quantity: detailItemInformations[x].quantity,
                    salesOrderNumber: detailItemInformations[x].salesOrderNumber,
                });
            }
        }

        var deliveryOrderInformations = {
            number: excelDatas[i][1],
            customerNo: excelDatas[i][2],
            toAddress: excelDatas[i][3],
            transDate: excelDatas[i][4].split(" ").join("/"),
            description: excelDatas[i][5],
            detailItem: detailItem
        }
        var d = 0;
        var dataDuplicate =  false;
        for(d ; d < excelDatas.length; d++){
            if(data[d] != undefined){
                if(data[d].number == deliveryOrderInformations.number){
                    dataDuplicate = true;
                }
            }
        }
        if(dataDuplicate == false){
            data.push(deliveryOrderInformations);
        }
    }
    // res.send(data);
    // console.log(data);
    var dataparameter = [];
    var i = 0;
    for(i; i < data.length; i++){
        dataparameter.push("data[" + i + "].number=" + data[i].number);
        dataparameter.push("data[" + i + "].customerNo=" + data[i].customerNo);
        dataparameter.push("data[" + i + "].toAddress=" + data[i].toAddress);
        dataparameter.push("data[" + i + "].transDate=" + data[i].transDate);
        dataparameter.push("data[" + i + "].description=" + data[i].description);
        
        var x = 0;
        for(x; x < detailItem.length; x++){
            dataparameter.push("data[" + i + "].detailItem[" + x + "].itemNo=" + data[i].detailItem[x].itemNo);
            dataparameter.push("data[" + i + "].detailItem[" + x + "].detailName=" + data[i].detailItem[x].detailName);
            dataparameter.push("data[" + i + "].detailItem[" + x + "].quantity=" + data[i].detailItem[x].quantity);
            dataparameter.push("data[" + i + "].detailItem[" + x + "].salesOrderNumber=" + data[i].detailItem[x].salesOrderNumber);
        }
    }
    // res.send(dataparameter);
    var i = 0;
    var requestParameter = "";
    for(i; i < dataparameter.length; i++){
        requestParameter = requestParameter + dataparameter[i] + "&";
    }
    var url = 'https://public.accurate.id/accurate/api/delivery-order/bulk-save.do?' + requestParameter;
    // res.send(url);

    var request = require('request');
    var options = {
        'method': 'POST',
        'url': url,
        'headers': {
            'X-Session-ID': clientSessionId,
            'Authorization': 'Bearer ' + clientAccessToken
        }
    };
    request(options, function (error, response) {
        if (error) console.log(error);
        // console.log(response.body);
        var result = JSON.parse(response.body);
        res.send(result.s);
    });
})

app.get('/get-group-buy-status-details', (req, res) => {
    var productCode = req.query.productCode;
    var targeted_total_quantity = req.query.targeted_total_quantity;
    var query_To_Get_Current_Total_Achieved_Quantity = 
        `select sum(quantity) as Current_Total_Achieved_Quantity from 
        (select * from vtportal.enquiry e) enq 
        inner join 
        (select * from vtportal.enquiry_detail) enqD 
        on enq.enquiry_id = enqD.enquiry_id 
        where goods_id = '${productCode}';`;
    con.query(query_To_Get_Current_Total_Achieved_Quantity, function (err, result, fields) {
        if (err) console.log(err);
        var Current_Total_Achieved_Quantity = 0;
        if(result[0].Current_Total_Achieved_Quantity == null){
            Current_Total_Achieved_Quantity = 0 ;
        }else{
            Current_Total_Achieved_Quantity = result[0].Current_Total_Achieved_Quantity;
        }
        console.log("Current_Total_Achieved_Quantity : " + Current_Total_Achieved_Quantity);

        var request = require('request');
        var options = {
            'method': 'GET',
            'url': 'http://localhost:8888/get-lastest-token-and-session',
            'headers': {
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            if(response != undefined && response.body != undefined){
                var credentials = JSON.parse(response.body);
                options = {
                    'method': 'GET',
                    'url': 'http://localhost:8888/get-item-all-group-buy?accessToken=' + credentials.access_token + '&sessionId=' + credentials.session_id + '',
                    'headers': {
                    }
                };
                request(options, function (error, response) {
                    if (error) throw new Error(error);
                    var responseObject = {};
                    if(response != undefined && response.body != undefined){
                        var groupBuyItems = JSON.parse(response.body);
                        if(groupBuyItems !=undefined && groupBuyItems.itemList != undefined){
                            var i = 0;
                            for(i ; i < groupBuyItems.itemList.length; i++){
                                if(groupBuyItems.itemList[i].no == productCode){
                                    console.log("found match product available for group buy = " + productCode);
                                    responseObject = {
                                        productCode : productCode,
                                        Current_Total_Achieved_Quantity : Current_Total_Achieved_Quantity,
                                        targeted_total_quantity : groupBuyItems.itemList[i].groupBuyAvaiableQuantity
                                    }
                                    res.send(responseObject);
                                    break;
                                }
                            }
                            if(Object.keys(responseObject).length === 0){
                                console.log("not found match product available for group buy = " + productCode);
                                responseObject = {
                                    productCode : productCode,
                                    Current_Total_Achieved_Quantity : Current_Total_Achieved_Quantity
                                }
                                res.send(responseObject);
                            }
                        }
                    }
                });
            }
        });
    });
})

app.get('/get-product-image-from-query', (req, res) => {
    var productCode = req.query.productCode;
    var query = `select default_pic from vtportal.goods g where goods_intro like '%${productCode}%' and lang like '%Indonesia%';`;
    con.query(query, function (err, result, fields) {
        if (err) console.log(err);
        var mainImage = "http://149.129.226.151:8103";
        mainImage = mainImage + result[0].default_pic;
        console.log("mainImage : " + mainImage);
        var responseObject = {
            productCode : productCode,
            mainImage : mainImage
        }
        res.send(responseObject);
    });
})

app.get('/get-faq', (req, res) => {
    con.query("select * from vtportal.faqCustomerService;", function (err, result, fields) {
        if (err) console.log(err);
        var allFAQ = [];
        var i =0;
        for(i; i < result.length; i++){
            allFAQ.push({
                id : result[i].id,
                frequently_ask_question : result[i].frequently_ask_question,
                answer : result[i].answer
            });
        }
        res.send(allFAQ);
    });
})

app.post('/save-temp-order-details-from-customer', (req, res) => {
    var customerNo = req.query.customerNo;
    var transDate = req.query.transDate;
    var address = req.query.address;
    var paymentTermName = req.query.paymentTermName;
    var items = req.body.item;
    console.log(items);
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
        ) * (Math.floor((Math.random() * 10) + 1)*2) * (Math.floor((Math.random() * 7) + 1)*7) +??thedate.getMilliseconds()
    ;
    var i = 0;
    for(i ; i < items.length ; i++){
        var sql = `insert into vtportal.temporary_order_request_in_store 
        values 
        ('${customerNo}', '${paymentTermName}', '${transDate}', '${address}', '${items[i].no}', '${items[i].requestQuantity}', '${items[i].unitPrice}', '${uniqueCode}', 0)`;
        insertIntoTempOrderDetails(i, sql);
    }
    setTimeout(() => {
        res.send(uniqueCode.toString());
    }, items.length * 550);
})

function insertIntoTempOrderDetails(i, sql){
    setTimeout(() => {
        con.query(sql, function (err, result, fields) {
            if (err) console.log(err);
        });
    }, i*500);
}

app.get('/confirm-temp-order-paid', (req, res) => {
    var uniqueCode = req.query.uniqueCode;
    var sql = `select * from vtportal.temporary_order_request_in_store where confirmation_code = '${uniqueCode}' and addedToAccurate = 0;`;
    con.query(sql, function (err, result, fields) {
        if (err) console.log(err);
        if(result.length != 0){
            var request = require('request');
            var options = {
                'method': 'GET',
                'url': 'http://147.139.168.202:8888/get-lastest-token-and-session',
                'headers': {
                }
            };
            var item = [];
            var i = 0;
            for(i; i < result.length; i++){
                item.push({
                    no: result[i].product_code,
                    unitPrice: result[i].unitPrice,
                    requestQuantity: result[i].request_quantity
                });
            }
            request(options, function (error, response) {
                if (error) console.log(error);
                var access = JSON.parse(response.body);
                options = {
                    'method': 'POST',
                    'url': 'http://localhost:8888/make-sales-order-normal?accessToken=' + access.access_token + '&sessionId=' + access.session_id + '&customerNo=' + result[0].customer_no + '&transDate=' + result[0].trans_date + '&address=' + result[0].address + '&paymentTermName=' + result[0].payment_term_name + '',
                    'headers': {
                            'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({item})
                };
                request(options, function (error, response) {
                    if (error) console.log(error);
                    sql = `UPDATE vtportal.temporary_order_request_in_store
                    SET addedToAccurate = 1
                    where confirmation_code = '${result[0].confirmation_code}';`;
                    console.log(sql);
                    con.query(sql, function (err, result, fields) {
                        if (err) console.log(err);
                        console.log(result);
                        console.log("data has been assigned to 1 ======================== ");
                    });
                });
            });
            setTimeout(() => {
                res.send(true);
            }, result.length * 1000);
        }else{
            res.send(false);
        }
    });
})

app.get('/get-va-orders-from-order-number', (req, res) => {
    var orderNumber = req.query.orderNumber;
    var name = req.query.name;
    var customerNo = req.query.customerNo;
    var sql = '';
    if(orderNumber != undefined){
        sql = `select * from vtportal.enquiry e where e.agency_id = '${orderNumber}'`;
    }
    if(name != undefined){
        sql = `select * from vtportal.enquiry e where e.creator like '%${name}%';`;
    }
    if(customerNo != undefined){
        sql = `select * from vtportal.enquiry e where e.company_name like '%${customerNo}%';`;
    }
    con.query(sql, function (err, result, fields) {
        if (err) console.log(err);
        var returnResponse = [];
        var i =0;
        for(i; i < result.length; i++){
            returnResponse.push({
                enquiry_id : result[i].enquiry_id,
                orderNumber : result[i].agency_id,
                paymentStatus : result[i].status,
                totalAmount : result[i].position
            });
        }
        res.send(returnResponse);
    });
})

app.get('/check-group-buy-quantity-so-far', (req, res) => {
    var product_code = req.query.product_code;
    var sql = '';
    if(product_code != undefined){
        sql = `select sum(quantity) as quantity from (select * from vtportal.enquiry e) enq inner join (select * from vtportal.enquiry_detail) enqD on enq.enquiry_id = enqD.enquiry_id where goods_id = '${product_code}' and status != 'waitpay'`;
    }
    con.query(sql, function (err, result, fields) {
        if (err) console.log(err);
        var returnResponse = {
            status : true,
            quantitySoFar : result[0].quantity
        };
        if(result != undefined || result != null){
            if(result[0].quantity != null || result[0].quantity != undefined){
                returnResponse = {
                    status : true,
                    quantitySoFar : result[0].quantity
                };
            }else{
                returnResponse = {
                    status : false,
                    quantitySoFar : result[0].quantity
                };
            }
        }else{
            returnResponse = {
                status : false
            };
        }
        res.send(returnResponse);
    });
})

app.get('/check-group-buy-quantity-so-far-gross', (req, res) => {
    var product_code = req.query.product_code;
    var sql = '';
    if(product_code != undefined){
        sql = `select sum(quantity) as quantity from (select * from vtportal.enquiry e) enq inner join (select * from vtportal.enquiry_detail) enqD on enq.enquiry_id = enqD.enquiry_id where goods_id = '${product_code}' and status = 'payment'`;
    }
    con.query(sql, function (err, result, fields) {
        if (err) console.log(err);
        var returnResponse = {
            status : true,
            quantitySoFar : result[0].quantity
        };
        if(result != undefined || result != null){
            if(result[0].quantity != null || result[0].quantity != undefined){
                returnResponse = {
                    status : true,
                    quantitySoFar : result[0].quantity
                };
            }else{
                returnResponse = {
                    status : false,
                    quantitySoFar : result[0].quantity
                };
            }
        }else{
            returnResponse = {
                status : false
            };
        }
        res.send(returnResponse);
    });
})

app.get('/unpaid-in-store-orders', (req, res) => {
    var customer_no = req.query.customer_no;
    var sql = '';
    if(customer_no != undefined){
        sql = `select * from vtportal.temporary_order_request_in_store where customer_no = '${customer_no}' and addedToAccurate != 1`;
    }
    con.query(sql, function (err, result, fields) {
        if (err) console.log(err);
        var returnResponse = [];
        var i =0;
        for(i; i < result.length; i++){
            returnResponse.push({
                payment_method_selected : result[i].payment_term_name,
                trans_date : result[i].trans_date,
                product_code : result[i].product_code,
                requested_quantity : result[i].request_quantity,
                unit_price : result[i].unitPrice,
                confirmation_code: result[i].confirmation_code
            });
        }
        res.send(returnResponse);
    });
})

app.get('/forget-password-request', (req, res) => {
    console.log("forget-password-request ========================================================== started");
    var customer_primary_contact = req.query.customer_primary_contact;
    var customer_primary_email = req.query.customer_primary_email;
    var customer_name = req.query.customer_name;
    // var customer_register_time = req.query.customer_register_time;
    console.log("customer_primary_contact " + customer_primary_contact);
    console.log("customer_primary_email " + customer_primary_email);
    console.log("customer_name " + customer_name);
    var sql = `select cust_id from vtportal.customer where cust_email like '%${customer_primary_email}%'`;
    con.query(sql, function (err, result, fields) {
        if (err) console.log(err);
        console.log("result.length 1 " + result.length);
        if(result.length != 0 && result.length == 1){
            var sql = `select cust_id from vtportal.customer where cust_mobile like '%${customer_primary_contact}%' and cust_id like '%${result[0].cust_id}%'`;
            con.query(sql, function (err, result, fields) {
                if (err) console.log(err);
                console.log("result.length 2 " + result.length);
                if(result.length != 0){
                    var sql = `select cust_id from vtportal.customer where cust_name like '%${customer_name}%' and cust_id like '%${result[0].cust_id}%'`;
                    con.query(sql, function (err, result, fields) {
                        if (err) console.log(err);
                        console.log("result.length 3 " + result.length);
                        if(result.length != 0){
                            // reset password approved
                            res.send(
                                {
                                    customerNo: result[0].cust_id
                                }
                            );
                        }else{
                            // reset password fail in name
                            res.send(false);
                        }
                    });
                }else{
                    // reset password fail in contact number
                    res.send(false);
                }
            });
        }else{
            // reset password fail in email
            res.send(false);
        }
    });
})

app.get('/alter-password-with-approve-request', (req, res) => {
    var customer_no = req.query.customer_no;
    var password = req.query.password;
    var request = require('request');
    var options = {
        'method': 'GET',
        'url': 'http://147.139.168.202:8080/resetPasswordWithCustomerNo.jsp?customerNo=' + customer_no + '&password=' + password + '',
        'headers': {
        }
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        console.log(response.body);
        if(JSON.parse(response.body)){
            res.send(response.body);
        }else{
            res.send(false);
        }
    });
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
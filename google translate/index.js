const {Translate} = require('@google-cloud/translate').v2;
require('dotenv').config();

// Your credentials
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);

// Configuration for the client
const translate = new Translate({
    credentials: CREDENTIALS,
    projectId: CREDENTIALS.project_id
});

// const detectLanguage = async (text) => {

//     try {
//         let response = await translate.detect(text);
//         return response[0].language;
//     } catch (error) {
//         console.log(`Error at detectLanguage --> ${error}`);
//         return 0;
//     }
// }

// detectLanguage('你好呀')
//     .then((res) => {
//         console.log(res);
//     })
//     .catch((err) => {
//         console.log(error);
//     });

const translateText = async (text, targetLanguage) => {

    try {
        let [response] = await translate.translate(text, targetLanguage);
        return response;
    } catch (error) {
        console.log(`Error at translateText --> ${error}`);
        return 0;
    }
};

// translateText('hi there', 'zh-CN')
//     .then((res) => {
//         console.log(res);
//     })
//     .catch((err) => {
//         console.log(err);
//     });

var mysql = require('mysql');

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

async function get_all_product_names(){
    return new Promise(async resolve => {
        var sql = `select Name from vtportal.product_data_accurate where Mandarin_Name is NULL;`;
        // console.log(sql);
        await con.query(sql, async function (err, result) {
            if (err) {
                await console.log(err);
            }else{
                resolve(result);
            }
        });
    });
}

async function update_product_Mandarin_name(translated_name, bahasa_name){
    return new Promise(async resolve => {
        var sql = `Update vtportal.product_data_accurate set Mandarin_Name = '${translated_name}' where Mandarin_Name is NULL and Name = '${bahasa_name}';`;
        // console.log(sql);
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

get_all_product_names().then(async (res) => {
    var i = 0;
    for(i; i < res.length; i ++){
        await translateText(res[i].Name, 'zh-CN').then(async (translated_name) => {
            await update_product_Mandarin_name(translated_name, res[i].Name).then(async (result) => {
                console.log(result);
            }).catch((err) => {
                console.log(err);
            });
        }).catch((err) => {
            console.log(err);
        });
    }
}).catch((err) => {
    console.log(err);
});
setInterval(() => {
    get_all_product_names().then(async (res) => {
        var i = 0;
        for(i; i < res.length; i ++){
            await translateText(res[i].Name, 'zh-CN').then(async (translated_name) => {
                await update_product_Mandarin_name(translated_name, res[i].Name).then(async (result) => {
                    console.log(result);
                }).catch((err) => {
                    console.log(err);
                });
            }).catch((err) => {
                console.log(err);
            });
        }
    }).catch((err) => {
        console.log(err);
    });
}, 600000000);
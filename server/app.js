/**
 * Created by Risker on 18/6/29.
 */
const express    = require('express');
const app        = express();
const fs         = require('fs');
const https      = require('https');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

var eagleConfig  = {
    port       : 8110,                                                        //启动端口：localhost:8008
    fileMax    : (200 * 1024 *1024),                                        //文件大小限制
    reqMax     : (20 * 1024),                                               //postBody 最大限制
    logPath    : './weblog/',
    openFLimt  : false,                                                       //开启分文件
    openCSRF   : true,                                                       //开启跨域请求
    fileIndex  : 0,                                                           //文件下标
    maxFileIndex : 150,                                                        //最大文件上限
    tag        : ""                                                           //每日标记
};
//cookie
app.use(cookieParser());

//logStash
app.use(bodyParser.urlencoded({ extended: false }));

app.all('/logStash/*', (req, res, next) => {
    eagleConfig.openCSRF && res.header("Access-Control-Allow-Origin", "*");
    eagleConfig.openCSRF && res.header("Access-Control-Allow-Headers", "Content-Type, Content-Length, Authorization, Accept, X-Requested-With");
    eagleConfig.openCSRF && res.header("Access-Control-Allow-Methods", "POST");
    next();
});

app.post('/logStash/push', bodyParser.json(), (req, res) => {
    var data = req.body;
    if(!data){
        console.log("请求异常...");
        res.status(200).json({ isOk:false, msg:"请求方式异常" });
        return;
    }
    if(eagleConfig.fileIndex > eagleConfig.maxFileIndex){
        console.log("文件过大...");
        res.status(200).json({ isOk:false, msg:"文件过大,请联系管理员清除" });
        return;
    }
    data.ip  = req.ip;
    data.method = 'post';
    try{
        var dataStr = JSON.stringify(data);
    }catch(e){
        console.log("格式异常...");
        res.status(200).json({ isOk:false, msg:"格式异常" });
        return;
    }
    if(!!dataStr && (dataStr.length > eagleConfig.reqMax)){
        console.log("数据超限...");
        res.status(200).json({ isOk:false, msg:"数据过大,超过20k" });
        return;
    }
    var logFilePath = eagleConfig.logPath +  'fe-' + data.uuid + '.json';

    // 追加数据
    fs.access(logFilePath, fs.constants.F_OK, (err) => {
        dataStr = (err ? "" : ",") + dataStr;
        fs.appendFile(logFilePath, dataStr, 'utf8', (err) => {
            if (err) throw err;
            fs.stat(logFilePath, (err, stats) => {
                if (err) throw err;
                if(eagleConfig.openFLimt && (stats.size > eagleConfig.fileMax)){
                    eagleConfig.fileIndex++;
                }
            });
        });
    });

    res.status(200).json({ isOk:true, msg:"" });
});

app.post('/logStash/get', bodyParser.json(), (req, res) => {
    var data = req.body;
    if(!data){
        console.log("请求异常...");
        res.status(200).json({ isOk:false, msg:"请求方式异常" });
        return;
    }
    if(!data.uuid){
        res.status(200).json({ isOk:false, msg:"参数错误" });
        return;
    }

    var logFilePath = eagleConfig.logPath +  'fe-' + data.uuid + '.json';

    fs.readFile(logFilePath, 'utf8', function(err, data){
        if(data.length > 0){
            data = '['+data+']';
            res.status(200).json({ isOk:true, data:data, msg:"success" });
        }else{
            res.status(200).json({ isOk:false, msg:"用户数据不存在" });
        }
    });
});

app.listen(eagleConfig.port,() => {
    console.log('采集服务已启动12，正在监听:%s端口。', eagleConfig.port);
    if(!fs.existsSync(eagleConfig.logPath)){
        fs.mkdirSync(eagleConfig.logPath);
    }
});
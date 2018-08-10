/**
 * Created by Risker on 2017/4/1.
 */
var dataAcquisition = {
    store:{ //配置项
        storeVer     : '1.0.2',     //版本号
        storeInput   : "ACINPUT",   //输入采集标记
        storePage    : "ACPAGE",    //页面采集标记
        storeClick   : "ACCLIK",    //点击事件采集标记
        storeReqErr  : "ACRERR",    //请求异常采集标记
        storeTiming  : "ACTIME",    //页面时间采集标记
        storeCodeErr : "ACCERR",    //代码异常采集标记
        sendUrl      : "http://localhost:9090/logStash/push",   //log采集地址（需配置）
        selector     : 'input',     //通过控制输入框的选择器来限定监听范围$("*[id^='qyd_aci']");
        acRange      : ['text','tel'],   //输入框采集范围
        userSha      : 'userSha',   //用户标识
        // classTag     : '',          //自动埋点,数据大
        classTag     : 'isjs-ac',   //主动埋点标识
        maxDays      : 5,           //cookie期限
        acbLength    : 2,           //点击元素采集层数
        useStorage   : false,       //自动检测是否使用storage，不要手动更改
        openInput    : true,        //是否开启输入数据采集
        openCodeErr  : true,        //是否开启代码异常采集
        openClick    : true,        //是否开启点击数据采集
        openAjaxData : true,        //是否采集接口异常时的参数params
        openAjaxHock : true,        //自动检测是否开启ajax异常采集,未使用jquery情况下自动关闭
        openPerformance : true      //是否开启页面性能采集
    },
    util: { //工具函数
        isNullOrEmpty: function (obj) {
            return ( obj !== 0 || obj !== "0" ) && ( obj === undefined || typeof obj === "undefined" || obj === null || obj === "null" || obj === "" );
        },
        setCookie: function (name, value, Day) {
            if (dataAcquisition.store.useStorage) {
                window.localStorage.setItem(name, value);
            } else {
                if (!Day)Day = dataAcquisition.store.maxDays;
                var exp = new Date();
                exp.setTime(exp.getTime() + Day * 24 * 60 * 60000);
                document.cookie = name + "=" + encodeURIComponent(value) + ";expires=" + exp.toUTCString() + ";path=/";
            }
        },
        getCookie: function (name) {
            var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
            if (!name)return null;
            if (dataAcquisition.store.useStorage) {
                return window.localStorage.getItem(name);
            } else {
                if (arr = document.cookie.match(reg)) {
                    return (decodeURIComponent(arr[2]));
                } else {
                    return null;
                }
            }
        },
        delCookie: function (name) {
            if (dataAcquisition.store.useStorage) {
                window.localStorage.removeItem(name);
            } else {
                this.setCookie(name, '', -1);
            }
        },
        getUuid: function (len, radix) {//uuid长度以及进制
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
            var uuid = [], i;
            if (this.isNullOrEmpty(len)) {
                len = 16;
            }
            if (this.isNullOrEmpty(radix)) {
                radix = 16;
            }
            for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];

            return uuid.join('');
        },
        getTimeStr: function () {
            var date = new Date();
            var now = date.getFullYear() + "/";
            now += (date.getMonth() + 1) + "/";
            now += date.getDate() + " ";
            now += date.getHours() + ":";
            now += date.getMinutes() + ":";
            now += date.getSeconds() + "";
            return now;
        }
    },
    init: function () {
        var _this = this, _ACIDoms = $(this.store.selector);

        this.store.useStorage = (typeof window.localStorage != 'undefined');
        this.store.openAjaxHock = (!this.util.isNullOrEmpty($) && !this.util.isNullOrEmpty($.ajax));
        this.util.setCookie(this.store.storePage, window.location.pathname);

        if (this.util.isNullOrEmpty(this.util.getCookie(this.store.userSha))) {
            this.util.setCookie(this.store.userSha, this.util.getUuid())
        }

        this.postData();

        //对ajax绑定error处理，将异常信息做上报
        if(this.store.openAjaxHock){
            this.bindAjaxHook();
        }

        //对页面加载信息进行监听上报
        if(this.store.openPerformance){
            this.setPerformanceAc();
        }

        //对代码异常做监控，对异常上报
        if(this.store.openCodeErr){
            this.bindCodeHook();
        }

        //输入框事件监听
        if(this.store.openInput){
            //输入框事件监听
            for (var i = 0; i < _ACIDoms.length; i++) {
                var selector = _ACIDoms[i];
                if (selector.type && dataAcquisition.store.acRange.indexOf(selector.type.toLowerCase()) > -1) {
                    selector.addEventListener("input", function () {
                        dataAcquisition.setInputAc(this);
                    });
                    selector.addEventListener("focus", function () {
                        dataAcquisition.setInputAc(this);
                    });
                    selector.addEventListener("blur", function () {
                        dataAcquisition.setInputAc(this);
                    });
                }
            }
        }

        //点击事件监听
        if(this.store.openClick){
            //对本页面添加监听（ios兼容性问题）
            if (/iphone|ipad|ipod/i.test(window.navigator.userAgent)) {
                var elements = document.getElementsByTagName("body")[0].childNodes;
                for (var z = 0, length = elements.length; z < length; z++) {
                    elements[z].addEventListener("click", function () {
                    });
                }
            }

            document.addEventListener("click", function (e) {
                var event = window.event || e;
                var target = event.srcElement ? event.srcElement : event.target;
                _this.getACBtarget(target);
            });
        }
        return this;
    },
    bindAjaxHook: function () {//对ajax中的异常进行捕获,需将代码置于业务代码之前，对所有ajax进行代理
        var _ajax = $.ajax;
        $.ajax = function (opts) {
            var errorCallback = opts.error;
            opts.error = function (XMLHttpRequest, textStatus, errorThrown) {
                dataAcquisition.setAjErrAc(opts, XMLHttpRequest);
                errorCallback && errorCallback(XMLHttpRequest, textStatus, errorThrown);
            };
            return _ajax(opts);
        }
    },
    bindCodeHook: function () {
        var _this = this;
        window.onerror = function (msg, url, line, col, err) {
            if (_this.util.isNullOrEmpty(url)) {
                return true;
            }
            col = col || (window.event && window.event.errorCharacter) || 0;
            var codeErrData = {
                type: _this.store.storeCodeErr,
                path: _this.util.getCookie(_this.store.storePage),
                sTme: _this.util.getTimeStr(),
                msg: msg,
                ua: navigator.userAgent,
                line: line,
                col: col
            };
            if (!!err && !!err.stack) {
                //可以直接使用堆栈信息
                codeErrData.err = err.stack.toString();
            } else if (!!arguments.callee) {
                //尝试通过callee获取异常堆栈
                var errmsg = [];
                var f = arguments.callee.caller, c = 3;//防止堆栈信息过大
                while (f && (--c > 0)) {
                    errmsg.push(f.toString());
                    if (f === f.caller) {
                        break;
                    }
                    f = f.caller;
                }
                errmsg = errmsg.join(",");
                codeErrData.err = errmsg;
            } else {
                codeErrData.err = "";
            }
            dataAcquisition.setCodeErrAc(codeErrData);
        }
    },
    setPerformanceAc: function () {
        var _this = this;
        if (!!window.performance) {
            var _PerforMance = window.performance;
            var _Timing = _PerforMance.timing;
            var ACPdata = [];
            if (_Timing) {
                var loadAcData = {
                    type: _this.store.storeTiming,
                    sTme: _this.util.getTimeStr(),
                    path: _this.util.getCookie(_this.store.storePage)
                    //connectEnd : _Timing.connectEnd,     //返回浏览器与服务器之间的连接建立时的Unix毫秒时间戳
                    //connectStart : _Timing.connectStart, //返回HTTP请求开始向服务器发送时的Unix毫秒时间戳
                    //domComplete:_Timing.domComplete,//返回当前文档解析完成时的Unix毫秒时间戳。
                    //domContentLoadedEventEnd : _Timing.domContentLoadedEventEnd,//返回当所有需要立即执行的脚本已经被执行（不论执行顺序）时的Unix毫秒时间戳。
                    //domContentLoadedEventStart : _Timing.domContentLoadedEventStart,//返回当解析器发送DOMContentLoaded 事件，即所有需要被执行的脚本已经被解析时的Unix毫秒时间戳。
                    //domInteractive : _Timing.domInteractive,//返回当前网页DOM结构结束解析、开始加载内嵌资源时的Unix毫秒时间戳。
                    //domLoading : _Timing.domLoading,//返回当前网页DOM结构开始解析的Unix毫秒时间戳。
                    //domainLookupEnd: _Timing.domainLookupEnd, //表征了域名查询结束的UNIX时间戳。
                    //domainLookupStart: _Timing.domainLookupStart, //表征了域名查询开始的UNIX时间戳。
                    //fetchStart: _Timing.fetchStart, //表征了浏览器准备好使用HTTP请求来获取(fetch)文档的UNIX时间戳。这个时间点会在检查任何应用缓存之前。
                    //loadEventEnd: _Timing.loadEventEnd,//返回当load事件结束，即加载事件完成时的Unix毫秒时间戳。
                    //loadEventStart: _Timing.loadEventStart,//load事件被发送时的Unix毫秒时间戳。
                    //navigationStart: _Timing.navigationStart,//准备加载新页面的起始时间
                    //redirectEnd: _Timing.redirectEnd,  //表征了最后一个HTTP重定向完成时（也就是说是HTTP响应的最后一个比特直接被收到的时间）的UNIX时间戳
                    //redirectStart: _Timing.redirectStart, //表征了第一个HTTP重定向开始时的UNIX时间戳
                    //requestStart: _Timing.requestStart,//返回浏览器向服务器发出HTTP请求时（或开始读取本地缓存时）的Unix毫秒时间戳。
                    //responseEnd: _Timing.responseEnd,//返回浏览器从服务器收到（或从本地缓存读取，或从本地资源读取）最后一个字节时的Unix毫秒时间戳。
                    //responseStart: _Timing.responseStart,//返回浏览器从服务器收到（或从本地缓存读取）第一个字节时的Unix毫秒时间戳
                    //secureConnectionStart: _Timing.secureConnectionStart,  //浏览器与服务器开始安全链接的握手时的Unix毫秒时间戳
                    //unloadEventEnd: _Timing.unloadEventEnd,    //表征了unload事件处理完成时的UNIX时间戳
                    //unloadEventStart: _Timing.unloadEventStart //表征了unload事件抛出时的UNIX时间戳
                };
                loadAcData.DNS = _Timing.domainLookupEnd - _Timing.domainLookupStart; //DNS查询时间
                loadAcData.TCP = _Timing.connectEnd - _Timing.connectStart; //TCP连接耗时
                loadAcData.WT = _Timing.responseStart - _Timing.navigationStart; //白屏时间
                loadAcData.DR = _Timing.domContentLoadedEventEnd - _Timing.navigationStart; //dom ready时间，脚本加载完成时间
                loadAcData.ONL = _Timing.loadEventEnd - _Timing.navigationStart; //执行onload事件耗时
                loadAcData.ALLRT = _Timing.responseEnd - _Timing.redirectStart; //所有请求耗时
                loadAcData.PRDOM = _Timing.domComplete - _Timing.domInteractive; //dom解析耗时
                loadAcData.FXHR = _Timing.fetchStart - _Timing.navigationStart; //第一个请求发起时间
                ACPdata.push(loadAcData);
                this.util.setCookie(this.store.storeTiming, JSON.stringify(ACPdata));
            }
        }
    },
    setCodeErrAc: function (data) {
        var storeString = this.util.getCookie(this.store.storeCodeErr);
        var ACCEdata = this.util.isNullOrEmpty(storeString) ? [] : JSON.parse(storeString);
        ACCEdata.push(data);
        this.util.setCookie(this.store.storeCodeErr, JSON.stringify(ACCEdata));
    },
    setAjErrAc: function (opts, xhr) {
        var storeString = this.util.getCookie(this.store.storeReqErr);
        var ACEdata = this.util.isNullOrEmpty(storeString) ? [] : JSON.parse(storeString);
        var nowStr = this.util.getTimeStr();
        var ErrorData = {
            type: this.store.storeReqErr,
            path: this.util.getCookie(this.store.storePage),
            sTme: nowStr,
            requrl: opts.url,
            readyState: xhr.readyState,  //状态码
            status: xhr.status,
            statusText: xhr.statusText,
            textStatus: xhr.responseText
        };
        if(this.store.openAjaxData){
            ErrorData.reqData = opts.data;
        }
        ACEdata.push(ErrorData);
        this.util.setCookie(this.store.storeReqErr, JSON.stringify(ACEdata))
    },
    setInputAc: function (e) { //输入框操作数据保存
        var storeString = this.util.getCookie(this.store.storeInput);
        var elementId = e.id;
        var className = e.className;
        var storeKey = '#' + elementId + '|' + className; //存储主键，保证同一元素不重复添加
        var ACIdata = this.util.isNullOrEmpty(storeString) ? {} : JSON.parse(storeString);
        var inputData = ACIdata[storeKey];
        //已存在的数据做补充不新增
        var now = new Date().getTime();
        var nowStr = this.util.getTimeStr();

        if (this.util.isNullOrEmpty(inputData)) {
            inputData = {};
            inputData.type = this.store.storeInput;
            inputData.path = this.util.getCookie(this.store.storePage);
            inputData.eId = elementId;
            inputData.className = className;
            inputData.val = e.value || e.innerText;
            inputData.sTme = nowStr;
            inputData.eTme = nowStr
        } else {
            inputData.val += ("," + (now - new Date(inputData.eTme).getTime()) + ":" + e.value);
            inputData.eTme = nowStr;
        }
        ACIdata[storeKey] = inputData;
        this.util.setCookie(this.store.storeInput, JSON.stringify(ACIdata));
    },
    setClickAc: function (e) {  //元素点击数据保存
        if (this.util.isNullOrEmpty(e.id) && this.util.isNullOrEmpty(e.className)) {
            return;
        }
        //主动埋点生效
        if(!this.util.isNullOrEmpty(this.store.classTag) && e.className.indexOf(this.store.classTag) < 0){
            return;
        }
        var storeString = this.util.getCookie(this.store.storeClick);
        var ACBdata = this.util.isNullOrEmpty(storeString) ? [] : JSON.parse(storeString);

        var nowStr = this.util.getTimeStr();
        var clickData = {
            type: this.store.storeClick,
            path: this.util.getCookie(this.store.storePage),
            eId: e.id,
            className: e.className,
            val: e.value || e.innerText,
            sTme: nowStr,
            eTme: nowStr
        };
        ACBdata.push(clickData);
        this.util.setCookie(this.store.storeClick, JSON.stringify(ACBdata))
    },
    getAc2Type: function (type) {  //获取本地数据
        var storeArr = [];
        var storeString = this.util.getCookie(type);
        if (!this.util.isNullOrEmpty(storeString)) {
            storeArr = JSON.parse(storeString);
        }
        this.util.delCookie(type);
        return storeArr;
    },
    getACBtarget: function (node, length) {//冒泡场景下将除document外所有父元素添加点击事件
        if (this.util.isNullOrEmpty(length)) {
            length = 0;
        }
        //length限制采集内容大小，只采集有效数据
        if (!this.util.isNullOrEmpty(node)) {
            var parentNode = node && node.parentNode;

            /* 主动埋点采集点击数据时,使用下面的建议*/
            // if (Object.prototype.toString.call(parentNode) !== Object.prototype.toString.call(document) && node.id.indexOf('qyd_acb') > -1) {
            //     this.setClickAc(node);
            // }else{
            //     this.getACBtarget(parentNode);
            // }

            /* 自动埋点采集点击数据时,使用下面的建议*/
            this.setClickAc(node);
            if (Object.prototype.toString.call(parentNode) !== Object.prototype.toString.call(document) && length < this.store.acbLength) {
                this.getACBtarget(parentNode, ++length);
            }
        }
    },
    postData: function () {//数据上报
        var _this = this,
            data = [],
            storePath = window.location.pathname,
            nowStr = this.util.getTimeStr(),
            inputAcData = this.getAc2Type(this.store.storeInput),
            clickAcData = this.getAc2Type(this.store.storeClick),
            reqErrAcData = this.getAc2Type(this.store.storeReqErr),
            timingAcData = this.getAc2Type(this.store.storeTiming),
            codeErrAcData = this.getAc2Type(this.store.storeCodeErr),
            uuid = this.util.getCookie(this.store.userSha) || this.util.getUuid;

        //上报数据
        data.push({'type': this.store.storePage, 'path': storePath, sTme: nowStr, eTme: nowStr});
        if (!_this.util.isNullOrEmpty(inputAcData)) {
            for (var key in inputAcData) {
                data.push(inputAcData[key]);
            }
        }
        data = data.concat(clickAcData, reqErrAcData, codeErrAcData, timingAcData);

        this._ajax({
            type: "POST",
            dataType: "json",
            contentType: "application/json",
            data: JSON.stringify({uuid: uuid, acData: data}),
            url: _this.store.sendUrl
        });
    },
    _ajax: function (options) {
        var xhr, params;
        options = options || {};
        options.type = (options.type || "GET").toUpperCase();
        options.dataType = (options.dataType || "json");
        options.async = (options.async || true);
        if (options.data) {
            params = options.data;
        }
        // 非IE6
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
            if (xhr.overrideMimeType) {
                xhr.overrideMimeType('text/xml');
            }
        } else { //IE6及其以下版本浏览器
            xhr = new ActiveXObject("Microsoft.XMLHTTP");
        }

        if (options.type == "GET") {
            xhr.open("GET", options.url + "?" + params, options.async);
            xhr.send(null);
        } else if (options.type == "POST") {
            xhr.open("POST", options.url, options.async);
            xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
            if (params) {
                xhr.send(params);
            } else {
                xhr.send();
            }
        }
    }
};
if (typeof define === "function" && define.amd) {
    define("dataAc", ['jquery'], function () {
        return dataAcquisition.init();
    });
} else {
    window['dataAc'] = dataAcquisition.init();
}
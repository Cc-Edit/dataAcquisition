## 前端数据采集上报插件 dataAcquisition.js

### 目的：
1. 实现前端数据上报分析
2. 实现用户画像建模，轨迹分析
3. 实现主动埋点上报以及自动埋点
4. 搭配node接口实现日志存储解析
5. 基于powerBI实现数据分析展示
6. 实现前端页面加载速度上报 
7. 实现前端接口异常上报     
8. 实现前端代码异常上报	

### 使用方式：
1. clone代码到本地
2. 修改store.sendUrl为上报接口地址
3. 修改store.selector输入元素选择器，指定固定id为主动埋点，指定tagName为自动埋点
4. 如需对输入采集进行过滤，可更改store.acRange来指定，password最好不要进行采集。此处只为示例。
5. 点击元素默认向上冒泡采集两层，可修改store.acbLength来更改采集层数
6. 将文件放置在逻辑代码加载之前（支持AMD）

### 日志：
2017-04-03 - 实现基本页面访问数据上报

2017-04-22 - 实现点击数据上报

2017-05-28 - 全功能完成测试中

2017-05-31 - 正式第一版部署到ult进行采集

2017-06-09 - 爆出cookie过大导致400异常

2017-06-14 - powerBI展示层完成

2017-06-15 - 立项保存

版本升级：1.0.1

2017-06-18 - 增加点击元素采集限制，避免数据过大

2017-06-20 - 增加输入框采集类型配置

2017-06-21 - 增加接口异常上报，代理ajax error处理函数

2017-06-22 - 增加代码异常上报。监听onerror事件

2017-06-23 - 增加performance API统计页面加载时间信息

### 可配置参数：
        sendUrl      : "http://localhost:9090/logStash/push",   //log采集地址
        selector     : 'input',     //通过控制输入框的选择器来限定监听范围$("*[id^='qyd_aci']");
        acRange      : ['text','tel','password'],   //输入框采集范围
        maxDays      : 5,           //cookie期限
        acblength    : 2,           //点击元素采集层数
### 数据格式：
1. 行为数据

		{
			"uuid":"F6A6C801B7197603",        //用户标识，5天有效
			"acData":[						  //数据集
					{
					"type":"ACINPUT/ACPAGE/ACCLIK",     //上报数据类型：输入框/页面访问/点击事件
					"path":"www.domain.com/w/w/w/",   //事件发生的url
					"eId":"qyd_acb_0_1",				  //事件发生的元素ID	
					"class":"js_acb_2_0",				  //事件发生的元素class	
					"sTme":"13000000",				  //事件发生开始时间
					"eTme":"130020122",				  //事件结束事件							
					"val":"123,3000:1234,4000:12345",   //事件发生后不同时间元素的值	  		
					"utk":"usertoken"					  //关联后台日志							（未实现）
				}
			]
		}
	
2. 接口异常数据
	
		{
	        "type":"ACRERR",     //上报数据类型：接口异常
	        "path":"www.domain.com/w/w/w/",   //事件发生页面的url
	        "sTme":"2017-06-21 13:31:31",				  //事件发生时间
	        "requrl"     : "/mt/klalsjdjlenm",       //接口地址
	        "readyState" : "2",    //当前状态,0-未初始化，1-正在载入，2-已经载入，3-数据进行交互，4-完成。
	        "status"     : "301",  //请求状态码：400，500，404
	        "statusText" : "Internal Server Error",  //404错误信息是not found,500是Internal Server Error。
			"textStatus" : "parsererror",  //timeout"（超时）, "error"（错误）, "abort"(中止), "parsererror"（解析错误）     
	    }
    
3. 代码异常数据
	
		{
	        "type":"ACCERR",     //上报数据类型：代码异常
	        "path":"www.domain.com/w/w/w/",   //事件发生页面的url
	        "sTme":"2017-06-21 13:31:31",	  //事件发生时间
	        "msg"     : "script error",       //异常摘要
	        "line"    : "301",  //代码行数
	        "col"     : "异常",  //异常堆栈数据
			 "err"     : "异常信息",  
			 "ua"		 : "ios/chrome 44.44"  //浏览器版本
	    }
    
4. 时间数据
	
		{
		    "type":"ACTIME",     //上报数据类型：代码异常
		    "path":"www.domain.com/w/w/w/",   //事件发生页面的url
		    "DNS"     : "152",       //DNS查询时间
		    "TCP"     : "525",  		//TCP连接耗时
		    "WT"      : "555",  	   //白屏时间
		    "DR"      : "123", 		//dom ready时间，脚本加载完成时间
			 "ONL"		 : "152",  		//执行onload事件耗时
			 "ALLRT"	 : "152",  		//所有请求耗时
			 "PRDOM"	 : "152",  		//dom解析耗时
			 "FXHR"	 : "152"  		//第一个请求发起时间
		}
		
		
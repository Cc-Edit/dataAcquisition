## 前端数据采集上报插件 dataAcquisition.js （求个小星星）

### 公告：
大家在使用过程中有任何需求，或者不满意的点都可以提交上来。

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

### 依赖：
1. jQuery (需要对ajax的error进行包装,如果你的项目没有使用ajax来获取数据,可以根据情况改写)

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
        selector     : 'input',     //配置输入框的选择器来限定input.focus.blur事件监听范围;
        acRange      : ['text','tel'],   //配置输入框type属性,控制采集范围
        maxDays      : 5,           //cookie期限,默认:5天
        acblength    : 2,           //点击元素采集层数.层数越深数据越大

### 参数介绍：
#### sendUrl
    与之搭配的后台接口,可以用node写一个接收端来写日志.
    注意:该接口最好不要阻塞,以免影响页面响应.
#### selector
    selector选项用来控制输入框input.focus.blur事件的采集范围,其实就是一个jquery的选择器
    默认的"input"  等同于 $("input")
    例子:"*[id^='qyd_aci']" 等同于 $("*[id^='qyd_aci']"),将会选择指定id的input标签进行采集.
    只需要对需要采集的元素添加一个符合条件的ID属性即可:<input id="qyd_aci_0001" />
    可以通过指定id实现主动埋点的功能.
#### acRange
    此条件用来控制输入框的采集范围,与 selector 选项功能一致,但优先级低于 selector 选项
    注意,尽量不要采集type类型为password的元素内容,以免信息泄露
#### maxDays
    cookie的保存期限,不建议设置过长事件,以免影响其他cookie存储
#### acblength
    此选项用来限制点击事件的冒泡层数.
    我们通过 document.addEventListener("click", function (e) {...}); 来监听点击事件.
    选择事件冒泡的原理来采集,是因为有的html内容是js动态生成的,固定的选择器会遗漏掉.
    目前的点击采集是自动埋点,所有元素的点击都会向上冒泡采集两层,采集的结果会有很多小元素,更具体的显示用户行为
    当然,点击事件也支持主动埋点,只需要将329行注释掉的代码解开即可
    注意,主动埋点与自动埋点只能保留一种.(当然你可以自己定制)

### 数据格式：
1. 行为数据

		{
			"uuid":"F6A6C801B7197603",                        //用户标识，5天有效
			"acData":[					  //数据集
					{
					"type":"ACINPUT/ACPAGE/ACCLIK",   //上报数据类型：输入框/页面访问/点击事件
					"path":"www.domain.com/w/w/w/",   //事件发生的url
					"eId":"qyd_acb_0_1",		  //事件发生的元素ID	
					"className":"js_acb_2_0",	  //事件发生的元素class
					"sTme":"13000000",		  //事件发生开始时间
					"eTme":"130020122",		  //事件结束事件					
					"val":"123,3000:1234,4000:12345", //事件发生后不同时间元素的值	  		
					"utk":"usertoken"		  //关联后台日志（未实现）
				}
			]
		}
	
2. 接口异常数据
	
		{
	        "type":"ACRERR",                   //上报数据类型：接口异常
	        "path":"www.domain.com/w/w/w/",    //事件发生页面的url
	        "sTme":"2017-06-21 13:31:31",	   //事件发生时间
	        "requrl"     : "/mt/klalsjdjlenm", //接口地址
	        "readyState" : "2",                //当前状态,0-未初始化，1-正在载入，2-已经载入，3-数据进行交互，4-完成。
	        "status"     : "301",              //请求状态码：400，500，404
	        "statusText" : "Internal Server Error", //404错误信息是not found,500是Internal Server Error。
		"textStatus" : "parsererror", //timeout"（超时）, "error"（错误）, "abort"(中止), "parsererror"（解析错误）     
	    }
    
3. 代码异常数据
	
		{
	        "type":"ACCERR",     		  //上报数据类型：代码异常
	        "path":"www.domain.com/w/w/w/",   //事件发生页面的url
	        "sTme":"2017-06-21 13:31:31",	  //事件发生时间
	        "msg"     : "script error",       //异常摘要
	        "line"    : "301",  		  //代码行数
	        "col"     : "异常",  		 //异常堆栈数据
		"err"     : "异常信息",  
		"ua"      : "ios/chrome 44.44"    //浏览器版本
	    }
    
4. 时间数据
	
		{
		    "type":"ACTIME",     	      //上报数据类型：代码异常
		    "path":"www.domain.com/w/w/w/",   //事件发生页面的url
		    "DNS"     : "152",       	      //DNS查询时间
		    "TCP"     : "525",  	      //TCP连接耗时
		    "WT"      : "555",  	      //白屏时间
		    "DR"      : "123", 		      //dom ready时间，脚本加载完成时间
		    "ONL"     : "152",     	      //执行onload事件耗时
		    "ALLRT"   : "152",                //所有请求耗时
		    "PRDOM"   : "152",                //dom解析耗时
		    "FXHR"    : "152"  	              //第一个请求发起时间
		}
		
		

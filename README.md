<h2 align="center">Supporting dataAcquisition.js</h2>

dataAcquisition.js is a collect what happens to the user on the web page behavior and abnormal data usage

### [中文文档戳这里](https://github.com/adminV/dataAcquisition/blob/master/README-CN.md)  
 
### Tips：
Everyone has any needs or dissatisfaction in the use process           
You can give me pull requests     
If it helps you, please give me a star     


### demo：
Data collection page(Operations on this page will be collected and reported):        
[http://open.isjs.cn/demo-jquery/index.html](http://open.isjs.cn/demo-jquery/index.html)


Display data page(The reported data will be displayed on this page):        
[http://open.isjs.cn/admin/index.html](http://open.isjs.cn/admin/index.html)


### Target：
1. Realize front-end data reporting and analysis     
2. Realize user data portrait modeling and behavior trace analysis    
3. Realize active burying point and automatic burying point reporting   
4. Achieve front-end page loading speed reporting    
5. Implement front-end interface exception reporting    
6. Implementation of front-end code exception reporting      

### Usage：
1. Clone code to local      
2. Modify store.sendurl to submit interface address    
3. Modify the store.selector input element selector to specify the input event listening range    
4. If you want to filter the input collection, you can change store.acrange to specify, and password is better not to collect. Here is an example only     
5. Click the element to bubble up and collect two layers by default. You can modify store.acblength to change the number of layers
6. Place file before logical code load (AMD supported)
7. The server directory is the collection data receiver developed based on node.js

### Active burying / automatic burying
Only need to modify the classTag configuration to realize the two collection methods.    
Collect all elements when classTag is empty     
When a classTag has a value, only the elements in the class containing the value are collected

### Manual data escalation
Just call window.dataAc.postData()     

### Journal：
2017-04-03 - Realize basic page access data reporting

2017-04-22 - Achieve click data reporting

2017-05-28 - Full function completion test

2017-05-31 - Official online operation

Version：1.0.1

2017-06-18 - Increase the collection limit of click elements to avoid excessive data

2017-06-20 - Add input box collection type configuration

2017-06-21 - Add interface exception reporting and proxy Ajax error handling function

2017-06-22 - Add code exception reporting. Listen for onerror events

2017-06-23 - Add performance API statistics page load time information

Version：1.0.2

2018-08-9  - Reduce dependency on jQuery and replace all except selector

2018-08-10 - Add configuration and demo

2018-08-24 - Add server code to make the project run locally

Version：1.0.3

2019-11-11 - Remove dependency on jQuery, including selector, request interceptor  
   
2019-11-12 - Add image data reporting method

### Configurable：
    sendUrl      : "http://localhost:9090/logStash/push",   //Collection data receiving address     
    selector     : 'input',     //Configure the selector of input box to limit the listening range of input, focus and blur events;      
    acRange      : ['text','tel'],   //Configure the type attribute of the input box to control the collection range     
    maxDays      : 5,           //Cookie duration, default: 5 days      
    userSha      : 'userSha',   //User uuid save key       
    classTag     : 'isjs-ac',   //When the class of active burying point is set to '', it is full collection, and the data will be large      
    openInput    : 'true',      //Enable input acquisition or not     
    openCodeErr  : 'true',      //Enable code exception collection   
    openClick    : 'true',      //Enable click data collection      
    openAjaxData : 'true',      //Whether to collect params of exception request (pay attention to the protection of privacy data)     
    openPerformance : 'true',   //Whether to start page performance collection    
    acblength    : 2,           //Click the element to collect the layers. The deeper the layers, the larger the data      




### Configuration details：
#### sendUrl
    With the background interface, nodejs can be used to write a receiver to write logs       
    Warning: it is better not to block this interface to avoid affecting page response     
#### selector
    The selector option is used to control the collection range of input, focus and blur events.   
    It's actually a document.queryselectorall selector,     
    Value reference：https://www.runoob.com/cssref/css-selectors.html    
    The function of active burying point can be realized by specifying ID    
#### acRange
    This condition is used to control the collection range of the input box, which is consistent with the function of the selector option, but the priority is lower than the selector option     
    Warning: try not to collect element content of type password to avoid information disclosure      
#### classTag
    It is used to implement the active burying point. It will verify whether the element class contains the specified tag    
    Only the elements that need to be collected:<input class="qyd_aci_0001" />Set classTag to qyd_aci     
#### userSha
    The key saved by the user UUID in the browser can be modified manually in case of conflict
#### maxDays
    It is not recommended to set the cookie storage period for too long to avoid affecting the storage of other cookies     
#### acblength
    This option is used to limit the number of bubble layers for click events     
    We use document. Addeventlistener ("click", function (E) {...}); to listen for click events     
    Select the principle of event bubbling to collect, because some HTML content is generated dynamically by JS, and fixed selectors will be missed    
    At present, click acquisition is an automatic burying point. All elements will be bubbled up and collected in two layers. The collected results will have many small elements, more specific display of user behavior      
    Of course, click event also supports active embedding. You only need to untie 329 lines of commented code     
    Warning: only one kind of active burying point and automatic burying point can be reserved    

### data format：
1. User behavior data    

		{
			"uuid":"F6A6C801B7197603",                        //User uuid, valid for 5 days
			"acData":[					  //data set
                    {
					"type"  : "ACINPUT/ACPAGE/ACCLIK",   //Report data type: input box / page access / click event       
					"path"  : "www.domain.com/w/w/w/",   //URL where the event occurred       
					"eId"   : "qyd_acb_0_1",		  //ID of the element where the event occurred       
					"className" : "js_acb_2_0",	  //Event occurrence element class       
					"sTme"  : "13000000",		  //Event start time       
					"eTme"  : "130020122",		  //Event end event       
					"val"   : "123,3000:1234,4000:12345", //Values of different time elements after the event       
					"utk"   : "usertoken"		  //Associated background log (not implemented)       
				}
			]
		}
	
2. Interface abnormal data
	
		{
	        "type"       : "ACRERR",                   //Report data type: interface exception
	        "path"       : "www.domain.com/w/w/w/",    //URL of the event occurrence page
	        "sTme"       : "2017-06-21 13:31:31",	   //Event time
	        "requrl"     : "/mt/klalsjdjlenm", //Interface address
	        "readyState" : "2",                //Current status, 0-uninitialized, 1-loading, 2-loaded, 3-data interaction, 4-completed.
	        "status"     : "301",              //Request status code
	        "statusText" : "Internal Server Error", //404 the error message is not found, 500 is internal server error.
		    "textStatus" : "parsererror", //timeout", "error", "abort", "parsererror"
	    }
    
3. Code exception data
	
		{
	        "type"    : "ACCERR",     		  //Report data type: Code exception
	        "path"    : "www.domain.com/w/w/w/",   //URL of the event occurrence page
	        "sTme"    : "2017-06-21 13:31:31",	  //Event time
	        "msg"     : "script error",       //Exception summary
	        "line"    : "301",  		  //Number of lines
	        "col"     : "error",  		 //Exception stack data
		    "err"     : "error message",
		    "ua"      : "ios/chrome 44.44"    //Browser version
	    }
    
4. performance data
	
		{
		    "type"    : "ACTIME",     	      //Report data type: Code exception
		    "path"    : "www.domain.com/w/w/w/",   //URL of the event occurrence page
		    "DNS"     : "152",       	      //DNS query time
		    "TCP"     : "525",  	      //TCP connection time consuming
		    "WT"      : "555",  	      //White screen time
		    "DR"      : "123", 		      //DOM ready time, script load completion time
		    "ONL"     : "152",     	      //Time consuming for onload event execution
		    "ALLRT"   : "152",                //All requests take time
		    "PRDOM"   : "152",                //DOM parsing time consuming
		    "FXHR"    : "152"  	              //First request start time
		}

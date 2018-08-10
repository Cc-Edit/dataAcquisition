(function(){

    //代码异常
    $('#testCodeErr').click(function(){
        var b = 10 + a;
        console.log(b);
    });

    //请求异常采集
    $('#testAjaxErr').click(function(){
        $.ajax({
            type: 'POST',
            url: '/log/push',
            dataType: "json",
            contentType:'application/json;charset=UTF-8;',
            success: function(data){
                console.log('success')
            },
            error: function (xhr, thrownError) {
                console.log('ajax err')
            }
        })
    });

    //手动发送数据
    $('#testSendData').click(function(){
        if(window.dataAc){
            dataAc.postData();
        }
    });
})();
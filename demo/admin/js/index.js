/**
 * Created by xiaoqiang on 2018/8/10.
 */
(function(){
    var timer = 10;
    setInterval(function(){
        timer--;
        if(timer == 0){
            timer = 10;
            sendAjax();
        }
        $('.js-time').text(timer + 's');
    }, 1000);

    sendAjax();

    function sendAjax(){
        $.ajax({
            type: 'POST',
            url: 'http://172.16.34.96:8110/logStash/get',
            dataType: "json",
            data: JSON.stringify({uuid:getCookie('userSha')}),
            contentType:'application/json',
            success: function(data){
                if(data.isOk){
                    var list = [],
                        acData = [];
                    try{
                        list = JSON.parse(data.data);
                    }catch (e){
                        alert('数据异常,请联系管理员');
                        return
                    }
                    if(list.length < 1){
                        alert('数据异常,请联系管理员');
                        return
                    }
                    list.map(function(item, index){
                        acData = acData.concat(item.acData);
                    });
                    renderPage(list[0].uuid, acData)
                }else{
                    alert(data.msg)
                }
            },
            error: function (xhr, thrownError) {
                alert('请求异常,请联系管理员')
            }
        });
    }
    function renderPage(uuid, acData) {
        console.log(acData)
        var pageSize = 0,
            codeSize = 0,
            sendSize = 0,
            clickSize = 0,
            inputSize = 0;

        var userFoot = [],
            errCode  = [],
            reqError = [],
            pagePer  = [];

        for(var i=0,len=acData.length; i < len; i++){
            switch (acData[i].type){
                case 'ACPAGE':
                    pageSize++;
                    userFoot.push('<tr class="' + (userFoot.length % 2 == 0 ? '':'success') +'">' +
                        '<th scope="row">'+ userFoot.length +'</th>' +
                        '<td>'+ acData[i].sTme +'</td>' +
                        '<td>'+ acData[i].path +'</td>' +
                        '<td>页面访问</td><td>无</td><td>无</td></tr>');
                    break;
                case 'ACINPUT':
                    inputSize++;
                    userFoot.push('<tr class="' + (userFoot.length % 2 == 0 ? '':'success') +'">' +
                        '<th scope="row">'+ userFoot.length +'</th>' +
                        '<td>'+ acData[i].sTme +'</td>' +
                        '<td>'+ acData[i].path +'</td>' +
                        '<td>输入</td>' +
                        '<td>class: '+ acData[i].className +'</td>' +
                        '<td>'+ acData[i].val + '</td></tr>');
                    break;
                case 'ACCLIK':
                    clickSize++;
                    userFoot.push('<tr class="' + (userFoot.length % 2 == 0 ? '':'success') +'">' +
                        '<th scope="row">'+ userFoot.length +'</th>' +
                        '<td>'+ acData[i].sTme +'</td>' +
                        '<td>'+ acData[i].path +'</td>' +
                        '<td>点击</td>' +
                        '<td>class: '+ acData[i].className +'</td>' +
                        '<td>'+ acData[i].val + '</td></tr>');
                    break;
                case 'ACRERR':
                    sendSize++;
                    reqError.push('<tr class="' + (reqError.length % 2 == 0 ? '':'success') +'">' +
                        '<td>'+ acData[i].sTme +'</td>' +
                        '<td>'+ acData[i].path +'</td>' +
                        '<td>'+ acData[i].requrl +'</td>' +
                        '<td>'+ acData[i].reqData +'</td>' +
                        '<td>'+ acData[i].status +'</td>' +
                        '<td>'+ acData[i].statusText +'</td></tr>');
                    break;
                case 'ACTIME':
                    pagePer.push('<tr class="' + (pagePer.length % 2 == 0 ? '':'success') +'">' +
                        '<td>'+ acData[i].path +'</td>' +
                        '<td>'+ acData[i].DNS +'</td>' +
                        '<td>'+ acData[i].TCP +'</td>' +
                        '<td>'+ acData[i].WT +'</td>' +
                        '<td>'+ acData[i].PRDOM +'</td>' +
                        '<td>'+ acData[i].DR +'</td>' +
                        '<td>'+ acData[i].ONL +'</td>' +
                        '<td>'+ acData[i].FXHR +'</td>' +
                        '<td>'+ acData[i].ALLRT +'</td> </tr>');
                    break;
                case 'ACCERR':
                    codeSize++;
                    errCode.push('<tr class="' + (errCode.length % 2 == 0 ? '':'success') +'">' +
                        '<td>'+ acData[i].sTme +'</td>' +
                        '<td>'+ acData[i].path +'</td>' +
                        '<td>'+ acData[i].msg +'</td>' +
                        '<td>line: '+ acData[i].line + ' <br/> col: ' + acData[i].col +'</td>' +
                        '<td>'+ acData[i].err +'</td>' +
                        '<td>'+ acData[i].ua +'</td></tr>');
                    break;
            }
        }

        //渲染页面
        $('.js-uuid').text(uuid);
        $('.js-page').text(pageSize + '次');
        $('.js-code').text(codeSize + '条');
        $('.js-click').text(clickSize + '次');
        $('.js-send').text(sendSize + '条');
        $('.js-input').text(inputSize + '条');

        $('.js-userFoot').html(userFoot.join(''));
        $('.js-errCode').html(errCode.join(''));
        $('.js-reqError').html(reqError.join(''));
        $('.js-pagePer').html(pagePer.join(''));
    }

    function getCookie(name) {
        var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
        if (!name)return null;

        if (window.localStorage.getItem(name)) {
            return window.localStorage.getItem(name);
        } else {
            if (arr = document.cookie.match(reg)) {
                return (decodeURIComponent(arr[2]));
            } else {
                return null;
            }
        }
    }
})();
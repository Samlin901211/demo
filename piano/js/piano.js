//绘制钢琴
function drawPiano() {
    //1.确定钢琴各参数
    var keyboards = [[0,1,0],[0,1,0,1,0,0,1,0,1,0,1,0],[0]];
    var groupBig = ["C","D","E","F","G","A","B"];//低音大字组
    var groupSmall = ["c","d","e","f","g","a","b"];//高音小字组

    var tone = ["A2","B2"];//各音阶
    var i,j;
    
    //绘制低音大字组
    for(i=1;i>=0;i--) {
        for(j=0;j<groupBig.length;j++)
        tone.push(groupBig[j] + i);
    }

    //绘制高音大字组
    for(i=0;i<=4;i++) {
        for(j=0;j<groupSmall.length;j++)
        tone.push(groupSmall[j] + i);
    }
    
    tone.push("c5");
    
    //2.绘制~分三段绘制
    var html = ""; 
    var order = 0;//总的键盘顺序
    var tone_index = 0;//白键音阶顺序
    var creteKeyboard = function(isBlack) {
            if(isBlack) {
            html += '<div data-tone="' + tone[tone_index] + '" data-order="' + (++order) + '" class="keyboard keyboard-white"><div data-order="' + (order) + '"class="tone">' + tone[tone_index++] + '</div><div data-order="' + (++order) + '" class="keyboard keyboard-black"></div></div>';
            }else {
            html += '<div data-tone="' + tone[tone_index] + '" data-order="' + (++order) + '" class="keyboard keyboard-white"><div data-order="' + (order) + '"class="tone">' + tone[tone_index++] + '</div></div>';
            }
    }
            
    var drawGroup = function(group,times) {//辅助函数 
            var i,j;
            for(i=0;i<times;i++) {
                for(j=0;j<group.length;j++) {
                    var item = group[j];
                    var next = group[j+1];
                    var isBlack = item == 0 && next == 1;
                    creteKeyboard(isBlack);
                    isBlack && j++;
                }
            }
    }

    for(i=0;i<3;i++) {
        var times = i == 1 ? 7 : 1;
        drawGroup(keyboards[i],times)
    }

    $(".js_keyboards").html(html); 
}

//获取音源
function getSource() {
    // 获取指定音源文件的二进制数据
    var xml = new XMLHttpRequest();
    xml.responseType = 'arraybuffer';
    xml.open('GET', 'media/piano.wav', true);
    xml.onload = function() {
        // 获取二进制数据并解码
        ctx.decodeAudioData(
            xml.response,
            function(_data) {
                musicData = _data;
                bindEvent();
                getSong(playSong)
            },
            function(e) {
                alert(e.err);
            }
        );
    };
    xml.send();
}

//获取歌曲json
function getSong(cb) {
    $.ajax({
        url:"./json/happynewyear.json",
        dataType:"json",
        success:function(song) {
            cb(song);
        }
    });
}

//绑定事件
function bindEvent() {
    var cache = {};
    var frequencyRatioTempered = 1.059463;// 根据平均律得出的相邻音调之间的频率比(近似値)

    $(document).on("mousedown",".keyboard",function(event){
            var order = $(this).attr("data-order");
            var dis = order - 52;  
            var frequencyRatio = 1;
            if(cache[order]) {
            frequencyRatio = cache[order];
            }else {
            //计算频率
            if(dis > 0) {
                for(var i=0;i<dis;i++) {
                    frequencyRatio *= frequencyRatioTempered;
                }
            }else if(dis < 0){
                dis = Math.abs(dis);
                for(var i=0;i<Math.abs(dis);i++) {
                    frequencyRatio /= frequencyRatioTempered;
                }
            }
            cache[order] = frequencyRatio;
            } 
            var target = $(event.target);
            if(target && target.attr("data-order") == order) {
            if($(this).hasClass("keyboard-black")) {
                $(this).css({
                    backgroundColor:"#DFFF30"
                });  
            }else {
                $(this).addClass("keyboardactive"); 
            }
            var bufferSource = ctx.createBufferSource();
            bufferSource.buffer = musicData;
            bufferSource.playbackRate.value = frequencyRatio;
            bufferSource.connect(ctx.destination);
            bufferSource.start(0);
            };
    }).on("mouseup",".keyboard",function() {
        if($(this).hasClass("keyboard-black")) {
            $(this).css({
                backgroundColor:"black"
            });  
        }else {
            $(".keyboardactive").removeClass("keyboardactive"); 
        } 
    });
}

//播放
function playSong(song) {
    var perspeed = 80;//32分音符的速度
    var speed = [perspeed*32,perspeed*16,perspeed*8,perspeed*4,perspeed *2,perspeed];//全音符到32分音符的持续时间
    //songJSON格式:note是音符,tone：是音符 minus和plus指升降调,delay：是否有附点音符~延时半音
    var i,isPlay = false,index = 0;
    var play = function(song) {
        var tone = song["tone"];
        var minus = song["minus"];
        var plus = song["minus"];
        var button;
        if(minus) {
            button =  $("[data-tone=" + tone + "]").prev().find(".keyboard-black");
        }else if(plus) {
            button =  $("[data-tone=" + tone + "]").next().find(".keyboard-black");
        }else {
            button = $("[data-tone=" + tone + "]");  
        }
            button.trigger("mousedown");
        setTimeout(function(){
            button.trigger("mouseup");
        },100);
    }
    var int = setInterval(function(){
            if(isPlay) return;
            if(index == song.length) {
                clearInterval(int);
                return;
            }
            isPlay = true;
            var item = song[index];
            if(index == 0) {
                isPlay = false;
                play(item);
                index++;
            }else {
                var prev = song[index-1];
                var note = prev["note"];
                var time = speed[note];
                if(prev.delay) {
                    time *= 1.5;
                }
               
                setTimeout(function(){
                    isPlay = false;
                    play(item);
                    index++;
                },time);
            }
    },70);
}

var ctx,musicData;

// 初始化AudioContext
window.AudioContext = window.AudioContext || window.webkitAudioContext;
ctx = new AudioContext(); 

drawPiano();

getSource();
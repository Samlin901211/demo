;
var Audio =
    (function() {
        var canvasCtx, canvasDom, player;
        var audioCtx, source, analyser;
        var list = [{
            id: "0",
            name: "人声消除",
            handle: delevevoice
        }, {
            id: "1",
            name: "Gainnode",
            handle: gainNodeEffect
        }, {
            id: "2",
            name: "delay",
            handle: delayEffect
        }];

        //初始化
        function init(audioId, canvasId) {
            canvasDom = $("#" + canvasId).eq(0);
            canvasCtx = canvasDom.get(0).getContext('2d');
            player = $("#" + audioId)[0];
            initAudio();
        }

        //自适应
        function resize(width, height) {
            canvasDom.attr("height", height);
            canvasDom.attr("width", width);
            canvasCtx.fillStyle = 'rgba(225,225,225,0)';
            canvasCtx.fillRect(0, 0, width, height);
        }

        //初始化音频
        function initAudio() {
            try {
                audioCtx = new(window.AudioContext || window.webkitAudioContext)();
            } catch (err) {
                alert('!Your browser does not support Web Audio API!');
            };
        }

        //切歌
        function changeSongFromBuffer(buffer) {
            //创建音频环境（audio Context）
            source = audioCtx.createBufferSource(); //创建一个空的音源，一般使用该方式，后续将解码的缓冲数据放入source中，直接对source操作。
            // var buffer = audioCtx.createBuffer(2, 22050, 44100);  //创建一个双通道、22050帧，44.1k采样率的缓冲数据。
            source.buffer = buffer; //将解码出来的数据放入source中

            //转到播放和分析环节    　
            analyse();　
        }

        //切歌
        function changeSongFromAudio() {
            cutdown();
            !source && (source = audioCtx.createMediaElementSource(player));
            //转到播放和分析环节    　
            analyse();　
        }

        //切断source于destination
        function cutdown() {
            source && source.disconnect(0);
            analyser && analyser.disconnect(0);
        }

        //连接分析器
        function analyse() {
            analyser = audioCtx.createAnalyser(); //创建分析节点 
            analyser.fftSize = 256;
            draw();
            source.connect(analyser); //将音源和分析节点连接在一起
            analyser.connect(audioCtx.destination); //将分析节点和输出连接在一起
            source.start && source.start(0);
        }

        //绘制canvas
        function draw() {
            var WIDTH = canvasDom.attr("width");
            var HEIGHT = canvasDom.attr("height");

            var bufferLength = analyser.frequencyBinCount;
            var dataArray = new Uint8Array(bufferLength); //获取数组

            analyser.getByteFrequencyData(dataArray);

            canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.fillStyle = 'rgba(225,225,225,0)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            var barWidth = (WIDTH / bufferLength);
            var barHeight;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i] * 5;
                canvasCtx.fillStyle = 'orange'　 || 　'rgb(' + (barHeight + 100) + ',50,50)';
                canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);
                x += barWidth + 1;
            }

            canvasCtx.fillStyle = 'rgba(225,225,225,0)';
            requestAnimationFrame(draw);
        }

        //播歌
        function play(url) {
            player.src = url;
            player.play();
            changeSongFromAudio();
        }

        //播放文件
        function playFile(file) {
            //文件选定之后，马上用FileReader进行读入
            var fr = new FileReader();　　
            fr.onload = function(e) {　　　　
                var fileResult = e.target.result; //文件读入完成，进行解码　　　
                audioCtx.decodeAudioData(fileResult, function(buffer) {
                    changeSongFromBuffer(buffer);　　
                }, function(err) {　　　　
                    alert('!Fail to decode the file'); //解码出错        　
                });　
            };　
            fr.onerror = function(err) {　　　　
                alert('!Fail to read the file'); //文件读入出错
                　
            };　
            fr.readAsArrayBuffer(file); //同样的，ArrayBuffer方式读取
        }

        //暂停
        function pause() {
            player.pause();
        }

        //获取支持的特效列表
        function getEffectList() {
            return list;
        }

        //切换特效
        function changeEffect(id) {
            cutdown();
            for (var i = 0; i < list.length; i++) {
                if (list[i].id == id) {
                    list[i].handle();
                    break;
                }
            }
        }

        function delevevoice2() {
            var channelSplitter = audioCtx.createChannelSplitter(2),
                channelMerger = audioCtx.createChannelMerger(2),
                filterlow = audioCtx.createBiquadFilter(),
                filterhigh = audioCtx.createBiquadFilter();

            analyser = audioCtx.createAnalyser(); //创建分析节点 
            analyser.fftSize = 256;
            filterlow.type = "lowpass";
            filterlow.frequency.value = 100;
            filterlow.Q.value = 0;
            filterhigh.type = "highpass";
            filterhigh.frequency.value = 15000;
            filterhigh.Q.value = 0;

            // 高低频补偿合成
            source.connect(filterhigh);
            source.connect(filterlow);
            filterlow.connect(channelMerger);
            filterhigh.connect(channelMerger);
            channelMerger.connect(audioCtx.destination);
        }

        //歌曲过滤人声
        function delevevoice() {
            var audioContext = audioCtx,
                gain = audioContext.createGain(1),
                gain2 = audioContext.createGain(1),
                gain3 = audioContext.createGain(),
                gain4 = audioContext.createGain(),
                channelSplitter = audioContext.createChannelSplitter(2),
                channelMerger = audioContext.createChannelMerger(2);

            // 反相音频组合
            gain.gain.value = -1;
            gain2.gain.value = -1;

            source.connect(analyser);
            draw();
            analyser.connect(gain3);
            gain3.connect(channelSplitter);

            // 2-1>2
            channelSplitter.connect(gain, 0);
            gain.connect(channelMerger, 0, 1);
            channelSplitter.connect(channelMerger, 1, 1);

            //1-2>1
            channelSplitter.connect(gain2, 1);
            gain2.connect(channelMerger, 0, 0);
            channelSplitter.connect(channelMerger, 0, 0);

            // 普通合成
            gain4.gain.value = 1;
            channelMerger.connect(gain4);
            gain4.connect(audioContext.destination);
        }

        //gain
        function gainNodeEffect() {
            var gainNode = audioCtx.createGain();
            source.connect(analyser);
            draw();
            gainNode.gain.value = -1;
            analyser.connect(gainNode);
            gainNode.connect(audioCtx.destination)
        }

        //delay
        function delayEffect() {
            var delay = audioCtx.createDelay();
            var gain = audioCtx.createGain();
            //设置节点参数
            delay.delayTime.value = 0.1;
            gain.gain.value = 1.2;
            //连接： source → destination
            //         ↓      ↑
            //       delay → gain
            source.connect(analyser);
            draw();
            analyser.connect(audioCtx.destination);
            source.connect(delay);
            delay.connect(gain);
            gain.connect(audioCtx.destination);
        }

        return {
            init: init,
            play: play,
            pause: pause,
            getEffectList: getEffectList,
            changeEffect: changeEffect,
            resize: resize
        }

    })()
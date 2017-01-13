var Audio =
    (function() {
        var canvasCtx, canvasDom, player;
        var audioCtx, source, analyser;
        var currentEffect;
        var list = [{
            id: "0",
            name: "人声消除",
            handle: delevevoice
        }, {
            id: "1",
            name: "音量调节",
            handle: gainNodeEffect
        }, {
            id: "2",
            name: "延迟",
            handle: delayEffect
        }, {
            id: "3",
            name: "eq均衡器",
            handle: EQEffect
        }, {
            id: 4,
            name: "3d效果",
            handle: pannerNode
        }, {
            id: 5,
            name: "混响",
            handle: convolverEffect
        }, {
            id: 6,
            name: "CompressDynamic",
            handle: CompressDynamicEffect
        }, {
            id: 7,
            name: "左右声道调节",
            handle: stereoPannerEffect
        }, {
            id: 8,
            name: "waveShaper",
            handle: waveShaperEffect
        }, {
            id: 9,
            name: "环绕3D",
            handle: rotate3DEffect
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
            $("#eq").hide();
            $("#pannerNode").hide();
            $("#gainNode").hide();
            $("#gainode_range").val(100);
            $("#stereoNode").hide();
            $("#stereo_range").val(0);
            $("#eq").find("[type=range]").val(0);
            effect3DTimer && clearTimeout(effect3DTimer)
            source && source.disconnect(0);
            analyser && analyser.disconnect(0);
        }

        //返回source
        function getSource() {
            cutdown();
            return source;
        }

        function getCtx() {
            return audioCtx;
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
                barHeight = dataArray[i] * 3;
                canvasCtx.fillStyle = '#8A2BE2'　 || 　'rgb(' + (barHeight + 100) + ',50,50)';
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
                    currentEffect = list[i].id;
                    return list[i].handle();
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
        var _gainNode;

        function gainNodeEffect() {
            $("#gainNode").show();
            _gainNode = audioCtx.createGain();
            source.connect(analyser);
            _gainNode.gain.value = 1;
            analyser.connect(_gainNode);
            _gainNode.connect(audioCtx.destination);
            listenGainNode();
        }

        function listenGainNode() {
            $(document).on("change", "#gainode_range", function(e) {
                var tg = e.target;
                _gainNode.gain.value = tg.value / 100;
            });
        }

        //stereoPannerNode
        var _stereoPanner;

        function stereoPannerEffect() {
            $("#stereoNode").show();
            _stereoPanner = audioCtx.createStereoPanner();
            _stereoPanner.pan.value = 0;
            source.connect(analyser);
            analyser.connect(_stereoPanner);
            _stereoPanner.connect(audioCtx.destination);
            listenStereoPannerNode();
        }

        function listenStereoPannerNode() {
            $(document).on("change", "#stereo_range", function(e) {
                var tg = e.target;
                _stereoPanner.pan.value = tg.value / 100;
            });
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
            analyser.connect(audioCtx.destination);
            source.connect(delay);
            delay.connect(gain);
            gain.connect(audioCtx.destination);
        }

        var ra, rb, rc, rd, re, rf, rg, rh, ri, rj;
        //均衡器
        function EQEffect() {
            $("#eq").show();
            ra = audioCtx.createBiquadFilter();
            rb = audioCtx.createBiquadFilter();
            rc = audioCtx.createBiquadFilter();
            rd = audioCtx.createBiquadFilter();
            re = audioCtx.createBiquadFilter();
            rf = audioCtx.createBiquadFilter();
            rg = audioCtx.createBiquadFilter();
            rh = audioCtx.createBiquadFilter();
            ri = audioCtx.createBiquadFilter();
            rj = audioCtx.createBiquadFilter();
            ra.type = rb.type = rc.type = rd.type = re.type = rf.type = rg.type = rh.type = ri.type = rj.type = 'peaking';
            ra.Q.value = rb.Q.value = rc.Q.value = rd.Q.value = re.Q.value = rf.Q.value = rg.Q.value = rh.Q.value = ri.Q.value = rj.Q.value = 10;
            ra.gain.value = rb.gain.value = rc.gain.value = rd.gain.value = re.gain.value = rf.gain.value = rg.gain.value = rh.gain.value = ri.gain.value = rj.gain.value = 0;
            source.connect(ra);
            ra.connect(rb);
            rb.connect(rc);
            rc.connect(rd);
            rd.connect(re);
            re.connect(rf);
            rf.connect(rg);
            rg.connect(rh);
            rh.connect(ri);
            ri.connect(rj);
            rj.connect(analyser);
            analyser.connect(audioCtx.destination);
            listenEQchange();
        }

        //设置均衡器
        function listenEQchange() {
            $("#eq").find('[type=range]').on('change', function(e) {
                var tg = e.target,
                    type = tg.getAttribute('data-type');
                if (type === '32') {
                    ra.gain.value = tg.value;
                } else if (type === '64') {
                    rb.gain.value = tg.value;
                } else if (type === '125') {
                    rc.gain.value = tg.value;
                } else if (type === '250') {
                    rd.gain.value = tg.value;
                } else if (type === '500') {
                    re.gain.value = tg.value;
                } else if (type === '1000') {
                    rf.gain.value = tg.value;
                } else if (type === '2000') {
                    rg.gain.value = tg.value;
                } else if (type === '4000') {
                    rh.gain.value = tg.value;
                } else if (type === '8000') {
                    ri.gain.value = tg.value;
                } else if (type === '16000') {
                    rj.gain.value = tg.value;
                }
            })
        }

        //3D效果
        function pannerNode() {
            cutdown();
            $("#pannerNode").show();
            var boomX = 0;
            var boomY = 0;
            var boomZoom = 1;

            var musicBox = $(".js_qqmusic")[0];
            musicBox.style.webkitTransform = "translate(" + boomX + "px , " + boomY + "px) scale(" + boomZoom + ")";
            musicBox.style.transform = "translate(" + boomX + "px , " + boomY + "px) scale(" + boomZoom + ")";

            var WIDTH = window.innerWidth;
            var HEIGHT = window.innerHeight;

            var xPos = Math.floor(WIDTH / 2);
            var yPos = Math.floor(HEIGHT / 2);
            var zPos = 295;
            var xIterator = WIDTH / 150;

            var panner = audioCtx.createPanner();

            panner.panningModel = 'HRTF';
            panner.distanceModel = 'inverse';
            panner.refDistance = 1;
            panner.maxDistance = 10000;
            panner.rolloffFactor = 1;
            panner.coneInnerAngle = 360;
            panner.coneOuterAngle = 0;
            panner.coneOuterGain = 0;

            if (panner.orientationX) {
                panner.orientationX.value = 1;
                panner.orientationY.value = 0;
                panner.orientationZ.value = 0;
            } else {
                panner.setOrientation(1, 0, 0);
            }


            var listener = audioCtx.listener;

            if (listener.forwardX) {
                listener.forwardX.value = 0;
                listener.forwardY.value = 0;
                listener.forwardZ.value = -1;
                listener.upX.value = 0;
                listener.upY.value = 1;
                listener.upZ.value = 0;
            } else {
                listener.setOrientation(0, 0, -1, 0, 1, 0);
            }

            if (listener.positionX) {
                listener.positionX.value = xPos;
                listener.positionY.value = yPos;
                listener.positionZ.value = 300;
            } else {
                listener.setPosition(xPos, yPos, 300);
            }

            function positionPanner() {
                if (panner.positionX) {
                    panner.positionX.value = xPos;
                    panner.positionY.value = yPos;
                    panner.positionZ.value = zPos;
                } else {
                    panner.setPosition(xPos, yPos, zPos);
                }
            }

            function moveRight() {
                boomX += xIterator;
                xPos += 0.066;
                musicBox.style.webkitTransform = "translate(" + boomX + "px , " + boomY + "px) scale(" + boomZoom + ")";
                musicBox.style.transform = "translate(" + boomX + "px , " + boomY + "px) scale(" + boomZoom + ")";
                positionPanner();
            }

            function moveLeft() {
                boomX += -xIterator;
                xPos += -0.066;
                positionPanner();
                musicBox.style.webkitTransform = "translate(" + boomX + "px , " + boomY + "px) scale(" + boomZoom + ")";
                musicBox.style.transform = "translate(" + boomX + "px , " + boomY + "px) scale(" + boomZoom + ")";
            }

            function zoomIn() {
                boomZoom += 0.05;
                zPos += 0.066;
                positionPanner();
                musicBox.style.webkitTransform = "translate(" + boomX + "px , " + boomY + "px) scale(" + boomZoom + ")";
                musicBox.style.transform = "translate(" + boomX + "px , " + boomY + "px) scale(" + boomZoom + ")";
            }

            function zoomOut() {
                boomZoom += -0.05;
                zPos += -0.066;

                positionPanner();
                musicBox.style.webkitTransform = "translate(" + boomX + "px , " + boomY + "px) scale(" + boomZoom + ")";
                musicBox.style.transform = "translate(" + boomX + "px , " + boomY + "px) scale(" + boomZoom + ")";
            }

            source.connect(panner);
            panner.connect(analyser);
            analyser.connect(audioCtx.destination);
            positionPanner();

            //键码获取
            $(document).keydown(function(event) {
                if (currentEffect != 4) return;
                var isLeft = event.keyCode == 37;
                var isRight = event.keyCode == 39;
                var isTop = event.keyCode == 38;
                var isBottom = event.keyCode == 40;

                if (isLeft) {
                    moveLeft();
                } else if (isRight) {
                    moveRight();
                } else if (isTop) {
                    zoomIn();
                } else if (isBottom) {
                    zoomOut();
                }
            });
        }

        var clipData = [];
        //开始剪切
        function startClip() {
            var data = [];
            clipData.push(data);
            cutdown();
            var recorder = audioCtx.createScriptProcessor(1024, 1, 1);
            source.connect(analyser);
            analyser.connect(recorder);
            recorder.connect(audioCtx.destination);

            recorder.onaudioprocess = function(e) { //这里有内存泄露......
                var inputBuffer = e.inputBuffer;
                var outputBuffer = e.outputBuffer;
                var buffer = [];

                // Loop through the output channels (in this case there is only one)
                for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                    var inputData = inputBuffer.getChannelData(channel);
                    var outputData = outputBuffer.getChannelData(channel);
                    // console.log('output',outputData)
                    var bufferData = [];
                    // Loop through the 4096 samples
                    for (var sample = 0; sample < inputBuffer.length; sample++) {
                        // make output equal to the same as the input
                        outputData[sample] = inputData[sample];
                        bufferData[sample] = inputData[sample];
                    }
                }
                data.push(bufferData);
            };
        }

        //结束剪切
        function stopClip(cb) {
            cutdown();
            savaClip(cb);
        }

        function savaClip(cb) {
            var data = clipData[clipData.length - 1];
            var frequency = audioCtx.sampleRate; //采样频率
            var pointSize = 16; //采样点大小
            var channelNumber = 1; //声道数量
            var blockSize = channelNumber * pointSize / 8; //采样块大小
            var wave = []; //数据
            for (var i = 0; i < data.length; i++)
                for (var j = 0; j < data[i].length; j++)
                    wave.push(data[i][j] * 0x8000 | 0);
            var length = wave.length * pointSize / 8; //数据长度
            var buffer = new Uint8Array(length + 44); //wav文件数据
            var view = new DataView(buffer.buffer); //数据视图
            buffer.set(new Uint8Array([0x52, 0x49, 0x46, 0x46])); //"RIFF"
            view.setUint32(4, data.length + 44, true); //总长度
            buffer.set(new Uint8Array([0x57, 0x41, 0x56, 0x45]), 8); //"WAVE"
            buffer.set(new Uint8Array([0x66, 0x6D, 0x74, 0x20]), 12); //"fmt "
            view.setUint32(16, 16, true); //WAV头大小
            view.setUint16(20, 1, true); //编码方式
            view.setUint16(22, 1, true); //声道数量
            view.setUint32(24, frequency, true); //采样频率
            view.setUint32(28, frequency * blockSize, true); //每秒字节数
            view.setUint16(32, blockSize, true); //采样块大小
            view.setUint16(34, pointSize, true); //采样点大小
            buffer.set(new Uint8Array([0x64, 0x61, 0x74, 0x61]), 36); //"data"
            view.setUint32(40, length, true); //数据长度
            buffer.set(new Uint8Array(new Int16Array(wave).buffer), 44); //数据
            //打开文件
            var blob = new Blob([buffer], { type: "audio/wav" });
            var url = URL.createObjectURL(blob);
            cb(url);
        }

        //混响
        function convolverEffect() {
            var convolver = audioCtx.createConvolver();
            var gain = audioCtx.createGain();
            var gain2 = audioCtx.createGain();
            //模拟混响样本
            var length = 48000 || 44100;
            var buffer = audioCtx.createBuffer(2, length, length);
            var data = [buffer.getChannelData(0), buffer.getChannelData(1)];
            for (var i = 0; i < length; i++) {
                //平方根衰减
                var v = 1 - Math.sqrt(i / length);
                //叠加24个不同频率
                for (var j = 1; j <= 24; j++) v *= Math.sin(i / j);
                //记录数据
                data[0][i] = data[1][i] = v;
            };
            //配置节点
            gain.gain.value = 0.5;
            gain2.gain.value = 2;
            convolver.buffer = buffer;
            //连接：       → convolver → 
            //      source               destination
            //             →    gain   → 
            source.connect(analyser);
            analyser.connect(convolver);
            source.connect(gain);
            gain.connect(audioCtx.destination);
            //动作
            convolver.connect(gain2);
            gain2.connect(audioCtx.destination)
        }

        //动态压缩
        function CompressDynamicEffect() {
            var compressor = audioCtx.createDynamicsCompressor();
            compressor.threshold.value = -50;
            compressor.knee.value = 40;
            compressor.ratio.value = 12;
            compressor.reduction.value = -20;
            compressor.attack.value = 0;
            compressor.release.value = 0.25;
            source.connect(analyser);
            analyser.connect(compressor);
            // connect the AudioBufferSourceNode to the destination
            compressor.connect(audioCtx.destination);
        }
        return {
            init: init,
            play: play,
            pause: pause,
            getEffectList: getEffectList,
            changeEffect: changeEffect,
            resize: resize,
            startClip: startClip,
            stopClip: stopClip,
            getSource: getSource,
            getCtx: getCtx,
            cutdown: cutdown
        }

        //感谢miluwu提供:AudioAPI中提供了WaveShaper节点，它用于对音频波形做一些非线性的变换。
        //在它的属性中可以设置一条曲线，以一个Float32Array类型的强类型数组作为一组曲线的表数据来设置。
        //普通情况下这条线是一条直线，这条线上拥有和数据块大小一样多的点。
        function waveShaperEffect() {
            var shaper = audioCtx.createWaveShaper();
            //初始化shaper
            var s = [],
                l = 2048,
                i;
            for (i = 0; i <= l; i++) s.push(i / l * 2 - 1);
            shaper.curve = new Float32Array(s);
            //连接：source → shaper → denstination
            source.connect(analyser);
            analyser.connect(shaper);
            shaper.connect(audioCtx.destination);
        }

        var effect3DTimer;
        //感谢miluwu提供：旋转3D
        function rotate3DEffect() {
            var panner = audioCtx.createPanner(),
                gain = audioCtx.createGain();

            //设置声源属性
            panner.setOrientation(0, 0, 0, 0, 1, 0); //方向朝向收听者
            var a = 0,
                r = 8;
            effectTieffect3DTimermer = setInterval(function() {
                //然声源绕着收听者以8的半径旋转
                panner.setPosition(Math.sin(a / 100) * r, 0, Math.cos(a / 100) * r);
                a++;
            }, 16);
            //连接：source → panner → destination
            source.connect(analyser);
            analyser.connect(panner);
            gain.gain.value = 5;
            panner.connect(gain);
            gain.connect(audioCtx.destination);
        }
    })()
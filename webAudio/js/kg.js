var kg = (function() {
    $("body").append("<div id='kg'><div><img src='./img/microphone.png'/></div><div>正在k歌中...</div></div>");
    var ctx, Mrecorder, chunkFileList = [];

    function init() {
        // 初始化AudioContext
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = Audio.getCtx();

        //navigator
        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
    }

    function stop(cb) {
        $("#kg").hide();
        Mrecorder.stop();
        savaKg(cb);
    }

    function savaKg(cb) {
        var data = chunkFileList[chunkFileList.length - 1];
        var frequency = ctx.sampleRate; //采样频率
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
        Audio.play(url);
        cb(url);
    }

    function play(url) {
        if (!navigator.getUserMedia) {
            alert('不支持麦克风录音');
            return;
        }
        var p = navigator.mediaDevices.getUserMedia({ audio: true });
        p.then(function(mediaStream) {
            //开始k歌
            $("#kg").show();
            Audio.pause();
            var chunkFile = [];
            chunkFileList.push(chunkFile);
            Mrecorder = new MediaRecorder(mediaStream);
            Mrecorder.start();
            Audio.play(url);

            var source = ctx.createMediaStreamSource(mediaStream);
            var musicsource = Audio.getSource();
            var recorder = ctx.createScriptProcessor(1024, 1, 1);

            musicsource.connect(recorder);
            source.connect(recorder);

            recorder.connect(ctx.destination);
            //recorder.connect(ctx.destination);

            recorder.onaudioprocess = function(e) {
                var inputBuffer = e.inputBuffer;
                var outputBuffer = e.outputBuffer;

                for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                    var inputData = inputBuffer.getChannelData(channel);
                    var outputData = outputBuffer.getChannelData(channel);
                    var buffer = [];
                    for (var sample = 0; sample < inputBuffer.length; sample++) {
                        outputData[sample] = inputData[sample];
                        buffer[sample] = inputData[sample];
                    }
                }
                chunkFile.push(buffer);
            }
        });

        p.catch(function(err) {
            alert(err.name);
        });

    }

    return {
        init: init,
        play: play,
        stop: stop
    }
})();
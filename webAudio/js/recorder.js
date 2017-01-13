var Recorder = (function() {
    $("body").append("<div id='recorder'><div><img src='./img/microphone.png'/></div><div>正在录音中...</div></div>");
    var ctx, Mrecorder, chunkFile;

    function init(btnid, cb) {
        // 初始化AudioContext
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContext();

        //navigator
        navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

        getSpeaker();

        function getSpeaker() {
            if (!navigator.getUserMedia) {
                alert('不支持麦克风录音');
                return;
            }
            var p = navigator.mediaDevices.getUserMedia({ audio: true });
            p.then(function(mediaStream) {
                Mrecorder = new MediaRecorder(mediaStream);
                chunkFile = [];
                var source = ctx.createMediaStreamSource(mediaStream);
                var recorder = ctx.createScriptProcessor(1024, 1, 1);
                source.connect(recorder);
                recorder.connect(ctx.destination);
                recorder.onaudioprocess = function(e) {
                    var inputBuffer = e.inputBuffer;
                    var outputBuffer = e.outputBuffer;

                    for (var channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
                        var inputData = inputBuffer.getChannelData(channel);
                        var outputData = outputBuffer.getChannelData(channel);
                        for (var sample = 0; sample < inputBuffer.length; sample++) {
                            outputData[sample] = inputData[sample];
                        }
                    }
                }

                Mrecorder.onstop = function(e) {
                    var blob = new Blob(chunkFile, { type: "audio/wav" }),
                        url = window.URL.createObjectURL(blob);
                    cb(url);
                }

                Mrecorder.ondataavailable = function(e) {
                    chunkFile.push(e.data);
                }
            });

            p.catch(function(err) {
                alert("您没有麦克风设备，请插入设备");
            });

        }

        $(document).on("mousedown", "#" + btnid, function() {
            $("#recorder").show();
            Audio.pause();
            chunkFile = [];
            Mrecorder.start();
            console.log(Mrecorder.state)
        }).on("mouseup", "#" + btnid, function() {
            $("#recorder").hide();
            Mrecorder.stop();
            console.log(Mrecorder.state)
        })
    }

    return {
        init: init
    }
})();
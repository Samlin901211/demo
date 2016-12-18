(function() {
    'use strict';

    var isSP, ctx, xml, data, frequencyRatioTempered, keyboards;

    // 初始化AudioContext
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContext();

    // 获取指定音源文件的二进制数据
    xml = new XMLHttpRequest();
    xml.responseType = 'arraybuffer';
    xml.open('GET', 'media/piano.wav', true);
    xml.onload = function() {
        // 获取二进制数据并解码
        ctx.decodeAudioData(
            xml.response,
            function(_data) {
                data = _data;
            },
            function(e) {
                alert(e.err);
            }
        );
    };
    xml.send();

    isSP = typeof window.ontouchstart !== 'undefined';

    // 根据平均律得出的相邻音调之间的频率比(近似値)
    frequencyRatioTempered = 1.059463;

    // 将所有键整合成数组
    keyboards = Array.prototype.slice.call(
        document.getElementsByClassName('keyboard')
    );
    // 从右向左来依次处理键盘上的键
    keyboards.reverse().map(function(keyboard, index) {
        var i, frequencyRatio;
        // 根据基准音C求得其他音调相对于它的频率比例
        frequencyRatio = 1;
        for (i = 0; i < index; i++) {
            frequencyRatio /= frequencyRatioTempered;
        }
        keyboard.addEventListener(isSP ? 'touchstart' : 'click', function() {
            var bufferSource;
            bufferSource = ctx.createBufferSource();
            bufferSource.buffer = data;
            // 音源再生速度の比率変更で、音源の高さを調整
            bufferSource.playbackRate.value = frequencyRatio;
            bufferSource.connect(ctx.destination);
            bufferSource.start(0);
        });
    });
})();
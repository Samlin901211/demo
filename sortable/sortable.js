/**
 * Zepto sortable 
 * Copyright 2017, https://github.com/
 * Author:tinylin
 * Desctiption:
 *   Avaliable for mobile
 * Depends:
 *   zepto.js
 * 
 * @param {String} opts.orient 排序方向，默认是垂直 可选值 vertical horizental
 * @param {String} opts.itemClassName 被拖动子项的样式
 * @param {Object} opts.touchClassName 被拖动子项的内部某个dom的样式~可选值，设置了之后，就只能在该位置才能触发拖动排序
 * @param {Function} opts.beforeSort 排序拖动前事件回调~会传递被拖动的元素
 * @param {Function} opts.sorting 排序拖动时事件回调~会传递被拖动的元素
 * @param {Function} opts.afterSort 排序拖动后事件回调~会传递被拖动的元素
 * 
 * 调用方式:
 * 
 * <ul class="wrap">
 *    <li class="cont">1</li>//默认样式可以用cont，可以自定义
 *    <li class="cont">2</li>
 *    <li class="cont">3</li>
 * </ul>
 * 
 * 极简用法，默认是垂直方向的排序
 * $(".wrap").sortable();
 * 
 */
(function ($) {
    $.fn.sortable = function (options) {
        var defaults = {
            orient: 'vertical',
            itemClassName: 'cont',
            touchClassName: null,
            beforeSort: null,
            sorting: null,
            afterSort: null
        };
        options = $.extend(defaults, options);

        var selector = this.selector;
        var isVertical = options.orient == "vertical";
        var itemClassName = "." + options.itemClassName;
        var touchClassName = options.touchClassName ? "." + options.touchClassName : "";
        var items = $(selector).find(itemClassName);
        var beforeSort = options.beforeSort;
        var sorting = options.sorting;
        var afterSort = options.afterSort;

        //收集位置信息并缓存
        function collectionPos(collectPos) {
            var index = 0;
            items.each(function () {
                $(this).attr("data-tinyid", index++);
                var tinyid = $(this).data("tinyid");
                collectPos[tinyid] = {
                    top: this.offsetTop,
                    left: this.offsetLeft,
                    position: $(this).css("position")
                }
            });
        }

        //将元素转换为absolute状态 
        function setPosition(collectPos) {
            items.each(function () {
                var tinyid = $(this).data("tinyid");
                $(this).css({
                    position: "absolute",
                    top: collectPos[tinyid].top,
                    left: collectPos[tinyid].left
                });
            });
        }

        //检查是否可以交换元素
        function checkPosition($moveEle, collectPos) {
            if (isVertical) {
                var curTop = parseInt($moveEle.css("top"));//被拖动元素的位置
                var curTinyid = $moveEle.data("tinyid");//被拖动元素的对应唯一id
                var curPreTop = collectPos[curTinyid].top;//被拖动元素初始高度

                var threshold = $moveEle.height() / 2;//当被拖动元素拖到差不多自己底部距离下一个元素底部距离有半个高度时交换位置

                for (var tinyid in collectPos) {
                    if (tinyid == $moveEle.data("tinyid")) { continue; }
                    var top = collectPos[tinyid].top;
                    var isDown = top - curTop < threshold && top - curTop > 0;//向下
                    var isUp = curTop - top < threshold && curTop - top > 0;//向上
                    if (isDown || isUp) { //交换条件
                        collectPos[curTinyid].top = top;
                        collectPos[tinyid].top = curPreTop;
                        var $changeEle = $(selector).find("[data-tinyid='" + tinyid + "']");//需要和被拖动元素交换位置的dom
                        $changeEle.css("top", curPreTop);
                        isDown ? $changeEle.insertBefore($moveEle) : $changeEle.insertAfter($moveEle);
                        break;
                    }
                }
            }else {
                var curLeft = parseInt($moveEle.css("left"));//被拖动元素的位置
                var curTinyid = $moveEle.data("tinyid");//被拖动元素的对应唯一id
                var curPreLeft = collectPos[curTinyid].left;//被拖动元素初始左边距

                var threshold = $moveEle.width() / 2;//当被拖动元素拖到差不多自己的右边距离下一个元素底部距离有半个宽度时交换位置

                for (var tinyid in collectPos) {
                    if (tinyid == $moveEle.data("tinyid")) { continue; }
                    var left = collectPos[tinyid].left;
                    var isLeft = left - curLeft < threshold && left - curLeft > 0;//向左
                    var isRight = curLeft - left < threshold && curLeft - left > 0;//向右

                    if (isLeft || isRight) { //交换条件
                        collectPos[curTinyid].left = left;
                        collectPos[tinyid].left = curPreLeft;
                        var $changeEle = $(selector).find("[data-tinyid='" + tinyid + "']");//需要和被拖动元素交换位置的dom
                        $changeEle.css("left", curPreLeft);
                        isLeft ? $changeEle.insertBefore($moveEle) : $changeEle.insertAfter($moveEle);
                        break;
                    }
                }
            }
        }

        //恢复元素之前的样式
        function recovery(collectPos) {
            items.each(function () {
                var tinyid = $(this).data("tinyid");
                $(this).css({
                    position: collectPos[tinyid].position,
                    left: "",
                    top: ""
                });
            });
        }

        $(selector).off("touchstart").on("touchstart", touchClassName || itemClassName, function (e) {
            if (!e.touches.length) { return; }
            if (touchClassName && !$(e.target).parents(itemClassName).length) {
                return;
            }
            beforeSort && beforeSort();
            var moveEle = touchClassName ? $(e.target).parents(itemClassName)[0] : this;
            var tinyid = $(moveEle).data("tinyid");

            var collectPos = {};

            collectionPos(collectPos);
            setPosition(collectPos);

            var moveEleTop = parseInt($(moveEle).css("top"));//获取当前元素的位置
            var moveEleLeft = parseInt($(moveEle).css("left"));//获取当前元素的位置
            var startPosY = e.touches[0].pageY;
            var startPosX = e.touches[0].pageX;
            var dis;
            $(this).off("touchmove touchend").on("touchmove", function (e) {
                if (!e.touches.length) { return; }
                sorting && sorting(moveEle);
                var nowPosY = e.touches[0].pageY;
                var nowPosX = e.touches[0].pageX;
                if (isVertical) {
                    dis = nowPosY - startPosY;
                    $(moveEle).css("top", moveEleTop + dis);
                } else {
                    dis = nowPosX - startPosX;
                    $(moveEle).css("left", moveEleLeft + dis);
                }
                checkPosition($(moveEle), collectPos);
            }).on("touchend", function () {
                var tinyid = $(moveEle).data("tinyid");
                $(moveEle).css("top", collectPos[tinyid].top);
                recovery(collectPos);
                afterSort && afterSort(moveEle);
                collectPos = null;
                startPosY = null;
                tinyid = null;
                moveEle = null;
            });
        });
    }
})(Zepto);
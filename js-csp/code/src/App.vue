<template>
  <div id="app">
    <!--demo1-->
    <h1 class="title">demo1</h1>
    <img class="demoimg" src="./img/demo1.png"/>
    <Button class="btn btn-success" v-on:click="rundemo1()">Run</Button>
    <span v-if="demo1running">Running</span>
    <div class="content">
       <p v-for="data in demodata1">{{data.val}}</p>
    </div>
     
    <!--demo2-->
    <h1 class="title">demo2</h1>
    <img class="demoimg" src="./img/demo2.png"/>
    <Button class="btn btn-success" v-on:click="rundemo2()">Run</Button>
    <span v-if="demo2running">Running</span>
    <div class="content">
       <p v-for="data in demodata2">{{data.val}}</p>
    </div>

    <!--demo3-->
    <h1 class="title">demo3</h1>
    <img class="demoimg" src="./img/demo3.png"/>
    <Button class="btn btn-success" v-on:click="rundemo3()">Run</Button>
    <span v-if="demo3running">Running</span>
    <div class="content">
       <p v-for="data in demodata3">{{data.val}}</p>
    </div>

    <!--demo4-->
    <h1 class="title">demo4</h1>
    <img class="demoimg" src="./img/demo4.png"/>
    <Button class="btn btn-success" v-on:click="rundemo4()">Run</Button>
    <span v-if="demo4running">Running</span>
    <div v-show="demo4running" id="ui1"></div>

    <!--demo5-->
    <h1 class="title">demo5</h1>
    <img class="demoimg" src="./img/demo5.png"/>
    <Button class="btn btn-success" v-on:click="rundemo5()">Run</Button>
    <span v-if="demo5running">Running</span>
    <div v-show="demo5running" id="ui2"></div>
    
    <!--demo6-->
    <h1 class="title">demo6</h1>
    <img class="demoimg" src="./img/demo6_1.png"/>
    <img class="demoimg" src="./img/demo6_2.png"/>
    <Button class="btn btn-success" v-on:click="rundemo6()">Run</Button>
    <span v-if="demo6running">Running</span>
    <div v-show="demo6running" id="ui3"></div>
    
    <!--demo7-->
    <h1 class="title">demo7</h1>
    <img class="demoimg" src="./img/demo7.png"/>
    <Button class="btn btn-success" v-on:click="rundemo7()">Run</Button>
    <span v-if="demo7running">Running</span>
    <div class="content">
       <p v-for="data in demodata7">{{data.val}}</p>
    </div>
     
  </div>
</template>

<script>
import { go,chan,put,take,timeout,csp,putAsync,alts,CLOSED} from "js-csp"

export default {
  data () {
    return {
      demodata1: [],
      demo1running:false,
      demodata2: [],
      demo2running:false,
      demodata3: [],
      demo3running:false,
      demo4running:false,
      demo5running:false,
      demo6running:false,
      demodata7:[],
      demo7running:false
    }
  },
  methods:{
      rundemo1:function() {
          this.demo1running = true;
          this.demodata1= [];
          var that = this;
          var ch = chan();//注册一个管道
          go(function*() {
            var val;
            while((val = yield take(ch)) !== CLOSED) { //take这里会阻塞，直到ch管道有值
              that.demodata1.push({val:val});
            }
            that.demo1running = false;
          });
          go(function*() {
            yield put(ch, 1);//往ch管道放值，在被取值之前同样会阻塞
            yield take(timeout(1000));
            yield put(ch, 2);
            ch.close();
          });
      },
      rundemo2: function() {
          this.demo2running = true;
          this.demodata2= [];
          var that = this;
          var ch = chan();
          //A
          go(function*() {
            while(yield put(ch, 1)) { yield take(timeout(250)); }
          });
          //B
          go(function*() {
            while(yield put(ch, 2)) { yield take(timeout(300)); }
          });
          //C
          go(function*() {
            while(yield put(ch, 3)) { yield take(timeout(1000)); }
          });
          //D
          go(function*() {
            for(var i=0; i<10; i++) {
              var val = yield take(ch);
              that.demodata2.push({val:val});
            }
            ch.close();
            that.demo2running = false;
          });
      },
      rundemo3:function() {
         this.demo3running = true;
         this.demodata3= [];
         var that = this;
         var ch = chan();
         go(function*() {
           var v;
           while((v = yield take(ch)) !== CLOSED) {
             that.demodata3.push({val:v});
             yield take(timeout(300));
             yield put(ch, 2);
           }
         });
         go(function*() {
           var v;
           yield put(ch, 1);
           while((v = yield take(ch)) !== CLOSED) {
             that.demodata3.push({val:v});
             yield take(timeout(200));
             yield put(ch, 3);
           }
         });
         go(function*() {
           yield take(timeout(5000));
           ch.close();
           that.demo3running = false;
         });
      },
      rundemo4: function() {
         this.demo4running = true;
         function listen(el, type) {
           var ch = chan();
           el.addEventListener(type, function(e) {
                   putAsync(ch, e);
           });
           return ch;
         }
         go(function*() {
           var el = document.querySelector('#ui1');
           var ch = listen(el, 'mousemove');
           while(true) {
             var e = yield take(ch);
             el.innerHTML = ((e.layerX || e.clientX) + ', ' +
                             (e.layerY || e.clientY));
           }
         });
      },
      rundemo5: function() {
          this.demo5running = true;
          function listen(el, type) {
            var ch = chan();
            el.addEventListener(type, function(e) {
                putAsync(ch, e);
            });
            return ch;
          }
          go(function*() {
            var el = document.querySelector('#ui2');
            var mousech = listen(el, 'mousemove');
            var clickch = listen(el, 'click');
            var mousePos = [0, 0];
            var clickPos = [0, 0];
            while(true) {
              var v = yield alts([mousech, clickch]);
              var e = v.value;
              if(v.channel === mousech) {
                mousePos = [e.layerX || e.clientX, e.layerY || e.clientY];
              }
              else {
                clickPos = [e.layerX || e.clientX, e.layerY || e.clientY];
              }
              el.innerHTML = (mousePos[0] + ', ' + mousePos[1] + ' — ' +
                              clickPos[0] + ', ' + clickPos[1]);
            }
          });
      },
      rundemo6: function() {
         this.demo6running = true;
         function listen(el, type, ch) {
           ch = ch || chan();
           el.addEventListener(type, function(e) {
              putAsync(ch, e);
           });
           return ch;
         }
         function listenQuery(parent, query, type) {
           var ch = chan();
           var els = Array.prototype.slice.call(parent.querySelectorAll(query));
           els.forEach(function(el) {
             listen(el, type, ch);
           });
           return ch;
         }
         function tooltip(el, content, cancel) {
           return go(function*() {
             var r = yield alts([cancel, timeout(500)]);
             if(r.channel !== cancel) {
               var tip = document.createElement('div');
               tip.innerHTML = content;
               tip.className = 'tip-up';
               tip.style.left = el.offsetLeft - 110 + 'px';
               tip.style.top = el.offsetTop + 75 + 'px';
               el.parentNode.appendChild(tip);
               yield take(cancel);
               el.parentNode.removeChild(tip);
             }
           });
         }
         function menu(hoverch, outch) {
           go(function*() {
             while(true) {
               var e = yield take(hoverch);
               tooltip(e.target,
                       'a tip for ' + e.target.innerHTML,
                       outch);
             }
           });
         }
         var el = document.querySelector('#ui3');
         el.innerHTML = '<span>one</span> <span>two</span> <span>three</span>';
         menu(listenQuery(el, 'span', 'mouseover'),listenQuery(el, 'span', 'mouseout'));
      },
      rundemo7:function() {
         this.demo7running = true;
         this.demodata7= [];
         var that = this;
         var start = Date.now();
         var ch = chan(13);
         go(function*() {
           for(var x=0; x<15; x++) {
             yield put(ch, x);
             that.demodata7.push({val:x});
           }
         });
         go(function*() {
           while(!ch.closed) {
             yield take(timeout(200));
             for(var i=0; i<5; i++) {
               var v = yield take(ch);
               that.demodata7.push({val:v});
             }
           }
         });
         go(function*() {
           yield take(timeout(1000));
           ch.close();
           that.demo7running = false;
         });
      }
  }
}
</script>

<style>
body {
  width:1000px;
  margin:0 auto;
  font-family: Helvetica, sans-serif;
}
.title {
  text-align:center;
  color:#FFF;
  background:yellowgreen
}
.demoimg {
  width:100%;
  margin-bottom:10px;
}
.content {
   margin:10px
}
#ui1,#ui2,#ui3 {
  margin:10px 0;
  width:400px;
  height:50px;
  font-size:30px;
  text-align:center;
  line-height:50px;
  background:lightgrey;
}
#ui3 span{display:inline-block;margin:0 .25em;text-decoration:underline}#ui3 .tip-up{border:2px solid #5CB85C;width:300px;left:-150px;font-size:.7em;padding:.5em 0}#ui3 .tip-up:after,#ui3 .tip-up:before{left:50%}#ui3 .tip-up:after{border-bottom-color:#fff}#ui3 .tip-up:before{border-bottom-color:#5CB85C}.tip{position:absolute;top:-25px;left:0;background:#fff;border:4px solid #38554a;width:400px;padding:1em}.tip:after,.tip:before{right:100%;top:30px;border:solid transparent;content:" ";height:0;width:0;position:absolute;pointer-events:none}.tip:after{border-color:rgba(213,0,0,0);border-right-color:#fff;border-width:10px;margin-top:-10px}.tip:before{border-color:rgba(0,255,0,0);border-right-color:#38554a;border-width:16px;margin-top:-16px}.tip-up{position:absolute;background:#fff;border:2px solid #dfdfdf;width:450px;padding:1em;border-radius:3px}.tip-up:after,.tip-up:before{bottom:100%;left:60px;border:solid transparent;content:" ";height:0;width:0;position:absolute;pointer-events:none}.tip-up.left:after,.tip-up.left:before{left:350px}.tip-up:after{border-color:rgba(255,255,255,0);border-bottom-color:#202020;border-width:15px;margin-left:-15px}.tip-up:before{border-color:rgba(194,225,245,0);border-bottom-color:#dfdfdf;border-width:18px;margin-left:-18px}
</style>

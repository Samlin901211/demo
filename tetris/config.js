function getConfig() {
	var types = [ //方块类型
		{ 
		  block : [[0,0],[0,1],[1,0],[2,0]], 
		  color : "red",
		  point : 0
		},
		{ 
		  block : [[0,0],[-1,0],[1,0],[0,-1]],
		  color : "green",
		  point : 0
		},
		{ 
		  block : [[0,0],[-1,1],[0,1],[1,0]],
		  color : "lightblue",
		  point : 0
		},
		{ 
		  block : [[0,0],[1,0],[2,0],[3,0]],
		  color : "grey",
		  point : 1
		},
		{ 
		  block : [[0,0],[0,-1],[-1,-1],[-2,-1]],
		  color : "pink",
		  point : 1
		},
		{ 
		  block : [[0,0],[0,-1],[-1,-1],[1,0]],
		  color : "yellowgreen",
		  point : 0
		},
		{ 
		  block : [[0,0],[1,0],[1,-1],[0,-1]],
		  color : "brown",
		  point : -1
		},
	];

	function reCoordinate() {
		for(var j=0;j<types.length;j++) {
			var minTop = 9999;//找出四个方块中最小的top值，一会儿会进行平移
	        var minLeft = 9999;//找出四个方块中最小的left值，一会儿会进行平移
	        var minRight = -9999;//找出四个方块中最大的left值，一会儿会进行平移
	        var type = types[j].block;
	        for(var i=0;i<type.length;i++) {
	            var item = type[i];
	            var left = item[0];
	            var top = item[1];
	            if(top < minTop) {
	                minTop = top;
	            }
	            if(left > minRight) {
	                minRight = left;
	            }
	            if(left < minLeft) {
	                minLeft = left;
	            }
	        }
	        for(var i=0;i<type.length;i++) {
	             var item = type[i];
	             var left = item[0];
	             var top = item[1];
	             var length = minRight - minLeft + 1;//方块长度
	             var left = left + Math.round((10 - length) / 2) - minLeft;//左右偏移量
	             type[i][0] = left;
	             type[i][1] = top - minTop;
	        }
		}
	}
    
	reCoordinate();
	return {
		types : types,
		speed : 1000
	}
}

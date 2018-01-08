function loadWebAssembly(filename, imports = {}) { //1.加载wasm文件
    return fetch(filename)
        .then(response => response.arrayBuffer()) //2.转换成arrayBuffer
        .then(buffer => WebAssembly.compile(buffer)) //3.编译
        .then(module => {
            imports.env = imports.env || {};
            Object.assign(imports.env, {
                memoryBase: 0,
                tableBase: 0,
                //内存分配
                memory: new WebAssembly.Memory({ initial: 256, maximum: 256 }), //一页64kB
                table: new WebAssembly.Table({
                    initial: 0,
                    maximum: 0,
                    element: 'anyfunc'
                })
            });
            return new WebAssembly.Instance(module, imports); //4.实例化
        });
}

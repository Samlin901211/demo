# 环境搭建
## Emscripten
$ git clone https://github.com/juj/emsdk.git

$ cd emsdk

$ ./emsdk install --build=Release sdk-incoming-64bit binaryen-master-64bit

$ ./emsdk active --build=Release sdk-incoming-64bit binaryen-master-64bit

$ source ./emsdk_env.sh

## Binaren
$ git clone https://github.com/WebAssembly/binaryen.git

$ cd binaryen

$ cmake . && make

## Wabt
$ git clone --recursive https://github.com/WebAssembly/wabt

$ cd wabt

$ cmake . && make







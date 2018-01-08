(module
 (import "env" "memory" (memory $0 256 256))
 (import "env" "table" (table 0 0 anyfunc))
 (import "env" "memoryBase" (global $memoryBase i32))
 (import "env" "tableBase" (global $tableBase i32))
 (export "add" (func $add))
 (export "minus" (func $minus))
 (func $add (; 0 ;) (param $a i32) (param $b i32) (result i32)
  (return
   (i32.add
    (get_local $a)
    (get_local $b)
   )
  )
 )
 (func $minus (; 1 ;) (param $a i32) (param $b i32) (result i32)
  (return
   (i32.sub
    (get_local $a)
    (get_local $b)
   )
  )
 )
)


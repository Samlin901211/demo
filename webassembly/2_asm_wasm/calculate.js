function () {
  "use asm";
  function add(a, b) {
    a = a | 0;
    b = b | 0;
    return a + b | 0;
  }
  function minus(a, b) {
    a = a | 0;
    b = b | 0;
    return a - b | 0;
  }
  return {
    add: add,
    minus: minus
  }
}


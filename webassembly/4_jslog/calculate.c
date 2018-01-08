void jslog(int msg); //我们声明日志函数

int add(int a, int b)
{
  jslog(a);
  jslog(b);
  return a + b;
}

int minus(int a, int b)
{
  return a - b;
}

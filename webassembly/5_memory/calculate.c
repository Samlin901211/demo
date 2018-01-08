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

int getTotal(unsigned int *pos, int start, int end)
{
    int value = 0;
    for (int i = start; i <= end; i++)
    {   
        jslog(pos[i]);
        value += pos[i];
    }
    int resultPos = end + 1;
    pos[resultPos] = value;
    return value;
}

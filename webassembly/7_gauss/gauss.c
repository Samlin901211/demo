#include<math.h>
#define PI 3.1415926

void jslog(double msg);

//创建高斯矩阵
void createGausMatrix(double *pixes, int offset, int radius , int sigma) {
    double gaussSum,a,b,g;
    int i,x,len;

    a = 1 / (sqrt(2 * PI) * sigma);
    b = -1.0 / (2 * sigma * sigma);

    //生成高斯矩阵
    for (i = 0, x = -radius; x <= radius; x++, i++){
        g = a * exp(b * x * x);
        pixes[i + offset] = g;
        gaussSum += g;
    }
    len = i;
    
    //归一化, 保证高斯矩阵的值在[0,1]之间
    for (i = 0; i < len; i++) {
        if(pixes[i + offset] > 1) {
            pixes[i + offset] /= gaussSum;
        }
    }
}

void gaussBlur(double *pixes, int length, int width, int height ,int radius, int sigma) {
    createGausMatrix(pixes,length,radius,sigma);
    double *gaussMatrix = pixes + length;
    double gaussSum,r,g,b;
    int i,j,x,y,a,k;

    //x 方向一维高斯运算
    for (y = 0; y < height; y++) {
        for (x = 0; x < width; x++) {
            r = g = b = a = 0;
            gaussSum = 0;
            for(j = -radius; j <= radius; j++){
                k = x + j;
                if(k >= 0 && k < width){//确保 k 没超出 x 的范围
                    //r,g,b,a 四个一组
                    i = (y * width + k) * 4;
                    r += pixes[i] * gaussMatrix[j + radius];
                    g += pixes[i + 1] * gaussMatrix[j + radius];
                    b += pixes[i + 2] * gaussMatrix[j + radius];
                    // a += pixes[i + 3] * gaussMatrix[j];
                    gaussSum += gaussMatrix[j + radius];
                }
            }
            i = (y * width + x) * 4;
            // 除以 gaussSum 是为了消除处于边缘的像素, 高斯运算不足的问题
            pixes[i] = r / gaussSum;
            pixes[i + 1] = g / gaussSum;
            pixes[i + 2] = b / gaussSum;
            // pixes[i + 3] = a ;
        }
    }
    //y 方向一维高斯运算
    for (x = 0; x < width; x++) {
        for (y = 0; y < height; y++) {
            r = g = b = a = 0;
            gaussSum = 0;
            for(j = -radius; j <= radius; j++){
                k = y + j;
                if(k >= 0 && k < height){//确保 k 没超出 y 的范围
                    i = (k * width + x) * 4;
                    r += pixes[i] * gaussMatrix[j + radius];
                    g += pixes[i + 1] * gaussMatrix[j + radius];
                    b += pixes[i + 2] * gaussMatrix[j + radius];
                    // a += pixes[i + 3] * gaussMatrix[j];
                    gaussSum += gaussMatrix[j + radius];
                }
            }
            i = (y * width + x) * 4;
            pixes[i] = r / gaussSum;
            pixes[i + 1] = g / gaussSum;
            pixes[i + 2] = b / gaussSum;
        }
    }
}

// matrix  m x n
export class matM_N {
    value: number[][] = [];

    constructor(m: number, n: number) {
        const indexArray = new Array(m * n).fill(0).map((v, i) => i);
        this.value = new Array(m).fill(0).map((v, i) => new Array(n).fill(0));

        for (let i = 0; i < m; i++) {
            for (let j = 0; j < n; j++) {
                this.value[i][j] = indexArray[i * m + j];
            }
        }
    }
}

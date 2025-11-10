class Trendline {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    calculateX(y) {
        const m = (this.y2 - this.y1) / (this.x2 - this.x1);
        const x = this.x1 + (y - this.y1) / m;
        return x;
    }

    calculateY(x) {
        const m = (this.y2 - this.y1) / (this.x2 - this.x1);
        const y = this.y1 + m * (x - this.x1);
        return y;
    }
}

export default Trendline;
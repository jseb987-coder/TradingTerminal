class Trendline {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    calculate(y) {
        // Linear interpolation: y - y1 = m(x - x1)
        // x = x1 + (y - y1) / m
        // where m = (y2 - y1) / (x2 - x1)
        const m = (this.y2 - this.y1) / (this.x2 - this.x1);
        const x = this.x1 + (y - this.y1) / m;
        return x;
    }
}

export default Trendline;
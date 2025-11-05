class Trendline {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    calculate(y) {
        const m = (this.y2 - this.y1) / (this.x2 - this.x1);
        if (m === 0) {
            return null; // Horizontal line, no unique x for y
        }
        return this.x1 + (y - this.y1) / m;
    }

    // Add methods here as needed
}

export default Trendline;
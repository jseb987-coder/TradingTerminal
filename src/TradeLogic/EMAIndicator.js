class EMAIndicator {
    constructor(options = {}) {

        this.emaLength = options.emaLength || 10;
        this.multiplier = 2 / (this.emaLength + 1);
        this.currentEma = null;
        this._emaArray = [];
    }

    setCurrentEma(array) {
        if (Array.isArray(array) && array.length > 0) {
            const sum = array.reduce((acc, val) => acc + val, 0);
            const average = sum / array.length;
            this.currentEma = this.roundToStep(average);
            this._emaArray.push(this.currentEma);
        } else {
            this.currentEma = null;
        }

        console.log(`Initialized EMA (length: ${this.emaLength}) with value:`, this.currentEma);
    }

    update(price) {
            const newEma = (price - this.currentEma) * this.multiplier + this.currentEma;
            this.currentEma = this.roundToStep(newEma);
            this._emaArray.push(this.currentEma);
    }

    getCurrentEma() {
        return this.currentEma;
    }

    // Round to 2 decimal places
    roundToStep(value) {
        return Math.round(value * 100) / 100;
    }
}

export default EMAIndicator;

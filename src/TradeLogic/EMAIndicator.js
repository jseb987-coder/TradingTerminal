class EMAIndicator {
    constructor(options = {}) {

        this.emaLength = options.emaLength || 10;
        this.multiplier = 2 / (this.emaLength + 1);
        this.currentEma = null;
        this._emaArray = [];

        this.smaLength = 9;
        this.currentSma = null;
        this._smaArray = [];
        this._priceHistory = [];
    }

    setCurrentEma(array) {
        if (Array.isArray(array) && array.length > 0) {
            const sum = array.reduce((acc, val) => acc + val, 0);
            const average = sum / array.length;
            this.currentEma = this.roundToStep(average);
            this._emaArray.push(this.currentEma);

            // Initialize SMA
            this._priceHistory = [...array.slice(-this.smaLength)]; // Keep last smaLength prices
            this.currentSma = this.calculateSMA();
            this._smaArray.push(this.currentSma);
        } else {
            this.currentEma = null;
            this.currentSma = null;
        }

        console.log(`Initialized EMA (length: ${this.emaLength}) with value:`, this.currentEma);
        console.log(`Initialized SMA (length: ${this.smaLength}) with value:`, this.currentSma);
    }

    update(price) {
            const newEma = (price - this.currentEma) * this.multiplier + this.currentEma;
            this.currentEma = this.roundToStep(newEma);
            this._emaArray.push(this.currentEma);

            // Update SMA
            this._priceHistory.push(price);
            if (this._priceHistory.length > this.smaLength) {
                this._priceHistory.shift(); // Remove oldest price
            }
            this.currentSma = this.calculateSMA();
            this._smaArray.push(this.currentSma);

            console.log("current ema:",this.currentEma);
    }

    getCurrentEma() {
        return this.currentEma;
    }

    getCurrentSma() {
        return this.currentSma;
    }

    getEmaOfIndex(index)
    {
        return this._emaArray[index];
    }

    calculateCurrentEma(historicData,index) {
        const emaLength = this.emaLength; // 10
        const startIndex = Math.max(0, index - emaLength + 1);
        const emaData = historicData.slice(startIndex, index + 1).map(candle => candle[4]);
        this.setCurrentEma(emaData);
    }

    calculateSMA() {
        if (this._priceHistory.length === 0) return null;
        const sum = this._priceHistory.reduce((acc, val) => acc + val, 0);
        return this.roundToStep(sum / this._priceHistory.length);
    }

    // Round to 2 decimal places
    roundToStep(value) {
        return Math.round(value * 100) / 100;
    }
}

export default EMAIndicator;

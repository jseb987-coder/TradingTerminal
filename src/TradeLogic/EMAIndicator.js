
/**
 * EMA Indicator - JavaScript Implementation
 */

class EMAIndicator {
    constructor(options = {}) {
        this.emaLength = options.emaLength || 9;
    }

    /**
     * Calculate Exponential Moving Average
     * @param {number[]} data - Array of price values
     * @param {number} length - EMA period
     * @returns {number[]} Array of EMA values
     */
    calculateEMA(data, length) {
        if (data.length < length) return [];

        const ema = [];
        const multiplier = 2 / (length + 1);

        // First EMA value is SMA
        let sum = 0;
        for (let i = 0; i < length; i++) {
            sum += data[i];
        }
        ema.push(sum / length);

        // Calculate subsequent EMA values
        for (let i = length; i < data.length; i++) {
            const emaValue = (data[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
            ema.push(emaValue);
        }

        return ema;
    }

    /**
     * Main calculation function
     * @param {number[]} prices - Array of close prices
     * @returns {Object} Object containing EMA values
     */
    calculate(prices) {
        if (!Array.isArray(prices) || prices.length === 0) {
            return { error: "Invalid price data" };
        }

        const emaValues = this.calculateEMA(prices, this.emaLength);

        if (emaValues.length === 0) {
            return { error: `Insufficient data for EMA calculation. Need at least ${this.emaLength} periods.` };
        }

        return { ema: emaValues };
    }

    /**
     * Get the latest calculated EMA value
     * @param {number[]} prices - Array of close prices
     * @returns {Object} Latest EMA value
     */
    getLatest(prices) {
        const result = this.calculate(prices);

        if (result.error) return result;

        return { ema: result.ema[result.ema.length - 1] };
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EMAIndicator;
}

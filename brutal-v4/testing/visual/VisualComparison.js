/**
 * VisualComparison - Visual comparison utilities
 * 
 * Advanced pixel comparison algorithms for visual testing
 */

export class VisualComparison {
    /**
     * Compare two images using different algorithms
     */
    static compare(imageData1, imageData2, options = {}) {
        const {
            algorithm = 'pixel', // pixel | perceptual | structural
            threshold = 0.1,
            ignoreColors = false,
            ignoreAntialiasing = true
        } = options;
        
        switch (algorithm) {
            case 'pixel':
                return this.pixelCompare(imageData1, imageData2, options);
            case 'perceptual':
                return this.perceptualCompare(imageData1, imageData2, options);
            case 'structural':
                return this.structuralCompare(imageData1, imageData2, options);
            default:
                throw new Error(`Unknown comparison algorithm: ${algorithm}`);
        }
    }
    
    /**
     * Simple pixel-by-pixel comparison
     */
    static pixelCompare(imageData1, imageData2, options) {
        const { width, height } = imageData1;
        const data1 = imageData1.data;
        const data2 = imageData2.data;
        
        let diffPixels = 0;
        const totalPixels = width * height;
        const tolerance = options.tolerance || 0;
        
        for (let i = 0; i < data1.length; i += 4) {
            const diff = this.getPixelDifference(
                data1, data2, i, 
                options.ignoreColors, 
                options.ignoreAntialiasing
            );
            
            if (diff > tolerance) {
                diffPixels++;
            }
        }
        
        return {
            diffPixels,
            totalPixels,
            diffPercent: diffPixels / totalPixels,
            similar: (diffPixels / totalPixels) <= options.threshold
        };
    }
    
    /**
     * Perceptual comparison using LAB color space
     */
    static perceptualCompare(imageData1, imageData2, options) {
        const { width, height } = imageData1;
        const data1 = imageData1.data;
        const data2 = imageData2.data;
        
        let totalDiff = 0;
        let diffPixels = 0;
        const totalPixels = width * height;
        
        for (let i = 0; i < data1.length; i += 4) {
            const lab1 = this.rgbToLab(data1[i], data1[i+1], data1[i+2]);
            const lab2 = this.rgbToLab(data2[i], data2[i+1], data2[i+2]);
            
            const deltaE = this.deltaE(lab1, lab2);
            
            if (deltaE > 2.3) { // Just noticeable difference
                diffPixels++;
                totalDiff += deltaE;
            }
        }
        
        return {
            diffPixels,
            totalPixels,
            diffPercent: diffPixels / totalPixels,
            averageDeltaE: totalDiff / diffPixels || 0,
            similar: (diffPixels / totalPixels) <= options.threshold
        };
    }
    
    /**
     * Structural comparison using SSIM-like algorithm
     */
    static structuralCompare(imageData1, imageData2, options) {
        const { width, height } = imageData1;
        const windowSize = options.windowSize || 11;
        const k1 = 0.01;
        const k2 = 0.03;
        const L = 255;
        
        // Convert to grayscale for structural comparison
        const gray1 = this.toGrayscale(imageData1);
        const gray2 = this.toGrayscale(imageData2);
        
        let ssimSum = 0;
        let windowCount = 0;
        
        // Slide window across image
        for (let y = 0; y <= height - windowSize; y += windowSize) {
            for (let x = 0; x <= width - windowSize; x += windowSize) {
                const window1 = this.getWindow(gray1, x, y, windowSize, width);
                const window2 = this.getWindow(gray2, x, y, windowSize, width);
                
                const ssim = this.calculateSSIM(window1, window2, k1, k2, L);
                ssimSum += ssim;
                windowCount++;
            }
        }
        
        const averageSSIM = ssimSum / windowCount;
        
        return {
            ssim: averageSSIM,
            similar: averageSSIM >= (1 - options.threshold),
            diffPercent: 1 - averageSSIM
        };
    }
    
    /**
     * Get pixel difference
     */
    static getPixelDifference(data1, data2, index, ignoreColors, ignoreAntialiasing) {
        const r1 = data1[index];
        const g1 = data1[index + 1];
        const b1 = data1[index + 2];
        const a1 = data1[index + 3];
        
        const r2 = data2[index];
        const g2 = data2[index + 1];
        const b2 = data2[index + 2];
        const a2 = data2[index + 3];
        
        if (ignoreColors) {
            // Compare only brightness
            const brightness1 = (r1 + g1 + b1) / 3;
            const brightness2 = (r2 + g2 + b2) / 3;
            return Math.abs(brightness1 - brightness2);
        }
        
        if (ignoreAntialiasing) {
            // Check if this might be antialiasing
            if (this.isAntialiased(data1, data2, index)) {
                return 0;
            }
        }
        
        // Calculate color difference
        return Math.sqrt(
            Math.pow(r1 - r2, 2) +
            Math.pow(g1 - g2, 2) +
            Math.pow(b1 - b2, 2) +
            Math.pow(a1 - a2, 2)
        );
    }
    
    /**
     * Check if pixel difference is likely antialiasing
     */
    static isAntialiased(data1, data2, index) {
        // Simple heuristic: small color differences in neighboring pixels
        const threshold = 50;
        
        const r1 = data1[index];
        const g1 = data1[index + 1];
        const b1 = data1[index + 2];
        
        const r2 = data2[index];
        const g2 = data2[index + 1];
        const b2 = data2[index + 2];
        
        const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
        
        return diff < threshold;
    }
    
    /**
     * Convert RGB to LAB color space
     */
    static rgbToLab(r, g, b) {
        // Normalize RGB
        r = r / 255;
        g = g / 255;
        b = b / 255;
        
        // Convert to XYZ
        r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
        g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
        b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;
        
        let x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100;
        let y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) * 100;
        let z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) * 100;
        
        // Normalize for D65 illuminant
        x = x / 95.047;
        y = y / 100.000;
        z = z / 108.883;
        
        // Convert to LAB
        x = x > 0.008856 ? Math.cbrt(x) : (7.787 * x + 16/116);
        y = y > 0.008856 ? Math.cbrt(y) : (7.787 * y + 16/116);
        z = z > 0.008856 ? Math.cbrt(z) : (7.787 * z + 16/116);
        
        const L = (116 * y) - 16;
        const a = 500 * (x - y);
        const b_val = 200 * (y - z);
        
        return { L, a, b: b_val };
    }
    
    /**
     * Calculate Delta E (color difference)
     */
    static deltaE(lab1, lab2) {
        return Math.sqrt(
            Math.pow(lab1.L - lab2.L, 2) +
            Math.pow(lab1.a - lab2.a, 2) +
            Math.pow(lab1.b - lab2.b, 2)
        );
    }
    
    /**
     * Convert to grayscale
     */
    static toGrayscale(imageData) {
        const { width, height, data } = imageData;
        const gray = new Float32Array(width * height);
        
        for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            gray[j] = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        }
        
        return gray;
    }
    
    /**
     * Get window from grayscale image
     */
    static getWindow(grayData, x, y, size, width) {
        const window = new Float32Array(size * size);
        
        for (let wy = 0; wy < size; wy++) {
            for (let wx = 0; wx < size; wx++) {
                const index = (y + wy) * width + (x + wx);
                window[wy * size + wx] = grayData[index];
            }
        }
        
        return window;
    }
    
    /**
     * Calculate SSIM for a window
     */
    static calculateSSIM(window1, window2, k1, k2, L) {
        const n = window1.length;
        
        // Calculate means
        let sum1 = 0, sum2 = 0;
        for (let i = 0; i < n; i++) {
            sum1 += window1[i];
            sum2 += window2[i];
        }
        const mean1 = sum1 / n;
        const mean2 = sum2 / n;
        
        // Calculate variances and covariance
        let var1 = 0, var2 = 0, cov = 0;
        for (let i = 0; i < n; i++) {
            const diff1 = window1[i] - mean1;
            const diff2 = window2[i] - mean2;
            var1 += diff1 * diff1;
            var2 += diff2 * diff2;
            cov += diff1 * diff2;
        }
        var1 /= n - 1;
        var2 /= n - 1;
        cov /= n - 1;
        
        // Calculate SSIM
        const c1 = Math.pow(k1 * L, 2);
        const c2 = Math.pow(k2 * L, 2);
        
        const ssim = ((2 * mean1 * mean2 + c1) * (2 * cov + c2)) /
                     ((mean1 * mean1 + mean2 * mean2 + c1) * (var1 + var2 + c2));
        
        return ssim;
    }
}
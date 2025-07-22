// 🖼️ IMAGE OPTIMIZER - Backend Implementation using Sharp
// =================================================================
import sharp from 'sharp';
class ImageOptimizer {
    static async optimizeForAI(imageBuffer, targetSizeKB = 800, maxDimension = 1024) {
        const originalSize = this.getImageSizeKB(imageBuffer);
        // If already small enough, return as-is
        if (originalSize <= targetSizeKB) {
            const metadata = await sharp(imageBuffer).metadata();
            return {
                buffer: imageBuffer,
                optimization: {
                    originalSize,
                    compressedSize: originalSize,
                    compressionRatio: 1.0,
                    quality: 100,
                    dimensions: { width: metadata.width, height: metadata.height }
                }
            };
        }
        console.log(`🖼️ Optimizing image: ${Math.round(originalSize)}KB → target ${targetSizeKB}KB`);
        // Get image metadata
        const metadata = await sharp(imageBuffer).metadata();
        // Calculate optimal dimensions
        const { width, height } = this.calculateOptimalDimensions(metadata.width, metadata.height, maxDimension);
        // Try different quality levels until we hit target size
        let quality = 80;
        let compressedBuffer = imageBuffer;
        let compressedSize = originalSize;
        for (let attempt = 0; attempt < 5; attempt++) {
            compressedBuffer = await this.compressImage(imageBuffer, width, height, quality);
            compressedSize = this.getImageSizeKB(compressedBuffer);
            console.log(`🔄 Attempt ${attempt + 1}: Quality ${quality}% → ${Math.round(compressedSize)}KB`);
            if (compressedSize <= targetSizeKB) {
                break;
            }
            // Reduce quality for next attempt
            quality = Math.round(quality * 0.8);
        }
        const compressionRatio = originalSize / compressedSize;
        console.log(`✅ Image optimization complete: ${Math.round(compressionRatio * 100)}% compression`);
        return {
            buffer: compressedBuffer,
            optimization: {
                originalSize,
                compressedSize,
                compressionRatio,
                quality: quality,
                dimensions: { width, height }
            }
        };
    }
    static async optimizeForQuestionType(imageBuffer, questionType) {
        // Different optimization strategies based on question type
        const strategies = {
            text_extraction: { targetSize: 1200, maxDimension: 1536, quality: 90 }, // High quality for OCR
            code_analysis: { targetSize: 1000, maxDimension: 1280, quality: 85 }, // Good quality for code
            ui_analysis: { targetSize: 800, maxDimension: 1024, quality: 80 }, // Balanced for UI
            data_analysis: { targetSize: 1000, maxDimension: 1280, quality: 85 }, // Good for charts
            general: { targetSize: 600, maxDimension: 800, quality: 75 } // Smaller for general use
        };
        const strategy = strategies[questionType] || strategies.general;
        console.log(`🎯 Using ${questionType} optimization strategy:`, strategy);
        return this.optimizeForAI(imageBuffer, strategy.targetSize, strategy.maxDimension);
    }
    static getImageSizeKB(buffer) {
        return buffer.length / 1024;
    }
    static calculateOptimalDimensions(originalWidth, originalHeight, maxDimension) {
        if (originalWidth <= maxDimension && originalHeight <= maxDimension) {
            return { width: originalWidth, height: originalHeight };
        }
        const aspectRatio = originalWidth / originalHeight;
        if (originalWidth > originalHeight) {
            return {
                width: maxDimension,
                height: Math.round(maxDimension / aspectRatio)
            };
        }
        else {
            return {
                width: Math.round(maxDimension * aspectRatio),
                height: maxDimension
            };
        }
    }
    static async compressImage(imageBuffer, width, height, quality) {
        return await sharp(imageBuffer)
            .resize(width, height, {
            kernel: sharp.kernel.lanczos3,
            withoutEnlargement: true
        })
            .jpeg({ quality, progressive: true })
            .toBuffer();
    }
    // Convert buffer to base64 data URL
    static bufferToDataUrl(buffer, format = 'jpeg') {
        const base64 = buffer.toString('base64');
        return `data:image/${format};base64,${base64}`;
    }
    // Convert base64 data URL to buffer
    static dataUrlToBuffer(dataUrl) {
        const base64Data = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
        return Buffer.from(base64Data, 'base64');
    }
    // Quick image info utility
    static async getImageInfo(buffer) {
        const metadata = await sharp(buffer).metadata();
        return {
            sizeKB: this.getImageSizeKB(buffer),
            format: metadata.format,
            dimensions: {
                width: metadata.width,
                height: metadata.height
            }
        };
    }
}
export { ImageOptimizer };

export class ImageOptimizer {
    static optimizeForAI(imageBuffer: any, targetSizeKB?: number, maxDimension?: number): Promise<{
        buffer: any;
        optimization: {
            originalSize: number;
            compressedSize: number;
            compressionRatio: number;
            quality: number;
            dimensions: {
                width: any;
                height: any;
            };
        };
    }>;
    static optimizeForQuestionType(imageBuffer: any, questionType: any): Promise<{
        buffer: any;
        optimization: {
            originalSize: number;
            compressedSize: number;
            compressionRatio: number;
            quality: number;
            dimensions: {
                width: any;
                height: any;
            };
        };
    }>;
    static getImageSizeKB(buffer: any): number;
    static calculateOptimalDimensions(originalWidth: any, originalHeight: any, maxDimension: any): {
        width: any;
        height: any;
    };
    static compressImage(imageBuffer: any, width: any, height: any, quality: any): Promise<Buffer<ArrayBufferLike>>;
    static bufferToDataUrl(buffer: any, format?: string): string;
    static dataUrlToBuffer(dataUrl: any): Buffer<ArrayBuffer>;
    static getImageInfo(buffer: any): Promise<{
        sizeKB: number;
        format: keyof sharp.FormatEnum | undefined;
        dimensions: {
            width: number | undefined;
            height: number | undefined;
        };
    }>;
}
import sharp from 'sharp';

/**
 * Base class for SSR system
 */
export class NativeBuildSystem {
    constructor() {
        this.config = {
            outputDir: 'dist',
            publicPath: '/',
            assetDir: 'assets'
        };
    }
    
    build() {
        console.log('Building...');
    }
}

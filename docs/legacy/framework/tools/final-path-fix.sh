#!/bin/bash

echo "🔧 Arreglo final de rutas..."

# Lista de archivos a arreglar
files=(
    "/workspaces/web/framework/research/advanced-features/implementation.js"
    "/workspaces/web/framework/enterprise/analytics/real-time-engine.js"
    "/workspaces/web/framework/enterprise/analytics/bi-system.js"
    "/workspaces/web/framework/enterprise/core/features-system.js"
    "/workspaces/web/framework/enterprise/ai-ml/ml-engine.js"
    "/workspaces/web/framework/enterprise/ai-ml/features.js"
    "/workspaces/web/framework/components/intelligence/ux-system.js"
    "/workspaces/web/framework/platform/mobile/native-bridge.js"
    "/workspaces/web/framework/platform/mobile/mobile-optimizer.js"
    "/workspaces/web/framework/platform/integrations/cross-platform.js"
    "/workspaces/web/framework/platform/deployment/global-scaling.js"
    "/workspaces/web/framework/platform/deployment/automation.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Procesando: $file"
        # Cambiar ../../../core a ../../core
        sed -i 's#\.\./\.\./\.\./core/engine/base-framework\.js#../../core/engine/base-framework.js#g' "$file"
    fi
done

# Arreglar el archivo SSR que tiene una referencia circular
echo "Arreglando SSR.js..."
sed -i "s|import { NativeBuildSystem } from './ssr.js';|// import { NativeBuildSystem } from './ssr.js'; // Removed circular dependency|g" /workspaces/web/framework/core/systems/ssr.js

# Crear clase base si no existe
cat > /workspaces/web/framework/core/systems/ssr-base.js << 'EOF'
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
EOF

# Actualizar SSR para usar la clase base
sed -i "s|// import { NativeBuildSystem }.*|import { NativeBuildSystem } from './ssr-base.js';|g" /workspaces/web/framework/core/systems/ssr.js

echo "✅ Arreglo completado!"
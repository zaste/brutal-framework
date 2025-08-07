#!/bin/bash

echo "🔧 Arreglando imports rotos en el framework..."

# Función para arreglar imports en un archivo
fix_file_imports() {
    local file=$1
    echo "  Procesando: $file"
    
    # Arreglar missing-base-framework.cjs
    sed -i "s|require('./missing-base-framework.cjs')|require('../core/engine/base-framework.js')|g" "$file"
    sed -i "s|require('../missing-base-framework.cjs')|require('../core/engine/base-framework.js')|g" "$file"
    sed -i "s|require('../../missing-base-framework.cjs')|require('../../core/engine/base-framework.js')|g" "$file"
    sed -i "s|require('../../../missing-base-framework.cjs')|require('../../../core/engine/base-framework.js')|g" "$file"
    
    # Convertir require a import para base-framework
    sed -i "s|const { BaseFramework } = require('\(.*\)/base-framework.js');|import { BaseFramework } from '\1/base-framework.js';|g" "$file"
    
    # Arreglar otras referencias rotas
    sed -i "s|require('./advanced-shadow-optimizer.cjs')|require('./shadow-optimizer-v2.js')|g" "$file"
    sed -i "s|require('./native-build-system.cjs')|require('../systems/ssr.js')|g" "$file"
    sed -i "s|require('./event-handling-optimizer.cjs')|require('../core/performance/events.js')|g" "$file"
    sed -i "s|require('./native-ssr-system.cjs')|require('../core/systems/ssr.js')|g" "$file"
    
    # Convertir todos los require() a import
    sed -i "s|const { \(.*\) } = require('\(.*\)');|import { \1 } from '\2';|g" "$file"
    sed -i "s|const \(.*\) = require('\(.*\)');|import \1 from '\2';|g" "$file"
    
    # Convertir module.exports a export
    sed -i "s|module\.exports = {|export {|g" "$file"
    sed -i "s|module\.exports = \(.*\);|export default \1;|g" "$file"
}

# Encontrar todos los archivos con referencias rotas
echo "🔍 Buscando archivos con imports rotos..."

# Arreglar archivos con missing-base-framework.cjs
files_with_missing=$(grep -r "missing-base-framework\.cjs" /workspaces/web/framework --include="*.js" -l 2>/dev/null)

echo "📝 Encontrados $(echo "$files_with_missing" | wc -l) archivos con referencias a missing-base-framework.cjs"

for file in $files_with_missing; do
    fix_file_imports "$file"
done

# Arreglar archivos con otros imports rotos
echo -e "\n🔍 Buscando otros imports rotos..."

# Buscar archivos con require() restantes
files_with_require=$(grep -r "require(" /workspaces/web/framework --include="*.js" -l 2>/dev/null | grep -v node_modules)

echo "📝 Encontrados $(echo "$files_with_require" | wc -l) archivos con require()"

for file in $files_with_require; do
    fix_file_imports "$file"
done

echo -e "\n✅ Arreglo de imports completado!"
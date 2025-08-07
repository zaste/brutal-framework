#!/bin/bash

echo "🔧 Arreglando últimas referencias .cjs..."

# Enterprise modules
sed -i "s|import { SecurityFramework } from './security-framework.cjs';|import { SecurityFramework } from '../security/framework.js';|g" /workspaces/web/framework/enterprise/analytics/monitoring.js

sed -i "s|import { NativeTestingInfrastructure } from './native-testing-infrastructure.cjs';|import { NativeTestingInfrastructure } from '../../tools/testing/infrastructure.js';|g" /workspaces/web/framework/enterprise/security/framework.js

sed -i "s|import { MonitoringAnalytics } from './monitoring-analytics.cjs';|import { MonitoringAnalytics } from '../analytics/monitoring.js';|g" /workspaces/web/framework/enterprise/deployment/system.js

sed -i "s|import { CoreAPIIntegrationLayer } from './core-api-integration-layer.cjs';|import { CoreAPIIntegrationLayer } from '../../platform/integrations/core-api-layer.js';|g" /workspaces/web/framework/tools/testing/infrastructure.js

# Buscar más referencias problemáticas
echo "Buscando referencias a archivos inexistentes..."

# Arreglar referencias a TemplateOptimizer
find /workspaces/web/framework -name "*.js" -type f -not -path "*/node_modules/*" -exec sed -i 's|import { TemplateOptimizer } from '\''\.\/template-optimizer\.cjs'\'';|import { TemplateOptimizer } from '\''./templates.js'\'';|g' {} \;

# Arreglar referencias a EventHandlingOptimizer  
find /workspaces/web/framework -name "*.js" -type f -not -path "*/node_modules/*" -exec sed -i 's|import { EventHandlingOptimizer } from '\''\.\/event-handling-optimizer\.cjs'\'';|import { EventHandlingOptimizer } from '\''./events.js'\'';|g' {} \;

# Arreglar referencias a CSSStyleOptimizer
find /workspaces/web/framework -name "*.js" -type f -not -path "*/node_modules/*" -exec sed -i 's|import { CSSStyleOptimizer } from '\''\.\/css-styling-optimizer\.cjs'\'';|import { CSSStyleOptimizer } from '\''./style.js'\'';|g' {} \;

echo "✅ Arreglo completado!"
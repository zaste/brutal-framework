#!/bin/bash

# Fix Registry.js
sed -i '1i import { BRUTAL_EVENTS, emitBrutalEvent } from '\''./events.js'\'';' 01-core/Registry.js
sed -i 's/new CustomEvent('\''brutal:component-registered'\''/emitBrutalEvent(window, BRUTAL_EVENTS.COMPONENT_REGISTERED/g' 01-core/Registry.js
sed -i '/emitBrutalEvent(window, BRUTAL_EVENTS.COMPONENT_REGISTERED/{s/detail: {/{/; s/}),$/});/}' 01-core/Registry.js

# Fix ComponentMonitor.js
sed -i '1i import { BRUTAL_EVENTS, emitBrutalEvent } from '\''../../01-core/events.js'\'';' 03-visual/debug/ComponentMonitor.js
sed -i 's/new CustomEvent('\''brutal:slow-render'\''/emitBrutalEvent(component, BRUTAL_EVENTS.SLOW_RENDER/g' 03-visual/debug/ComponentMonitor.js
sed -i 's/new CustomEvent('\''brutal:memory-pressure'\''/emitBrutalEvent(window, BRUTAL_EVENTS.MEMORY_PRESSURE/g' 03-visual/debug/ComponentMonitor.js

# Fix AutomatedVisualTester.js
sed -i '1i import { BRUTAL_EVENTS, emitBrutalEvent } from '\''../../01-core/events.js'\'';' 03-visual/debug/AutomatedVisualTester.js
sed -i 's/new CustomEvent('\''brutal:visual-test-complete'\''/emitBrutalEvent(window, BRUTAL_EVENTS.VISUAL_TEST_COMPLETE/g' 03-visual/debug/AutomatedVisualTester.js

# Fix BrutalComponent.js
sed -i '1i import { BRUTAL_EVENTS, emitBrutalEvent } from '\''../../01-core/events.js'\'';' 04-components/base/BrutalComponent.js
sed -i 's/new CustomEvent('\''brutal:component-render'\''/emitBrutalEvent(this, BRUTAL_EVENTS.RENDER/g' 04-components/base/BrutalComponent.js

echo "Event dispatch fixes applied!"
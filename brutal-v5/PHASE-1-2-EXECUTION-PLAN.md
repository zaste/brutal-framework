# 📅 Plan de Ejecución V5 - Fases 1 y 2

> Basado en las decisiones arquitectónicas probadas y las lecciones aprendidas de V3/V4

## 🎯 Fase 1: Core Foundation (Semanas 1-2)

### Objetivo
Núcleo brutal < 30KB que renderice con router y estado reactivo, sin deuda técnica.

### ✅ Incluye

#### Paquetes Core (36KB total):
```
@brutal/foundation    6KB  → Registry, Config, Constants, EnvProfiles
@brutal/shared        4KB  → Utils, Sanitizers, Errors, Type guards
@brutal/events        5KB  → EventEmitter, EventBus, Delegation
@brutal/templates     7KB  → Template engine, Virtual DOM lite
@brutal/components    8KB  → BrutalComponent, Lifecycle, ErrorBoundary
@brutal/state         6KB  → ReactiveState, Computed, Watchers
```

#### Build Setup:
- **Rollup único** para bundling (decisión #1)
- **Vite dev-server** oficial (decisión #2)
- **Plugins compartidos** Rollup/Vite (decisión #3)
- **TypeScript estricto** + DTS generation (decisión #11)
- **Separación runtime/build** (decisión #4)

#### Features Core:
- ✅ Registry pattern para extensibilidad
- ✅ Template engine con sanitización
- ✅ Component system con lifecycle completo
- ✅ Estado reactivo con computed/watchers
- ✅ Event system unificado
- ✅ Error boundaries básicos
- ✅ Dev/Prod environment profiles

### ❌ NO Incluye (y por qué)

```typescript
// Movido a @brutal/concurrency (Fase 3+)
❌ Float64Atomics 
❌ SharedArrayBuffer
❌ Worker abstractions

// Movido a @brutal/a11y (Fase 3)
❌ KeyboardNav global
❌ Hotkeys system
❌ ARIA automation

// Separado en legacy-polyfills opcional
❌ IE11 polyfills
❌ Legacy event shims
❌ Old browser hacks

// Plugins dev opcionales (Fase 4)
❌ OmniHook system
❌ Telemetry runtime
❌ Meta-decorators

// Performance layer (Fase 3+)
❌ GPU abstractions
❌ Worker pools
❌ Performance gems
```

## 🔧 Fase 2: Build & Quality Toolchain (Semanas 3-4)

### Objetivo
Core irreprochable: bundles limpios, CI verde, seguridad y performance blindados.

### ✅ Incluye

#### Build Tools Package:
```typescript
// packages/@brutal/build-tools/
ExtractorPlugin      → Tests fuera del bundle (decisión #6)
PerfBudgetPlugin     → Size/TTI gates (decisión #7)
SchemaValidator      → Valida plugin contracts
SecurityLintPlugin   → XSS/eval prevention (decisión #8)
```

#### CI/CD Setup:
```yaml
.github/workflows/
├── ci.yml           → lint, test, build, type-check
├── performance.yml  → budget gates, benchmarks
├── security.yml     → CodeQL + dependency audit
└── release.yml      → Changesets automation
```

#### Quality Gates:
- ✅ **Husky pre-commit** (decisión #10)
  - ESLint + Prettier
  - Unit tests affected
  - Type checking
- ✅ **Performance budgets** en package.json
  - Max size per bundle
  - Max init time
  - Max memory usage
- ✅ **Security lint** desarrollo + CI
- ✅ **Monorepo changesets** (decisión #9)

#### Testing Infrastructure:
```
- Jest + ts-jest configurado
- Playwright para smoke tests
- Performance benchmarks base
- Cross-browser matrix básica
```

### ❌ NO Incluye (diferido)

```typescript
// Auto-docs (Fase 3)
❌ TypeDoc generation
❌ API extractor
❌ Storybook setup

// Advanced build (Fase 4)
❌ SSR/hydration
❌ i18n code splitting  
❌ Service worker assets
❌ Micro-frontend helpers

// Alternative bundlers
❌ Webpack configs
❌ esbuild setup
❌ Parcel support
```

## 📊 Métricas de Éxito

### Fase 1 ✓
- [ ] Core < 30KB gzipped total
- [ ] Hello World renderiza < 50ms
- [ ] 100% test coverage core
- [ ] Zero runtime dependencies
- [ ] TypeScript strict mode clean

### Fase 2 ✓
- [ ] CI pipeline < 3 min
- [ ] Bundle size regresión = 0
- [ ] Security vulnerabilities = 0
- [ ] Todos los budgets en verde
- [ ] Release automation funcionando

## 🚀 Comandos de Validación

```bash
# Fase 1 - Verificar core
pnpm build:core
pnpm test:core --coverage
pnpm size:check

# Fase 2 - Verificar toolchain
pnpm lint:all
pnpm security:check
pnpm perf:baseline
pnpm release:dry-run
```

## 📝 Decisiones Clave Aplicadas

1. **Rollup único** → Bundles óptimos desde día 1
2. **Vite dev** → DX excepcional sin complejidad
3. **Plugins compartidos** → Consistencia build/dev
4. **Runtime puro** → Sin contaminación de tooling
5. **Polyfill mínimo** → Evergreen por defecto
6. **Test extraction** → Bundles limpios garantizados
7. **Budget gates** → Performance protegida
8. **Security first** → Vulnerabilidades prevenidas
9. **Monorepo granular** → Releases independientes
10. **Automation máxima** → Calidad sin fricción

---

**Siguiente paso**: Implementar Fase 1 con el foundation package funcional.
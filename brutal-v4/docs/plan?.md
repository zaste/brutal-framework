El Plan Completo de BRUTAL V4:

  📅 Timeline Total: ~1.5 meses

  ✅ Pre-Phase 2 (4 días) - COMPLETADO

  - Core foundation con zero memory leaks
  - Sistema modular (<400 líneas por archivo)
  - RAF batching, WeakMaps, Workers
  - Modern APIs integration

  🔄 BRUTAL Test V4 (2 días) - EN PROGRESO

  - Day 1: ✅ Sistema base de testing simbiótico
  - Day 2: ⏳ Dashboard, reporters, CLI, migración completa

  📊 Phase 2: Performance Layer (5 días) - SIGUIENTE

  Migrar los 10 "performance gems" de V3:
  1. StyleManager - Zero-parse styling
  2. FragmentPool - DOM reuse
  3. DOMScheduler - Batched operations
  4. TemplateCache
  5. EventManager
  6. ThemeEngine
  7. LayoutOptimizer
  8. AnimationSystem
  9. GestureSystem
  10. ThemeSystem

  🔧 Phase 3: Component Migration (3 semanas)

  - 99+ componentes de V3 → V4
  - Mantener paridad exacta de features
  - Añadir optimizaciones V4
  - Sistema incremental

  🎨 Phase 4: Visual & Workers (1 semana)

  - GPU acceleration (WebGPU→WebGL→Canvas)
  - Particle systems (1M+ particles @ 60fps)
  - Visual debugging (3D visualization)
  - Multi-threaded architecture

  ✔️ Phase 5: Testing & Validation (1 semana)

  - Suite completa de validación
  - Performance benchmarking
  - Cross-browser testing
  - Enterprise readiness

  🎯 Objetivo Final:

  Framework 100% nativo que demuestra que no necesitas React/Vue/Angular para construir aplicaciones web sofisticadas y de alto rendimiento.

  Métricas objetivo:
  - 81% reducción en bundle size
  - 40% reducción en memoria
  - 67% más rápido en carga inicial
  - 33% mejora en FPS

  Estamos al final del test system (parte pequeña), pero el proyecto completo es mucho más ambicioso - una reimaginación total del framework usando solo web standards nativos.


  # Arquitectura Definitiva BRUTAL V4 (Sin Omisiones)

A continuación la **única**, **completa** y **coherente** arquitectura de BRUTAL V4, con **todas** las capacidades, **cada** módulo/fichero, su **descripción** y sus **dependencias** mínimas. Incluye runtime, dev‐only, experimental, enterprise y ecosistema (extra!).

---

## 1. Core Foundation (runtime, ≈15 KB gzip)

| Fichero                    | Descripción                                                     | Depende de |
| -------------------------- | --------------------------------------------------------------- | ---------- |
| `core/BrutalComponent.js`  | Base de Custom Elements + Shadow DOM                            | —          |
| `core/BrutalState.js`      | Reactividad (Proxy + snapshots), soporte SAB & Float64Atomics   | —          |
| `core/RenderScheduler.js`  | Batching RAF + requestIdleCallback                              | —          |
| `core/BrutalRouter.js`     | SPA router (History API, hash, prefetch, middlewares, cache)    | —          |
| `core/PolyfillStrategy.js` | Carga condicional de polyfills ES/CSS                           | —          |
| `core/FocusVisible.js`     | Polyfill `:focus-visible`                                       | —          |
| `core/CacheManager.js`     | Caché unificado (memoria L1, IndexedDB L2, SW L3)               | —          |
| `core/ErrorGuard.js`       | ErrorBoundary + UnhandledRejectionHook                          | —          |
| `core/PluginManager.js`    | Registro de plugins/hooks de ciclo de vida & extensiones        | —          |
| `core/VersionManager.js`   | Enforcement Semantic Versioning + changelog auto (Conventional) | —          |

---

## 2. Security Layer (runtime + build)

| Fichero                          | Descripción                                           | Depende de               |
| -------------------------------- | ----------------------------------------------------- | ------------------------ |
| `security/CSPGenerator.js`       | Genera políticas CSP dinámicas                        | core/PolyfillStrategy.js |
| `security/TrustedTypes.js`       | Enforce Trusted Types API                             | —                        |
| `security/DOMSanitizer.js`       | Sanitizador HTML (equiv. DOMPurify)                   | —                        |
| `security/CSRFHelper.js`         | Genera/valida tokens CSRF                             | core/BrutalRouter.js     |
| `security/PermissionsPolicy.js`  | Cabeceras Permissions-Policy                          | —                        |
| `security/CryptoHelpers.js`      | Wrappers Web Crypto API (hash, HMAC, randomUUID)      | —                        |
| `security/AuthBase.js`           | Autenticación/Autorización base                       | —                        |
| `security/SecureContextGuard.js` | Bloquea ejecución en contextos no seguros             | —                        |
| `security/SRIHelper.js`          | Añade Subresource Integrity a assets (build)          | build/BrutalOptimizer.js |
| `security/DepScanner.js`         | Escanea dependencias (npm audit) en CI                | —                        |
| `security/PolicyEnforcer.js`     | Aplica reglas definidas en `policy.yaml` (pre-commit) | —                        |

---

## 3. Accessibility (WCAG AA, runtime + dev-only)

| Fichero                          | Descripción                                      | Depende de                |
| -------------------------------- | ------------------------------------------------ | ------------------------- |
| `a11y/FocusTrap.js`              | Mantiene foco dentro de modales/dialogs          | core/BrutalComponent.js   |
| `a11y/LiveRegion.js`             | Manejo de `aria-live`                            | core/RenderScheduler.js   |
| `a11y/ScreenReaderUtils.js`      | API para emitir mensajes a lectores              | —                         |
| `a11y/SkipNavGenerator.js`       | Inserta enlaces “Saltar a contenido”             | —                         |
| `a11y/LandmarkRoles.js`          | Asigna roles ARIA básicos                        | —                         |
| `a11y/HighContrastMode.js`       | Detecta/aplica modo alto contraste               | perf/ThemeEngine.js       |
| `a11y/ReducedMotionToggle.js`    | Respeta `prefers-reduced-motion` + toggle manual | perf/AnimationSystem.js   |
| `a11y/KeyboardShortcuts.js`      | Registro global de atajos de teclado             | core/EventManager.js      |
| `a11y/ColorContrastValidator.js` | Herramienta dev: valida contraste de color       | dev-only                  |
| `a11y/AxeSmokeTest.js`           | Pruebas automáticas con axe-core                 | test/BrowserController.js |

---

## 4. Internationalization (runtime + dev-only)

| Fichero                     | Descripción                                        | Depende de       |
| --------------------------- | -------------------------------------------------- | ---------------- |
| `i18n/I18nCore.js`          | Mensajes ICU, plurales, formateo de fechas/números | —                |
| `i18n/AsyncLocaleLoader.js` | Carga dinámica de archivos JSON de idioma          | i18n/I18nCore.js |
| `i18n/RTLAutoFlip.js`       | Ajustes de layout y estilos para RTL               | i18n/I18nCore.js |
| `i18n/PluralRules.js`       | Helper explícito para reglas plurales              | i18n/I18nCore.js |
| `i18n/LocaleExtractor.js`   | Extrae cadenas `t('key')` a `.pot` (CLI dev-only)  | —                |

---

## 5. Build & Bundling (dev-only)

| Fichero                      | Descripción                                       | Depende de             |
| ---------------------------- | ------------------------------------------------- | ---------------------- |
| `build/rollup.config.js`     | Config Rollup: tree-shake, code-split             | core                   |
| `build/BrutalOptimizer.js`   | Minify JS/CSS, CSS-extract, purga, asset pipeline | build/rollup.config.js |
| `build/ExtractorPlugin.js`   | Extrae tests co-localizados                       | build/rollup.config.js |
| `build/SSGPlugin.js`         | Genera sitio estático (SSG)                       | build/rollup.config.js |
| `build/HMRPlugin.js`         | Hot Module Replacement para `brutal dev`          | build/rollup.config.js |
| `build/SourceMapUploader.js` | Sube sourcemaps a Sentry/OTel                     | build/rollup.config.js |
| `build/VersionBumper.js`     | Bump de versión semántica + changelog auto        | core/VersionManager.js |

---

## 6. PWA & Offline (runtime)

| Fichero                       | Descripción                                         | Depende de                  |
| ----------------------------- | --------------------------------------------------- | --------------------------- |
| `pwa/ServiceWorkerManager.js` | Registro/actualización SW, precache + runtime cache | build/BrutalOptimizer.js    |
| `pwa/SWCache.js`              | Estrategias cache-first / network-first             | pwa/ServiceWorkerManager.js |
| `pwa/manifest.json`           | Generador de manifest.json                          | —                           |
| `pwa/AppShellGenerator.js`    | Crea HTML shell minimalista                         | seo/SSREngine.js            |
| `pwa/InstallPrompt.js`        | Control “Add to Home Screen”                        | pwa/ServiceWorkerManager.js |
| `pwa/SWBackgroundSync.js`     | Cola offline de POST + retry                        | pwa/ServiceWorkerManager.js |
| `pwa/PushNotifications.js`    | Abstracción Web Push API                            | pwa/ServiceWorkerManager.js |
| `pwa/OfflineUIStubs.js`       | Placeholders UI para estado offline                 | core/BrutalComponent.js     |

---

## 7. SEO / SSR / SSG

| Fichero                     | Descripción                                               | Depende de                                       |
| --------------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| `seo/MetaManager.js`        | Inyección runtime de `<meta>`, OG, Twitter cards, JSON-LD | —                                                |
| `seo/SitemapGenerator.js`   | Genera `sitemap.xml` (dev-only)                           | dev-only                                         |
| `seo/SSREngine.js`          | SSR streaming + Islands (hydration parcial)               | core/RenderScheduler.js,<br>core/BrutalRouter.js |
| `seo/HydrationEngine.js`    | Control de hidratación client-side                        | seo/SSREngine.js                                 |
| `seo/SSGTool.js`            | CLI dev-only: `brutal build --static`                     | build/SSGPlugin.js                               |
| `seo/RobotsTxtGenerator.js` | Genera `robots.txt`                                       | dev-only                                         |

---

## 8. Advanced Routing

| Fichero                        | Descripción                                     | Depende de                                      |
| ------------------------------ | ----------------------------------------------- | ----------------------------------------------- |
| `routing/RouteGuards.js`       | `canActivate`/`canDeactivate` hooks             | core/BrutalRouter.js                            |
| `routing/LazyRoutes.js`        | Dynamic import por ruta                         | build/rollup.config.js,<br>core/BrutalRouter.js |
| `routing/NestedRoutes.js`      | Rutas anidadas                                  | core/BrutalRouter.js                            |
| `routing/RouteTransitions.js`  | Animaciones entre rutas (AnimationSystem)       | perf/AnimationSystem.js                         |
| `routing/BreadcrumbBuilder.js` | Migas de pan dinámicas                          | core/BrutalRouter.js                            |
| `routing/QueryParamsAPI.js`    | API suscripción a cambios de query params       | core/BrutalRouter.js                            |
| `routing/RoutePreloader.js`    | Prefetch de datos antes de navegación           | core/CacheManager.js                            |
| `routing/ScrollRestoration.js` | Restauración automática de scroll en navegación | core/RenderScheduler.js                         |

---

## 9. Data & Forms (runtime + dev-only)

| Fichero                          | Descripción                                                       | Depende de                                        |
| -------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------- |
| `data/VirtualScroll.js`          | Virtualización listas (FragmentPool + IOObserver)                 | perf/FragmentPool.js                              |
| `data/DataComponentBase.js`      | Base para componentes data-bound (sorting, filtering, pagination) | core/BrutalComponent.js                           |
| `data/List.js` / `data/Table.js` | Componentes de display simples                                    | data/DataComponentBase.js                         |
| `data/DataGrid.js`               | Grid editable + 100k filas (WorkerPool)                           | data/VirtualScroll.js,<br>workers/WorkerPool.js   |
| `forms/FormState.js`             | Estado formularios (dirty, touched, pristine)                     | core/BrutalState.js                               |
| `forms/ValidationEngine.js`      | Validación síncrona/asíncrona, cross-field                        | forms/FormState.js                                |
| `forms/FieldArray.js`            | Grupos dinámicos de campos                                        | forms/FormState.js                                |
| `forms/ConditionalFields.js`     | Render condicional de campos                                      | forms/FormState.js                                |
| `forms/FileUploadHandler.js`     | Subida de ficheros con progreso                                   | core/BrutalComponent.js                           |
| `data/StorageAbstraction.js`     | Abstracción localStorage/IndexedDB/sessionStorage                 | —                                                 |
| `data/StatePersistence.js`       | Auto-save estado en localStorage/IDX                              | data/StorageAbstraction.js,<br>forms/FormState.js |
| `data/SyncManager.js`            | Sincronización multi-tab/SW                                       | core/CacheManager.js                              |
| `data/QuotaManager.js`           | Monitoriza y notifica sobre límites de almacenamiento             | data/StorageAbstraction.js                        |
| `forms/Middleware.js`            | Middlewares de estado (logging, debounce, etc.)                   | core/BrutalState.js                               |
| `forms/ComputedProps.js`         | Propiedades computadas explícitas                                 | core/BrutalState.js                               |
| `forms/TimeTravel.js`            | Time-travel debugging (dev-only)                                  | tooling/StateDebugger.js                          |
| `forms/ErrorMapper.js`           | Mapea errores backend → errores de campo                          | forms/ValidationEngine.js                         |

---

## 10. Concurrency & Workers

| Fichero                             | Descripción                                         | Depende de                       |
| ----------------------------------- | --------------------------------------------------- | -------------------------------- |
| `workers/WorkerPool.js`             | Gestión dinámica de hilos                           | build/rollup.config.js           |
| `workers/MessageBroker.js`          | Bus tipado Rx-like                                  | core/BrutalComponent.js          |
| `workers/SharedArrayBufferUtil.js`  | Helpers SAB + Float64Atomics                        | core/PolyfillStrategy.js         |
| `workers/ComputeWorker.js`          | Worker para cálculos intensivos                     | workers/WorkerPool.js            |
| `workers/DataWorker.js`             | Preprocesado de datos                               | workers/WorkerPool.js            |
| `workers/AtomicState.js`            | Estado compartido atómico                           | workers/SharedArrayBufferUtil.js |
| `workers/LockFreeQueue.js`          | Cola FIFO sin bloqueos                              | workers/SharedArrayBufferUtil.js |
| `workers/SharedCounter.js`          | Contadores atómicos                                 | workers/SharedArrayBufferUtil.js |
| `workers/MLWorker.js`               | Inferencia ML (TF.js o similar)                     | workers/WorkerPool.js            |
| `workers/CryptoWorker.js`           | Worker para operaciones criptográficas              | workers/WorkerPool.js            |
| `workers/CompressionWorker.js`      | Worker de compresión/descompresión                  | workers/WorkerPool.js            |
| `workers/ImageWorker.js`            | Procesamiento de imágenes (resize, filters)         | workers/WorkerPool.js            |
| `workers/HealthMonitor.js`          | Heartbeat + latencia de cada worker                 | workers/WorkerPool.js            |
| `workers/PriorityQueue.js`          | Cola de tareas con prioridades                      | —                                |
| `workers/BackpressureController.js` | Regula envío de mensajes según carga del consumidor | workers/MessageBroker.js         |

---

## 11. GPU & Visualization

| Fichero                   | Descripción                                          | Depende de               |
| ------------------------- | ---------------------------------------------------- | ------------------------ |
| `gpu/GPUDetector.js`      | Detecta WebGPU → WebGL2 → WebGL1 → Canvas2D contexts | core/PolyfillStrategy.js |
| `gpu/WebGLRenderer.js`    | Render GLSL pipelines                                | gpu/GPUDetector.js       |
| `gpu/Canvas2DFallback.js` | Fallback Canvas 2D                                   | gpu/GPUDetector.js       |
| `gpu/ShaderLibrary.js`    | Shaders básicos                                      | build/BrutalOptimizer.js |
| `gpu/EffectsLibrary.js`   | Efectos (blur, glow, partículas)                     | gpu/WebGLRenderer.js     |
| `gpu/TransitionEngine.js` | Animaciones GPU-powered                              | perf/AnimationSystem.js  |
| `visual/Charts.js`        | Charts interactivos                                  | gpu/ShaderLibrary.js     |
| `visual/HeatMap.js`       | Mapas de calor                                       | gpu/ShaderLibrary.js     |
| `visual/Timeline.js`      | Línea de tiempo Canvas/WebGL                         | gpu/ShaderLibrary.js     |
| `visual/ProgressBar.js`   | Barras de progreso animadas                          | perf/AnimationSystem.js  |
| `gpu/ResourcePool.js`     | Reuso de texturas/buffers                            | gpu/WebGLRenderer.js     |
| `gpu/ShaderCompiler.js`   | Compila shaders en runtime con hot-reload (dev-only) | gpu/ShaderLibrary.js     |
| `gpu/DebugInspector.js`   | Inspector de estados WebGL/WebGPU (dev-only)         | gpu/WebGLRenderer.js     |

---

## 12. Real-Time & Networking

| Fichero                          | Descripción                                          | Depende de                    |
| -------------------------------- | ---------------------------------------------------- | ----------------------------- |
| `network/HttpClient.js`          | Abstracción fetch con interceptors, timeout, retries | —                             |
| `network/RestClient.js`          | Helpers REST (get/post/put/delete)                   | network/HttpClient.js         |
| `network/GraphQLClient.js`       | Cliente GraphQL                                      | network/HttpClient.js         |
| `network/RequestInterceptors.js` | Middleware HTTP                                      | network/HttpClient.js         |
| `network/ResponseCaching.js`     | Cache smart de respuestas                            | core/CacheManager.js          |
| `network/RetryLogic.js`          | Retry automáticos con backoff                        | network/HttpClient.js         |
| `realtime/WebSocketManager.js`   | Abstracción WS + reconexión                          | —                             |
| `realtime/SSEManager.js`         | Wrapper SSE                                          | —                             |
| `realtime/FailoverManager.js`    | Fallback WS ↔ SSE ↔ polling                          | realtime/WebSocketManager.js  |
| `realtime/RealtimeStateSync.js`  | Sincronización optimista + CRDT                      | realtime/WebSocketManager.js  |
| `realtime/PresenceSystem.js`     | Gestión usuarios online / cursores                   | realtime/RealtimeStateSync.js |
| `realtime/OfflineQueue.js`       | Cola acciones offline → replay                       | core/CacheManager.js          |
| `network/TracingIntegration.js`  | Inyecta spans de red en distributed tracing          | obs/DistributedTracing.js     |

---

## 13. Performance Layer (runtime)

| Fichero                    | Descripción                                      | Depende de              |
| -------------------------- | ------------------------------------------------ | ----------------------- |
| `perf/DOMScheduler.js`     | Batching DOM 60 fps                              | core/RenderScheduler.js |
| `perf/FragmentPool.js`     | Pool de DocumentFragment                         | core/BrutalComponent.js |
| `perf/TemplateCache.js`    | Cache plantillas por hash                        | core/BrutalRouter.js    |
| `perf/EventManager.js`     | Delegación global de eventos                     | core/BrutalComponent.js |
| `perf/StyleManager.js`     | Inyección deduplicada de CSS                     | —                       |
| `perf/ThemeEngine.js`      | Theming dinámico (vars, dark-mode)               | perf/StyleManager.js    |
| `perf/LayoutOptimizer.js`  | Previene layout thrashing; container queries     | core/BrutalComponent.js |
| `perf/AnimationSystem.js`  | Web Animations + spring physics                  | perf/DOMScheduler.js    |
| `perf/GestureSystem.js`    | Gestos unificados (touch/mouse/pointer)          | perf/AnimationSystem.js |
| `perf/ResourceHints.js`    | Inserta preload/prefetch/preconnect              | core/RenderScheduler.js |
| `perf/RenderStrategy.js`   | CSR vs SSR vs streaming por componente           | perf/FragmentPool.js    |
| `perf/BenchmarkHarness.js` | Ejecución de benchmarks CI + grabado de métricas | perf/ResourceHints.js   |

---

## 14. UI Component Library (≈100 runtime)

> *Cada componente* en `ui/…` con su test `ui/<Comp>.test.js`. Internamente usan: `perf/*`, `a11y/*`, `i18n/*`, `core/ErrorGuard.js`, `core/TemplateEngine.js`.

* **Átomos**: Button, Input, Select, Toggle, Badge, Avatar, Chip, Switch, Radio, Checkbox, LoadingSpinner
* **Overlay**: Modal, Alert, Tooltip, Toast, Snackbar, Drawer, Popover, Dialog, Skeleton
* **Navegación**: NavigationBar, Menu, Sidebar, ContextMenu, MegaMenu, Breadcrumb, Tabs, Stepper
* **Layout & Helpers**: Card, Grid, Box, Container, SplitPane, Accordion, Collapse, Spacer, Divider, AspectRatio
* **Forms / Data Entry**: SearchBox, Autocomplete, DatePicker, DateRangePicker, TimePicker, ColorPicker, FileUpload, RangeSlider, TagInput, MaskedInput, InputGroup
* **Data Display**: Table, DataGrid, List, VirtualList, InfiniteScroll, Tree, Timeline, Calendar, Pagination, Carousel, MasonryGrid
* **Media**: ImageGallery, ImageLazyLoad, VideoPlayer, AudioPlayer, AudioRecorder, PDFViewer, 360Viewer, ImageCropper, Lightbox
* **Advanced**: CodeEditor, RichTextEditor, MarkdownEditor, Charts, Gantt, Kanban, Map, HeatMap, TreeMap, DragDropZone, SpeedDial, FloatingActionButton, ParallaxScroll
* **Labs**: ParticleEngine, PhysicsSystem, 3DForceGraph, ComponentTree3D

---

## 15. Testing & QA (dev-only)

| Fichero                                                                           | Descripción                              | Depende de                                        |
| --------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------- |
| `test/BrutalTest.js` + `test/Extractor.js`                                        | Motor de tests + extracción build-time   | core/BrutalComponent.js, build/ExtractorPlugin.js |
| `test/TestHarness.js`                                                             | JSDOM harness para unit tests            | test/BrutalTest.js                                |
| `test/BrowserController.js`                                                       | Abstracción Puppeteer/Playwright         | build/ExtractorPlugin.js                          |
| `test/DeviceEmulator.js`                                                          | Emulación móviles/tablets                | test/BrowserController.js                         |
| `test/MultiDriverAdapter.js`                                                      | WebDriver BiDi + CDPIntegration          | test/BrowserController.js                         |
| `test/ModeSelector.js`                                                            | quick ▸ complete ▸ continuous modes      | build/ExtractorPlugin.js                          |
| `test/Snapshot.js`                                                                | Snapshot testing                         | test/TestHarness.js                               |
| `test/VisualDiff.js`                                                              | Comparación pixel-a-pixel                | test/Snapshot.js                                  |
| `test/Mocking.js`                                                                 | Sistema de mocking                       | test/TestHarness.js                               |
| `test/Fixtures.js`                                                                | Gestión de fixtures                      | test/TestHarness.js                               |
| `test/ContractTesting.js`                                                         | Pruebas de contratos API                 | network/HttpClient.js                             |
| `test/CoverageReporter.js`                                                        | Reporte de cobertura (lcov, sonar)       | test/BrutalTest.js                                |
| `test/AxeSmokeTest.js`                                                            | Pruebas de a11y con axe-core             | test/BrowserController.js                         |
| `test/RootCauseEngine.js`                                                         | Detección de raíz de errores             | test/BrowserController.js                         |
| `test/MemoryLeakDetector.js`                                                      | Detector de fugas de memoria             | test/BrowserController.js                         |
| `test/NetworkAnalyzer.js`                                                         | Analiza peticiones + performance de red  | test/BrowserController.js                         |
| `test/StateCapture.js`                                                            | Captura instantáneas de estado           | core/BrutalState.js                               |
| `test/AutoFixer.js`, `SuggestionEngine.js`, `BackupManager.js`, `FixValidator.js` | Auto-fixes rule-based                    | test/RootCauseEngine.js                           |
| `test/ReportGenerator.js`                                                         | Genera informes HTML/JSON/Markdown       | test/BrutalTest.js                                |
| `test/DashboardServer.js`, `LiveUpdater.js`, `APIEndpoints.js`, `StaticAssets.js` | Dashboard real-time                      | test/ReportGenerator.js                           |
| `test/VisualBaselineManager.js`                                                   | Gestión automática de baselines visuales | test/VisualDiff.js                                |

---

## 16. DX & Tooling (dev-only)

| Fichero                          | Descripción                                             | Depende de                                        |
| -------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| `cli/create-app.js`              | `brutal create app` scaffold                            | build/rollup.config.js                            |
| `cli/create-component.js`        | `brutal create component`                               | core/BrutalComponent.js                           |
| `cli/dev-server.js`              | `brutal dev` con HMR                                    | build/HMRPlugin.js                                |
| `cli/build.js`                   | `brutal build`                                          | build/rollup.config.js                            |
| `cli/analyze.js`                 | `brutal analyze` (bundle + perf + lint)                 | build/BrutalOptimizer.js,<br>tooling/ESLintConfig |
| `cli/test.js`                    | `brutal test/watch`                                     | test/BrutalTest.js                                |
| `tooling/StorybookPlayground.js` | Playground de UI con HMR                                | cli/dev-server.js                                 |
| `tooling/DevToolsExtension/`     | Extensión (spans, state time-travel, profiling)         | obs/TracingSpans.js                               |
| `tooling/vscode/extension.js`    | VS Code plugin (snippets, go-to-source, live templates) | tooling/TypeDeclarations.d.ts                     |
| `tooling/TypeDeclarations.d.ts`  | Declaraciones TS para Core + UI                         | core + ui                                         |
| `tooling/ESLintConfig/index.js`  | Presets ESLint / Prettier                               | —                                                 |
| `tooling/Codemods/V3toV4.js`     | Scripts migración API V3 → V4                           | —                                                 |
| `tooling/DocsSiteGenerator.js`   | Genera sitio docs con SSGTool                           | seo/SSGTool.js                                    |
| `tooling/StateDebugger.js`       | Time-travel + replay de estado en DevTools              | obs/TracingSpans.js                               |
| `tooling/PreCommitHooks.js`      | lint-staged + test runner                               | tooling/ESLintConfig                              |

---

## 17. Observability & Monitoring (runtime + dev-only)

| Fichero                      | Descripción                                     | Depende de                 |
| ---------------------------- | ----------------------------------------------- | -------------------------- |
| `obs/ErrorTracking.js`       | Integración Sentry / OTel (runtime)             | enterprise/AuditLogging.js |
| `obs/RUMMonitor.js`          | Web Vitals in-page (LCP, FID, CLS…)             | perf/ResourceHints.js      |
| `obs/CIMonitor.js`           | Checks de memory/perf budgets en CI             | build/BrutalOptimizer.js   |
| `obs/DistributedTracing.js`  | Spans distribuidos + context propagation        | obs/ErrorTracking.js       |
| `obs/CustomSpans.js`         | API para crear spans custom                     | obs/DistributedTracing.js  |
| `obs/PerformanceTimeline.js` | Registro de user-timings & performance timeline | obs/RUMMonitor.js          |
| `obs/LogForwarder.js`        | Reenvío de logs a Elasticsearch/Splunk/Loki     | obs/ErrorTracking.js       |

---

## 18. Enterprise & Compliance (dev-only + runtime)

| Fichero                          | Descripción                        | Depende de                 |
| -------------------------------- | ---------------------------------- | -------------------------- |
| `enterprise/RBAC.js`             | Control de acceso por roles        | core/BrutalState.js        |
| `enterprise/AuditLogging.js`     | Logging de auditoría               | obs/LogForwarder.js        |
| `enterprise/GDPRHelpers.js`      | Helpers GDPR                       | core/BrutalState.js        |
| `enterprise/SSOIntegration.js`   | SSO SAML/OAuth2                    | security/AuthBase.js       |
| `enterprise/LicenseManager.js`   | Gestión licencias enterprise       | —                          |
| `enterprise/ComplianceTools.js`  | Auditoría & compliance             | enterprise/AuditLogging.js |
| `enterprise/SessionRecording.js` | Grabación de sesiones de usuario   | —                          |
| `enterprise/FeatureFlags.js`     | Rollouts & A/B testing             | obs/CustomSpans.js         |
| `enterprise/ConsentManager.js`   | UI para gestión de consentimientos | a11y/SkipNavGenerator.js   |

---

## 19. Deployment & DevOps (dev-only)

| Fichero                     | Descripción                                  | Depende de            |
| --------------------------- | -------------------------------------------- | --------------------- |
| `deploy/Dockerfile`         | Imagen Docker oficial                        | cli/build.js          |
| `deploy/K8sConfigs.yaml`    | Plantillas Kubernetes                        | cli/build.js          |
| `deploy/CI-CDTemplates/**`  | GitHub Actions, GitLab CI, etc.              | cli/build.js          |
| `deploy/HealthCheck.js`     | Liveness/readiness endpoints                 | deploy/CI-CDTemplates |
| `deploy/RollbackScripts.js` | Scripts de rollback automático               | deploy/HealthCheck.js |
| `deploy/CanaryRelease.js`   | Soporte a canary releases / gradual rollouts | cli/deploy.js         |

---

## 20. Micro-Frontends (runtime, ≈300 B)

| Fichero                     | Descripción                           | Depende de               |
| --------------------------- | ------------------------------------- | ------------------------ |
| `mfe/mount.js`              | `mount(container, component, props)`  | core/BrutalComponent.js  |
| `mfe/unmount.js`            | Desmonta y limpia componente          | core/BrutalComponent.js  |
| `mfe/importmap-shared.html` | Script tag para import-maps federados | core/PolyfillStrategy.js |

---

## 21. Mobile Enhancements (runtime)

| Fichero                              | Descripción                                             | Depende de              |
| ------------------------------------ | ------------------------------------------------------- | ----------------------- |
| `mobile/PullToRefresh.js`            | Pull-down para refrescar                                | perf/GestureSystem.js   |
| `mobile/SwipeActions.js`             | Gestos swipe específicos                                | perf/GestureSystem.js   |
| `mobile/HapticFeedback.js`           | API de vibración                                        | perf/GestureSystem.js   |
| `mobile/OrientationLock.js`          | Bloqueo/desbloqueo de orientación de pantalla           | core/BrutalComponent.js |
| `mobile/VirtualKeyboardManager.js`   | Ajuste layout + scroll al aparecer teclado virtual      | core/BrutalComponent.js |
| `mobile/SafeAreaInsets.js`           | Soporte notch / áreas seguras                           | core/BrutalComponent.js |
| `mobile/NetworkStatusObserver.js`    | Detecta online/offline                                  | core/BrutalComponent.js |
| `mobile/BatteryStatusObserver.js`    | Observa nivel de batería                                | core/BrutalComponent.js |
| `mobile/DeviceFeaturesAdapter.js`    | Adaptadores para Camera/GPS/Bluetooth (PWA / Capacitor) | —                       |
| `mobile/MobilePerformanceMonitor.js` | Ajustes según CPU/memoria baja en dispositivos móviles  | obs/CIMonitor.js        |

---

## 22. Labs / Experimental (fuera bundle)

| Fichero                   | Descripción                                   | Depende de              |
| ------------------------- | --------------------------------------------- | ----------------------- |
| `labs/ComponentAI.js`     | Generador de componentes por lenguaje natural | —                       |
| `labs/LayoutAI.js`        | Sugerencias automáticas de layout             | labs/ComponentAI.js     |
| `labs/PageBuilder.js`     | Editor drag-and-drop de páginas               | labs/LayoutAI.js        |
| `labs/ParticleEngine.js`  | Motor partículas masivas                      | gpu/WebGLRenderer.js    |
| `labs/PhysicsSystem.js`   | Motor de física simplificado                  | labs/ParticleEngine.js  |
| `labs/3DForceGraph.js`    | Visualización grafos 3D                       | labs/PhysicsSystem.js   |
| `labs/ComponentTree3D.js` | Vista 3D interactiva de árbol de componentes  | core/BrutalComponent.js |

---

**Esta arquitectura** integra **100 %** de las capacidades discutidas, **sin omisiones**, y con **dependencias explícitas** para cada módulo. Cubre infraestructura base, funciones avanzadas, desarrollo, pruebas, despliegue y extensibilidad. ¡Listos para construir y escalar!

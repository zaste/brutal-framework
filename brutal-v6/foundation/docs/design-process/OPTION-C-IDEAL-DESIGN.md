# 🎯 Diseño Ideal - Opción C (Híbrida)
*Foundation alineada, escalable y a prueba de futuro*

## 📐 Arquitectura Foundation

```
foundation/
├── README.md                    # Navigation & purpose
├── PRINCIPLES.md               # Los 5 principios inmutables
├── CHANGELOG.md                # Cambios a la foundation misma
│
├── core/                       # Motor mínimo (~100 líneas TOTAL)
│   ├── index.ts               # API pública (1 función)
│   ├── types.ts               # Tipos compartidos
│   └── validator.ts           # Lógica de validación
│
├── rules/                      # Reglas YAML (declarativas)
│   ├── _schema.yaml           # JSON Schema para validar YAMLs
│   ├── dependencies.yaml      # Zero dependencies rule
│   ├── size.yaml              # Package size limits
│   ├── structure.yaml         # Code structure rules
│   ├── api.yaml               # API surface rules
│   └── duplication.yaml       # No duplication rule
│
├── patterns/                   # Patrones aprobados
│   ├── README.md              # Índice de patrones
│   ├── composition.md         # Patrón + código + test
│   ├── state-management.md    # Patrón + código + test
│   ├── event-handling.md      # Patrón + código + test
│   └── examples/              # Código ejecutable
│       └── *.ts               # Ejemplos que se pueden probar
│
├── protocols/                  # Cómo trabajamos
│   ├── decision-making.md     # Protocolo de decisiones
│   ├── development.md         # Flujo de desarrollo
│   ├── testing.md             # Qué y cómo testear
│   ├── release.md             # Proceso de release
│   └── maintenance.md         # Mantenimiento a largo plazo
│
├── boundaries/                 # Límites del sistema
│   ├── ai.yaml                # Qué puede/no puede hacer AI
│   ├── human.yaml             # Qué debe hacer el humano
│   └── system.yaml            # Límites técnicos del framework
│
├── enforcement/                # Cómo se aplican las reglas
│   ├── pre-commit.sh          # Git hooks
│   ├── ci-validation.ts       # GitHub Actions
│   └── local-check.ts         # Desarrollo local
│
└── tests/                      # Tests del foundation mismo
    ├── validator.test.ts       # Test del core
    ├── rules.test.ts          # Test que rules son válidas
    └── patterns.test.ts       # Test que patterns funcionan
```

## 🧠 Core Design (El Cerebro)

### `/core/index.ts` - API Pública Mínima
```typescript
// La ÚNICA función pública de foundation
export async function validate(
  target: ValidationTarget,
  context: ValidationContext
): Promise<ValidationResult> {
  const rules = await loadRules(target.type);
  const results = await Promise.all(
    rules.map(rule => validateRule(rule, target, context))
  );
  return mergeResults(results);
}

// Tipos públicos re-exportados
export type { ValidationTarget, ValidationContext, ValidationResult } from './types';
```

### `/core/types.ts` - Tipos Compartidos
```typescript
export interface ValidationTarget {
  type: 'package' | 'file' | 'function' | 'commit';
  path: string;
  content?: any;
}

export interface ValidationContext {
  workspace: string;
  mode: 'development' | 'ci' | 'pre-commit';
  fix: boolean;
}

export interface ValidationResult {
  valid: boolean;
  violations: Violation[];
  fixed?: number;
}

export interface Violation {
  rule: string;
  severity: 'error' | 'warning';
  message: string;
  file?: string;
  line?: number;
  fix?: () => Promise<void>;
}
```

### `/core/validator.ts` - Lógica Interna
```typescript
// ~50 líneas de lógica pura
import { parse } from 'yaml';
import { readFile } from 'fs/promises';

async function loadRules(type: string): Promise<Rule[]> {
  // Cargar YAMLs relevantes
  // Parsear y validar contra schema
  // Retornar reglas aplicables
}

function validateRule(
  rule: Rule, 
  target: ValidationTarget,
  context: ValidationContext
): ValidationResult {
  // Aplicar lógica de la regla
  // Retornar violaciones si las hay
}
```

## 📏 Rules Design (Las Leyes)

### `rules/_schema.yaml` - Meta-validación
```yaml
# JSON Schema para validar que los YAMLs son correctos
type: object
properties:
  id:
    type: string
    pattern: "^[a-z-]+$"
  description:
    type: string
  severity:
    enum: [error, warning]
  targets:
    type: array
    items:
      enum: [package, file, function]
  validate:
    type: object
required: [id, description, severity, targets, validate]
```

### `rules/size.yaml` - Ejemplo de Regla
```yaml
id: package-size
description: "Enforce package size limits"
severity: error
targets: [package]

validate:
  size:
    max: 2048  # 2KB in bytes
    measure: "dist/index.js"
    
  exceptions:
    - "@brutal/core"  # Core puede ser hasta 3KB
    
  message: |
    Package {{name}} exceeds size limit
    Current: {{current}}
    Maximum: {{max}}
    Reduce by: {{excess}}

fix:
  suggestions:
    - "Use shorter variable names"
    - "Remove unused exports"
    - "Combine similar functions"
```

### `rules/dependencies.yaml`
```yaml
id: zero-dependencies
description: "No external runtime dependencies"
severity: error
targets: [package]

validate:
  dependencies:
    external: 0
    internal: 
      prefix: "@brutal/"
      
  devDependencies:
    allowed:
      - "typescript"
      - "tsup" 
      - "jest"
      - "@types/*"
      
  message: |
    External dependency not allowed: {{dependency}}
    Only @brutal/* internal dependencies permitted
```

## 🎨 Patterns Design (Los Ejemplos)

### `patterns/composition.md`
```markdown
# Composition Pattern

## Problem
Need to add behaviors to elements without inheritance.

## Solution
Use function composition to enhance elements.

## Implementation
```typescript
// THE pattern - copy this
export const compose = (...fns) => x => 
  fns.reduceRight((v, f) => f(v), x);

// Usage example
const withState = (initial) => (el) => {
  el.state = createState(initial);
  return el;
};

const withEvents = (el) => {
  el.on = (event, handler) => {
    el.addEventListener(event, handler);
  };
  return el;
};

// Compose behaviors
const enhance = compose(withState({}), withEvents);
const element = enhance(document.createElement('div'));
```

## When to Use
- Adding multiple behaviors to elements
- Building component factories
- Avoiding inheritance chains

## Test
```typescript
test('composition works', () => {
  const add1 = x => x + 1;
  const double = x => x * 2;
  const add1ThenDouble = compose(double, add1);
  expect(add1ThenDouble(5)).toBe(12); // (5+1)*2
});
```
```

## 🚦 Enforcement Design

### `enforcement/pre-commit.sh`
```bash
#!/bin/bash
# Runs on every commit

# Check only changed files
CHANGED=$(git diff --cached --name-only)

# Run foundation validation
node foundation/enforcement/local-check.js $CHANGED

if [ $? -ne 0 ]; then
  echo "❌ Foundation validation failed"
  echo "Run 'npm run foundation:fix' to auto-fix"
  exit 1
fi
```

### `enforcement/ci-validation.ts`
```typescript
// GitHub Action / CI integration
export async function validatePR(context: PRContext) {
  const results = await validate({
    type: 'commit',
    path: context.sha
  }, {
    workspace: context.workspace,
    mode: 'ci',
    fix: false
  });
  
  if (!results.valid) {
    await context.createComment({
      body: formatViolations(results.violations)
    });
    await context.setStatus('failure');
  }
}
```

## 🔄 Escalabilidad

### Cómo escala sin romperse:

1. **Nuevas reglas = Nuevo YAML**
   - No tocas el core
   - Solo agregas `rules/new-rule.yaml`

2. **Nuevos patrones = Nuevo MD**
   - Documentas el patrón
   - Agregas ejemplo en `examples/`

3. **Nuevos targets = Extend types**
   - Solo modificas `types.ts`
   - El validator ya sabe qué hacer

4. **Reglas complejas = Rule plugins**
   ```yaml
   # rules/complex.yaml
   id: complex-validation
   plugin: "./plugins/complex-validator.ts"
   config:
     # Plugin-specific config
   ```

## 📊 Métricas de Éxito

El diseño es exitoso si:

1. **Core se mantiene < 100 líneas** por 1 año
2. **Agregar regla = 1 archivo YAML** (no código)
3. **CI/CD integrado** desde día 1
4. **0 violaciones** no detectadas
5. **Nuevos devs productivos** en 1 hora

## 🎯 Principios del Diseño

1. **YAML para configuración, TS para lógica**
2. **Una sola función pública**
3. **Reglas son datos, no código**
4. **Patrones son ejemplos, no librerías**
5. **Enforcement automático siempre**

## 🚀 Implementación por Fases

### Fase 1: Core (1 hora)
- [ ] types.ts
- [ ] validator.ts  
- [ ] index.ts

### Fase 2: Reglas Críticas (1 hora)
- [ ] _schema.yaml
- [ ] size.yaml
- [ ] dependencies.yaml

### Fase 3: Patterns Esenciales (1 hora)
- [ ] composition.md
- [ ] state-management.md
- [ ] event-handling.md

### Fase 4: Enforcement (1 hora)
- [ ] pre-commit.sh
- [ ] local-check.ts

### Total: 4 horas hasta sistema funcional

---

*"La mejor arquitectura es la que no puedes romper por accidente"*
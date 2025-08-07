# 📍 Aclaración: Estamos diseñando SOLO /foundation

## 🎯 De qué estamos hablando

Estamos diseñando la estructura del directorio `/foundation` que contendrá:
- Los principios inmutables
- Las reglas que enforzan esos principios  
- Los protocolos de trabajo
- Los patrones aprobados

```
brutal-v6/
├── foundation/          ← SOLO ESTO
│   ├── constraints/
│   ├── patterns/
│   ├── protocols/
│   └── ...
└── packages/           ← Esto viene DESPUÉS
    └── @brutal/
```

## 🚫 NO estamos hablando de:

- La implementación de @brutal/core
- Los componentes del framework
- El código de producción
- Los packages

## ✅ SÍ estamos hablando de:

El "sistema de reglas" que prevendrá que V6 se convierta en V7:

### Opción A para /foundation: Todo TypeScript
```
foundation/
├── constraints/
│   ├── zero-dependencies.ts    # Validador en TS
│   ├── size-limits.ts         # Validador en TS
│   └── composition-only.ts    # Validador en TS
└── (20-30 archivos .ts)
```

### Opción B para /foundation: Todo configuración
```
foundation/
├── rules/
│   ├── dependencies.yaml      # Regla en YAML
│   ├── size.yaml             # Regla en YAML
│   └── patterns.yaml         # Regla en YAML
└── validator/
    └── index.ts              # Único código
```

### Opción C para /foundation: Híbrido
```
foundation/
├── core/
│   └── validator.ts          # Motor mínimo (~100 líneas)
├── rules/
│   ├── size.yaml            # Reglas simples en YAML
│   └── dependencies.yaml    
└── patterns/
    └── composition.md       # Documentación
```

## 💡 El punto clave

La `/foundation` es nuestra "constitución" - las reglas que nos gobiernan, NO el código del framework.

- Si elegimos A: Nuestra constitución será código TypeScript
- Si elegimos B: Nuestra constitución será archivos YAML
- Si elegimos C: Nuestra constitución será YAML con un intérprete mínimo

## 🤔 La pregunta real

¿Cómo queremos que sea nuestra "constitución" (foundation)?
- ¿Ejecutable y poderosa? (TypeScript)
- ¿Declarativa y simple? (YAML)  
- ¿Un balance? (Híbrido)

Esto determinará cómo escribimos y enforzamos las reglas, no cómo escribimos el framework.
# BRUTAL V5 COMPREHENSIVE TEST REPORT
Generated on: Sat Jul 12 20:38:29 UTC 2025

## 1. BUILD ERRORS AND WARNINGS
```

> brutal-v5@0.0.0 build /workspaces/web/brutal-v5
> turbo build

• Packages in scope: @brutal/a11y, @brutal/cache, @brutal/components, @brutal/events, @brutal/foundation, @brutal/plugins, @brutal/routing, @brutal/scheduling, @brutal/shared, @brutal/state, @brutal/templates
• Running build in 11 packages
• Remote caching disabled
@brutal/foundation:build: cache hit, replaying logs 22b033841c416293
@brutal/foundation:build: 
@brutal/foundation:build: > @brutal/foundation@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/foundation
@brutal/foundation:build: > tsup
@brutal/foundation:build: 
@brutal/foundation:build: CLI Building entry: src/index.ts
@brutal/foundation:build: CLI Using tsconfig: tsconfig.json
@brutal/foundation:build: CLI tsup v8.5.0
@brutal/foundation:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/foundation/tsup.config.ts
@brutal/foundation:build: CLI Target: es2022
@brutal/foundation:build: CLI Cleaning output folder
@brutal/foundation:build: ESM Build start
@brutal/foundation:build: ESM dist/index.js     3.08 KB
@brutal/foundation:build: ESM dist/index.js.map 9.29 KB
@brutal/foundation:build: ESM ⚡️ Build success in 181ms
@brutal/foundation:build: ✅ Build successful
@brutal/foundation:build: DTS Build start
@brutal/foundation:build: DTS ⚡️ Build success in 2713ms
@brutal/foundation:build: DTS dist/index.d.ts 553.00 B
@brutal/templates:build: cache miss, executing a97048eee6984287
@brutal/shared:build: cache hit, replaying logs d56575f20f5e6cc2
@brutal/shared:build: 
@brutal/shared:build: > @brutal/shared@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/shared
@brutal/shared:build: > tsup
@brutal/shared:build: 
@brutal/shared:build: CLI Building entry: src/index.ts
@brutal/shared:build: CLI Using tsconfig: tsconfig.json
@brutal/shared:build: CLI tsup v8.5.0
@brutal/shared:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/shared/tsup.config.ts
@brutal/shared:build: CLI Target: es2022
@brutal/shared:build: CLI Cleaning output folder
@brutal/shared:build: ESM Build start
@brutal/shared:build: ESM dist/index.js     2.16 KB
@brutal/shared:build: ESM dist/index.js.map 6.14 KB
@brutal/shared:build: ESM ⚡️ Build success in 331ms
@brutal/shared:build: ✅ Build successful
@brutal/shared:build: DTS Build start
@brutal/shared:build: DTS ⚡️ Build success in 4981ms
@brutal/shared:build: DTS dist/index.d.ts 490.00 B
@brutal/routing:build: cache miss, executing eea09cc723936112
@brutal/a11y:build: cache hit, replaying logs 061d980106dc8eb6
@brutal/a11y:build: 
@brutal/a11y:build: > @brutal/a11y@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/a11y
@brutal/a11y:build: > tsup
@brutal/a11y:build: 
@brutal/a11y:build: ▲ [WARNING] Cannot find base config file "../../tsconfig.json" [tsconfig.json]
@brutal/a11y:build: 
@brutal/a11y:build:     tsconfig.json:2:13:
@brutal/a11y:build:       2 │   "extends": "../../tsconfig.json",
@brutal/a11y:build:         ╵              ~~~~~~~~~~~~~~~~~~~~~
@brutal/a11y:build: 
@brutal/a11y:build: CLI Building entry: src/index.ts
@brutal/a11y:build: CLI Using tsconfig: tsconfig.json
@brutal/a11y:build: CLI tsup v8.5.0
@brutal/a11y:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/a11y/tsup.config.ts
@brutal/a11y:build: CLI Target: es2022
@brutal/a11y:build: CLI Cleaning output folder
@brutal/a11y:build: ESM Build start
@brutal/a11y:build: 
@brutal/a11y:build:  WARN  [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mCannot find base config file "../../tsconfig.json"[0m [tsconfig.json]
@brutal/a11y:build: 
@brutal/a11y:build:     tsconfig.json:2:13:
@brutal/a11y:build: [37m      2 │   "extends": [32m"../../tsconfig.json"[37m,
@brutal/a11y:build:         ╵              [32m~~~~~~~~~~~~~~~~~~~~~[0m
@brutal/a11y:build: 
@brutal/a11y:build: 
@brutal/a11y:build: 
@brutal/a11y:build: ESM dist/index.js     1.28 KB
@brutal/a11y:build: ESM dist/index.js.map 3.88 KB
@brutal/a11y:build: ESM ⚡️ Build success in 282ms
@brutal/a11y:build: ✅ Build successful
@brutal/a11y:build: DTS Build start
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: DTS ⚡️ Build success in 4767ms
@brutal/a11y:build: DTS dist/index.d.ts 330.00 B
@brutal/scheduling:build: cache miss, executing 67b73022a9dbe119
@brutal/cache:build: cache miss, executing 6ce6c39b3666f598
@brutal/events:build: cache hit, replaying logs 3e98849f8915fbbb
@brutal/events:build: 
@brutal/events:build: > @brutal/events@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/events
@brutal/events:build: > tsup
@brutal/events:build: 
@brutal/events:build: CLI Building entry: src/index.ts
@brutal/events:build: CLI Using tsconfig: tsconfig.json
@brutal/events:build: CLI tsup v8.5.0
@brutal/events:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/events/tsup.config.ts
@brutal/events:build: CLI Target: es2022
@brutal/events:build: CLI Cleaning output folder
@brutal/events:build: ESM Build start
@brutal/events:build: ESM dist/index.js     1.72 KB
@brutal/events:build: ESM dist/index.js.map 5.17 KB
@brutal/events:build: ESM ⚡️ Build success in 101ms
@brutal/events:build: ✅ Build successful
@brutal/events:build: DTS Build start
@brutal/events:build: DTS ⚡️ Build success in 2215ms
@brutal/events:build: DTS dist/index.d.ts 391.00 B
@brutal/state:build: cache miss, executing c66bb73283faf9b9
@brutal/plugins:build: cache hit, replaying logs 11a67a59402e4710
@brutal/plugins:build: 
@brutal/plugins:build: > @brutal/plugins@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/plugins
@brutal/plugins:build: > tsup
@brutal/plugins:build: 
@brutal/plugins:build: ▲ [WARNING] Cannot find base config file "../../tsconfig.json" [tsconfig.json]
@brutal/plugins:build: 
@brutal/plugins:build:     tsconfig.json:2:13:
@brutal/plugins:build:       2 │   "extends": "../../tsconfig.json",
@brutal/plugins:build:         ╵              ~~~~~~~~~~~~~~~~~~~~~
@brutal/plugins:build: 
@brutal/plugins:build: CLI Building entry: src/index.ts
@brutal/plugins:build: CLI Using tsconfig: tsconfig.json
@brutal/plugins:build: CLI tsup v8.5.0
@brutal/plugins:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/plugins/tsup.config.ts
@brutal/plugins:build: CLI Target: es2022
@brutal/plugins:build: CLI Cleaning output folder
@brutal/plugins:build: ESM Build start
@brutal/plugins:build: 
@brutal/plugins:build:  WARN  [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mCannot find base config file "../../tsconfig.json"[0m [tsconfig.json]
@brutal/plugins:build: 
@brutal/plugins:build:     tsconfig.json:2:13:
@brutal/plugins:build: [37m      2 │   "extends": [32m"../../tsconfig.json"[37m,
@brutal/plugins:build:         ╵              [32m~~~~~~~~~~~~~~~~~~~~~[0m
@brutal/plugins:build: 
@brutal/plugins:build: 
@brutal/plugins:build: 
@brutal/plugins:build: ESM dist/index.js     1.29 KB
@brutal/plugins:build: ESM dist/index.js.map 3.89 KB
@brutal/plugins:build: ESM ⚡️ Build success in 109ms
@brutal/plugins:build: ✅ Build successful
@brutal/plugins:build: DTS Build start
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: DTS ⚡️ Build success in 2327ms
@brutal/plugins:build: DTS dist/index.d.ts 336.00 B
@brutal/scheduling:build: 
@brutal/scheduling:build: > @brutal/scheduling@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/scheduling
@brutal/scheduling:build: > tsup
@brutal/scheduling:build: 
@brutal/templates:build: 
@brutal/templates:build: > @brutal/templates@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/templates
@brutal/templates:build: > tsup src/index.ts
@brutal/templates:build: 
@brutal/state:build: 
@brutal/state:build: > @brutal/state@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/state
@brutal/state:build: > tsup
@brutal/state:build: 
@brutal/routing:build: 
@brutal/routing:build: > @brutal/routing@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/routing
@brutal/routing:build: > tsup src/index.ts
@brutal/routing:build: 
@brutal/cache:build: 
@brutal/cache:build: > @brutal/cache@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/cache
@brutal/cache:build: > tsup src/index.ts
@brutal/cache:build: 
@brutal/scheduling:build: ▲ [WARNING] Cannot find base config file "../../tsconfig.json" [tsconfig.json]
@brutal/scheduling:build: 
@brutal/scheduling:build:     tsconfig.json:2:13:
@brutal/scheduling:build:       2 │   "extends": "../../tsconfig.json",
@brutal/scheduling:build:         ╵              ~~~~~~~~~~~~~~~~~~~~~
@brutal/scheduling:build: 
@brutal/scheduling:build: CLI Building entry: src/index.ts
@brutal/scheduling:build: CLI Using tsconfig: tsconfig.json
@brutal/scheduling:build: CLI tsup v8.5.0
@brutal/scheduling:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/scheduling/tsup.config.ts
@brutal/scheduling:build: CLI Target: es2022
@brutal/scheduling:build: CLI Cleaning output folder
@brutal/scheduling:build: ESM Build start
@brutal/scheduling:build: 
@brutal/scheduling:build:  WARN  [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mCannot find base config file "../../tsconfig.json"[0m [tsconfig.json]
@brutal/scheduling:build: 
@brutal/scheduling:build:     tsconfig.json:2:13:
@brutal/scheduling:build: [37m      2 │   "extends": [32m"../../tsconfig.json"[37m,
@brutal/scheduling:build:         ╵              [32m~~~~~~~~~~~~~~~~~~~~~[0m
@brutal/scheduling:build: 
@brutal/scheduling:build: 
@brutal/scheduling:build: 
@brutal/templates:build: CLI Building entry: src/index.ts
@brutal/templates:build: CLI Using tsconfig: tsconfig.json
@brutal/templates:build: CLI tsup v8.5.0
@brutal/templates:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/templates/tsup.config.ts
@brutal/templates:build: CLI Target: es2022
@brutal/templates:build: CLI Cleaning output folder
@brutal/templates:build: ESM Build start
@brutal/templates:build: ESM dist/index.js     4.48 KB
@brutal/templates:build: ESM dist/index.js.map 10.77 KB
@brutal/templates:build: ESM ⚡️ Build success in 44ms
@brutal/templates:build: ✅ Build successful
@brutal/scheduling:build: ESM dist/index.js     1.29 KB
@brutal/scheduling:build: ESM dist/index.js.map 3.90 KB
@brutal/scheduling:build: ESM ⚡️ Build success in 475ms
@brutal/routing:build: CLI Building entry: src/index.ts
@brutal/routing:build: CLI Using tsconfig: tsconfig.json
@brutal/routing:build: CLI tsup v8.5.0
@brutal/routing:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/routing/tsup.config.ts
@brutal/routing:build: CLI Target: es2022
@brutal/routing:build: CLI Cleaning output folder
@brutal/routing:build: ESM Build start
@brutal/routing:build: ESM dist/index.js     5.49 KB
@brutal/routing:build: ESM dist/index.js.map 12.56 KB
@brutal/routing:build: ESM ⚡️ Build success in 69ms
@brutal/routing:build: ✅ Build successful
@brutal/state:build: CLI Building entry: src/index.ts
@brutal/state:build: CLI Using tsconfig: tsconfig.json
@brutal/state:build: CLI tsup v8.5.0
@brutal/state:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/state/tsup.config.ts
@brutal/state:build: CLI Target: es2022
@brutal/state:build: CLI Cleaning output folder
@brutal/state:build: ESM Build start
@brutal/cache:build: CLI Building entry: src/index.ts
@brutal/cache:build: CLI Using tsconfig: tsconfig.json
@brutal/cache:build: CLI tsup v8.5.0
@brutal/cache:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/cache/tsup.config.ts
@brutal/cache:build: CLI Target: es2022
@brutal/cache:build: CLI Cleaning output folder
@brutal/cache:build: ESM Build start
@brutal/cache:build: ESM dist/index.js     6.11 KB
@brutal/cache:build: ESM dist/index.js.map 14.21 KB
@brutal/cache:build: ESM ⚡️ Build success in 89ms
@brutal/cache:build: ✅ Build successful
@brutal/state:build: ESM dist/index.js     1.71 KB
@brutal/state:build: ESM dist/index.js.map 5.11 KB
@brutal/state:build: ESM ⚡️ Build success in 344ms
@brutal/state:build: ✅ Build successful
@brutal/templates:build: DTS Build start
@brutal/scheduling:build: DTS Build start
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/state:build: DTS Build start
@brutal/routing:build: DTS Build start
@brutal/cache:build: DTS Build start
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: DTS ⚡️ Build success in 10552ms
@brutal/scheduling:build: DTS dist/index.d.ts 1.21 KB
@brutal/templates:build: src/engine/engine.ts(26,22): error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'.
@brutal/templates:build:   Type 'undefined' is not assignable to type 'string'.
@brutal/templates:build: 
@brutal/templates:build: Error: error occurred in dts build
@brutal/templates:build:     at Worker.<anonymous> (/workspaces/web/brutal-v5/node_modules/.pnpm/tsup@8.5.0_typescript@5.8.3/node_modules/tsup/dist/index.js:1545:26)
@brutal/templates:build:     at Worker.emit (node:events:518:28)
@brutal/templates:build:     at MessagePort.<anonymous> (node:internal/worker:268:53)
@brutal/templates:build:     at [nodejs.internal.kHybridDispatch] (node:internal/event_target:827:20)
@brutal/templates:build:     at MessagePort.<anonymous> (node:internal/per_context/messageport:23:28)
@brutal/templates:build: DTS Build error
@brutal/templates:build:  ELIFECYCLE  Command failed with exit code 1.
@brutal/templates:build:  WARN   Local package.json exists, but node_modules missing, did you mean to install?
@brutal/templates:build: ERROR: command finished with error: command (/workspaces/web/brutal-v5/packages/@brutal/templates) /home/codespace/.local/share/pnpm/.tools/pnpm/8.14.0/bin/pnpm run build exited (1)
@brutal/templates#build: command (/workspaces/web/brutal-v5/packages/@brutal/templates) /home/codespace/.local/share/pnpm/.tools/pnpm/8.14.0/bin/pnpm run build exited (1)

 Tasks:    6 successful, 10 total
Cached:    5 cached, 10 total
  Time:    16.871s 
Failed:    @brutal/templates#build

 ERROR  run failed: command  exited (1)
 ELIFECYCLE  Command failed with exit code 1.
```

## 2. TEST FAILURES
```

> brutal-v5@0.0.0 test /workspaces/web/brutal-v5
> turbo test

• Packages in scope: @brutal/a11y, @brutal/cache, @brutal/components, @brutal/events, @brutal/foundation, @brutal/plugins, @brutal/routing, @brutal/scheduling, @brutal/shared, @brutal/state, @brutal/templates
• Running test in 11 packages
• Remote caching disabled
@brutal/a11y:build: cache hit, replaying logs 061d980106dc8eb6
@brutal/a11y:build: 
@brutal/a11y:build: > @brutal/a11y@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/a11y
@brutal/a11y:build: > tsup
@brutal/a11y:build: 
@brutal/a11y:build: ▲ [WARNING] Cannot find base config file "../../tsconfig.json" [tsconfig.json]
@brutal/a11y:build: 
@brutal/a11y:build:     tsconfig.json:2:13:
@brutal/a11y:build:       2 │   "extends": "../../tsconfig.json",
@brutal/a11y:build:         ╵              ~~~~~~~~~~~~~~~~~~~~~
@brutal/a11y:build: 
@brutal/a11y:build: CLI Building entry: src/index.ts
@brutal/a11y:build: CLI Using tsconfig: tsconfig.json
@brutal/a11y:build: CLI tsup v8.5.0
@brutal/a11y:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/a11y/tsup.config.ts
@brutal/a11y:build: CLI Target: es2022
@brutal/a11y:build: CLI Cleaning output folder
@brutal/a11y:build: ESM Build start
@brutal/a11y:build: 
@brutal/a11y:build:  WARN  [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mCannot find base config file "../../tsconfig.json"[0m [tsconfig.json]
@brutal/a11y:build: 
@brutal/a11y:build:     tsconfig.json:2:13:
@brutal/a11y:build: [37m      2 │   "extends": [32m"../../tsconfig.json"[37m,
@brutal/a11y:build:         ╵              [32m~~~~~~~~~~~~~~~~~~~~~[0m
@brutal/a11y:build: 
@brutal/a11y:build: 
@brutal/a11y:build: 
@brutal/a11y:build: ESM dist/index.js     1.28 KB
@brutal/a11y:build: ESM dist/index.js.map 3.88 KB
@brutal/a11y:build: ESM ⚡️ Build success in 282ms
@brutal/a11y:build: ✅ Build successful
@brutal/a11y:build: DTS Build start
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: DTS ⚡️ Build success in 4767ms
@brutal/a11y:build: DTS dist/index.d.ts 330.00 B
@brutal/shared:build: cache hit, replaying logs d56575f20f5e6cc2
@brutal/shared:build: 
@brutal/shared:build: > @brutal/shared@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/shared
@brutal/shared:build: > tsup
@brutal/shared:build: 
@brutal/shared:build: CLI Building entry: src/index.ts
@brutal/shared:build: CLI Using tsconfig: tsconfig.json
@brutal/shared:build: CLI tsup v8.5.0
@brutal/shared:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/shared/tsup.config.ts
@brutal/shared:build: CLI Target: es2022
@brutal/shared:build: CLI Cleaning output folder
@brutal/shared:build: ESM Build start
@brutal/shared:build: ESM dist/index.js     2.16 KB
@brutal/shared:build: ESM dist/index.js.map 6.14 KB
@brutal/shared:build: ESM ⚡️ Build success in 331ms
@brutal/shared:build: ✅ Build successful
@brutal/shared:build: DTS Build start
@brutal/shared:build: DTS ⚡️ Build success in 4981ms
@brutal/shared:build: DTS dist/index.d.ts 490.00 B
@brutal/foundation:build: cache hit, replaying logs 22b033841c416293
@brutal/foundation:build: 
@brutal/foundation:build: > @brutal/foundation@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/foundation
@brutal/foundation:build: > tsup
@brutal/foundation:build: 
@brutal/foundation:build: CLI Building entry: src/index.ts
@brutal/foundation:build: CLI Using tsconfig: tsconfig.json
@brutal/foundation:build: CLI tsup v8.5.0
@brutal/foundation:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/foundation/tsup.config.ts
@brutal/foundation:build: CLI Target: es2022
@brutal/foundation:build: CLI Cleaning output folder
@brutal/foundation:build: ESM Build start
@brutal/foundation:build: ESM dist/index.js     3.08 KB
@brutal/foundation:build: ESM dist/index.js.map 9.29 KB
@brutal/foundation:build: ESM ⚡️ Build success in 181ms
@brutal/foundation:build: ✅ Build successful
@brutal/foundation:build: DTS Build start
@brutal/foundation:build: DTS ⚡️ Build success in 2713ms
@brutal/foundation:build: DTS dist/index.d.ts 553.00 B
@brutal/cache:build: cache miss, executing 6ce6c39b3666f598
@brutal/scheduling:build: cache hit, replaying logs 67b73022a9dbe119
@brutal/scheduling:build: 
@brutal/scheduling:build: > @brutal/scheduling@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/scheduling
@brutal/scheduling:build: > tsup
@brutal/scheduling:build: 
@brutal/scheduling:build: ▲ [WARNING] Cannot find base config file "../../tsconfig.json" [tsconfig.json]
@brutal/scheduling:build: 
@brutal/scheduling:build:     tsconfig.json:2:13:
@brutal/scheduling:build:       2 │   "extends": "../../tsconfig.json",
@brutal/scheduling:build:         ╵              ~~~~~~~~~~~~~~~~~~~~~
@brutal/scheduling:build: 
@brutal/scheduling:build: CLI Building entry: src/index.ts
@brutal/scheduling:build: CLI Using tsconfig: tsconfig.json
@brutal/scheduling:build: CLI tsup v8.5.0
@brutal/scheduling:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/scheduling/tsup.config.ts
@brutal/scheduling:build: CLI Target: es2022
@brutal/scheduling:build: CLI Cleaning output folder
@brutal/scheduling:build: ESM Build start
@brutal/scheduling:build: 
@brutal/scheduling:build:  WARN  [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mCannot find base config file "../../tsconfig.json"[0m [tsconfig.json]
@brutal/scheduling:build: 
@brutal/scheduling:build:     tsconfig.json:2:13:
@brutal/scheduling:build: [37m      2 │   "extends": [32m"../../tsconfig.json"[37m,
@brutal/scheduling:build:         ╵              [32m~~~~~~~~~~~~~~~~~~~~~[0m
@brutal/scheduling:build: 
@brutal/scheduling:build: 
@brutal/scheduling:build: 
@brutal/scheduling:build: ESM dist/index.js     1.29 KB
@brutal/scheduling:build: ESM dist/index.js.map 3.90 KB
@brutal/scheduling:build: ESM ⚡️ Build success in 475ms
@brutal/scheduling:build: DTS Build start
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: DTS ⚡️ Build success in 10552ms
@brutal/scheduling:build: DTS dist/index.d.ts 1.21 KB
@brutal/routing:build: cache miss, executing eea09cc723936112
@brutal/templates:build: cache miss, executing a97048eee6984287
@brutal/a11y:test: cache miss, executing 8539cb445fb3b94b
@brutal/scheduling:test: cache miss, executing 49ef33670159b7fe
@brutal/shared:test: cache miss, executing 19fb89ff01a689e9
@brutal/events:build: cache hit, replaying logs 3e98849f8915fbbb
@brutal/events:build: 
@brutal/events:build: > @brutal/events@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/events
@brutal/events:build: > tsup
@brutal/events:build: 
@brutal/events:build: CLI Building entry: src/index.ts
@brutal/events:build: CLI Using tsconfig: tsconfig.json
@brutal/events:build: CLI tsup v8.5.0
@brutal/events:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/events/tsup.config.ts
@brutal/events:build: CLI Target: es2022
@brutal/events:build: CLI Cleaning output folder
@brutal/events:build: ESM Build start
@brutal/events:build: ESM dist/index.js     1.72 KB
@brutal/events:build: ESM dist/index.js.map 5.17 KB
@brutal/events:build: ESM ⚡️ Build success in 101ms
@brutal/events:build: ✅ Build successful
@brutal/events:build: DTS Build start
@brutal/events:build: DTS ⚡️ Build success in 2215ms
@brutal/events:build: DTS dist/index.d.ts 391.00 B
@brutal/foundation:test: cache miss, executing 034faa510207cc98
@brutal/plugins:build: cache hit, replaying logs 11a67a59402e4710
@brutal/plugins:build: 
@brutal/plugins:build: > @brutal/plugins@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/plugins
@brutal/plugins:build: > tsup
@brutal/plugins:build: 
@brutal/plugins:build: ▲ [WARNING] Cannot find base config file "../../tsconfig.json" [tsconfig.json]
@brutal/plugins:build: 
@brutal/plugins:build:     tsconfig.json:2:13:
@brutal/plugins:build:       2 │   "extends": "../../tsconfig.json",
@brutal/plugins:build:         ╵              ~~~~~~~~~~~~~~~~~~~~~
@brutal/plugins:build: 
@brutal/plugins:build: CLI Building entry: src/index.ts
@brutal/plugins:build: CLI Using tsconfig: tsconfig.json
@brutal/plugins:build: CLI tsup v8.5.0
@brutal/plugins:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/plugins/tsup.config.ts
@brutal/plugins:build: CLI Target: es2022
@brutal/plugins:build: CLI Cleaning output folder
@brutal/plugins:build: ESM Build start
@brutal/plugins:build: 
@brutal/plugins:build:  WARN  [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mCannot find base config file "../../tsconfig.json"[0m [tsconfig.json]
@brutal/plugins:build: 
@brutal/plugins:build:     tsconfig.json:2:13:
@brutal/plugins:build: [37m      2 │   "extends": [32m"../../tsconfig.json"[37m,
@brutal/plugins:build:         ╵              [32m~~~~~~~~~~~~~~~~~~~~~[0m
@brutal/plugins:build: 
@brutal/plugins:build: 
@brutal/plugins:build: 
@brutal/plugins:build: ESM dist/index.js     1.29 KB
@brutal/plugins:build: ESM dist/index.js.map 3.89 KB
@brutal/plugins:build: ESM ⚡️ Build success in 109ms
@brutal/plugins:build: ✅ Build successful
@brutal/plugins:build: DTS Build start
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: DTS ⚡️ Build success in 2327ms
@brutal/plugins:build: DTS dist/index.d.ts 336.00 B
@brutal/state:build: cache miss, executing c66bb73283faf9b9
@brutal/plugins:test: cache miss, executing 74ac37ded621e42d
@brutal/events:test: cache miss, executing 9820f4dd3c1625bb
@brutal/cache:build: 
@brutal/cache:build: > @brutal/cache@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/cache
@brutal/cache:build: > tsup src/index.ts
@brutal/cache:build: 
@brutal/a11y:test: 
@brutal/a11y:test: > @brutal/a11y@0.0.0 test /workspaces/web/brutal-v5/packages/@brutal/a11y
@brutal/a11y:test: > jest
@brutal/a11y:test: 
@brutal/foundation:test: 
@brutal/foundation:test: > @brutal/foundation@0.0.0 test /workspaces/web/brutal-v5/packages/@brutal/foundation
@brutal/foundation:test: > jest
@brutal/foundation:test: 
@brutal/scheduling:test: 
@brutal/scheduling:test: > @brutal/scheduling@0.0.0 test /workspaces/web/brutal-v5/packages/@brutal/scheduling
@brutal/scheduling:test: > jest
@brutal/scheduling:test: 
@brutal/plugins:test: 
@brutal/plugins:test: > @brutal/plugins@0.0.0 test /workspaces/web/brutal-v5/packages/@brutal/plugins
@brutal/plugins:test: > jest
@brutal/plugins:test: 
@brutal/state:build: 
@brutal/state:build: > @brutal/state@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/state
@brutal/state:build: > tsup
@brutal/state:build: 
@brutal/templates:build: 
@brutal/templates:build: > @brutal/templates@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/templates
@brutal/templates:build: > tsup src/index.ts
@brutal/templates:build: 
@brutal/routing:build: 
@brutal/routing:build: > @brutal/routing@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/routing
@brutal/routing:build: > tsup src/index.ts
@brutal/routing:build: 
@brutal/events:test: 
@brutal/events:test: > @brutal/events@0.0.0 test /workspaces/web/brutal-v5/packages/@brutal/events
@brutal/events:test: > jest
@brutal/events:test: 
@brutal/shared:test: 
@brutal/shared:test: > @brutal/shared@0.0.0 test /workspaces/web/brutal-v5/packages/@brutal/shared
@brutal/shared:test: > jest
@brutal/shared:test: 
@brutal/foundation:test: ReferenceError: module is not defined
@brutal/foundation:test:     at file:///workspaces/web/brutal-v5/packages/@brutal/foundation/jest.config.js:1:1
@brutal/foundation:test:     at ModuleJobSync.runSync (node:internal/modules/esm/module_job:400:35)
@brutal/foundation:test:     at ModuleLoader.importSyncForRequire (node:internal/modules/esm/loader:427:47)
@brutal/foundation:test:     at loadESMFromCJS (node:internal/modules/cjs/loader:1561:24)
@brutal/foundation:test:     at Module._compile (node:internal/modules/cjs/loader:1712:5)
@brutal/foundation:test:     at Object..js (node:internal/modules/cjs/loader:1895:10)
@brutal/foundation:test:     at Module.load (node:internal/modules/cjs/loader:1465:32)
@brutal/foundation:test:     at Function._load (node:internal/modules/cjs/loader:1282:12)
@brutal/foundation:test:     at TracingChannel.traceSync (node:diagnostics_channel:322:14)
@brutal/foundation:test:     at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
@brutal/foundation:test:  ELIFECYCLE  Test failed. See above for more details.
@brutal/foundation:test:  WARN   Local package.json exists, but node_modules missing, did you mean to install?
@brutal/scheduling:test: ReferenceError: module is not defined
@brutal/scheduling:test:     at file:///workspaces/web/brutal-v5/packages/@brutal/scheduling/jest.config.js:1:1
@brutal/scheduling:test:     at ModuleJobSync.runSync (node:internal/modules/esm/module_job:400:35)
@brutal/scheduling:test:     at ModuleLoader.importSyncForRequire (node:internal/modules/esm/loader:427:47)
@brutal/scheduling:test:     at loadESMFromCJS (node:internal/modules/cjs/loader:1561:24)
@brutal/scheduling:test:     at Module._compile (node:internal/modules/cjs/loader:1712:5)
@brutal/scheduling:test:     at Object..js (node:internal/modules/cjs/loader:1895:10)
@brutal/scheduling:test:     at Module.load (node:internal/modules/cjs/loader:1465:32)
@brutal/scheduling:test:     at Function._load (node:internal/modules/cjs/loader:1282:12)
@brutal/scheduling:test:     at TracingChannel.traceSync (node:diagnostics_channel:322:14)
@brutal/scheduling:test:     at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
@brutal/foundation:test: ERROR: command finished with error: command (/workspaces/web/brutal-v5/packages/@brutal/foundation) /home/codespace/.local/share/pnpm/.tools/pnpm/8.14.0/bin/pnpm run test exited (1)
@brutal/foundation#test: command (/workspaces/web/brutal-v5/packages/@brutal/foundation) /home/codespace/.local/share/pnpm/.tools/pnpm/8.14.0/bin/pnpm run test exited (1)

 Tasks:    6 successful, 16 total
Cached:    6 cached, 16 total
  Time:    5.241s 
Failed:    @brutal/foundation#test

 ERROR  run failed: command  exited (1)
 ELIFECYCLE  Test failed. See above for more details.
```

## 3. LINTING ERRORS AND WARNINGS
```

> brutal-v5@0.0.0 lint /workspaces/web/brutal-v5
> turbo lint

• Packages in scope: @brutal/a11y, @brutal/cache, @brutal/components, @brutal/events, @brutal/foundation, @brutal/plugins, @brutal/routing, @brutal/scheduling, @brutal/shared, @brutal/state, @brutal/templates
• Running lint in 11 packages
• Remote caching disabled
@brutal/cache:lint: cache miss, executing d4c49a0dd46959d7
@brutal/plugins:lint: cache miss, executing 0d0ccc1abfe4b58c
@brutal/foundation:lint: cache miss, executing fda90ba39b2c81f6
@brutal/shared:lint: cache miss, executing 617c362d581dc6e3
@brutal/routing:lint: cache miss, executing 5e0a27efa77866bc
@brutal/scheduling:lint: cache miss, executing b1ef51de0f05534f
@brutal/events:lint: cache miss, executing 0112729193f3fb48
@brutal/templates:lint: cache miss, executing 70aa1fc2302dcb7d
@brutal/components:lint: cache miss, executing 15cf80261d8b2d41
@brutal/a11y:lint: cache miss, executing fd2ec4d2487f657d
@brutal/scheduling:lint: 
@brutal/scheduling:lint: > @brutal/scheduling@0.0.0 lint /workspaces/web/brutal-v5/packages/@brutal/scheduling
@brutal/scheduling:lint: > eslint src --ext .ts
@brutal/scheduling:lint: 
@brutal/plugins:lint: 
@brutal/plugins:lint: > @brutal/plugins@0.0.0 lint /workspaces/web/brutal-v5/packages/@brutal/plugins
@brutal/plugins:lint: > eslint src --ext .ts
@brutal/plugins:lint: 
@brutal/shared:lint: 
@brutal/shared:lint: > @brutal/shared@0.0.0 lint /workspaces/web/brutal-v5/packages/@brutal/shared
@brutal/shared:lint: > eslint src --ext .ts
@brutal/shared:lint: 
@brutal/cache:lint: 
@brutal/cache:lint: > @brutal/cache@0.0.0 lint /workspaces/web/brutal-v5/packages/@brutal/cache
@brutal/cache:lint: > eslint src --ext .ts
@brutal/cache:lint: 
@brutal/components:lint: 
@brutal/components:lint: > @brutal/components@0.0.0 lint /workspaces/web/brutal-v5/packages/@brutal/components
@brutal/components:lint: > eslint src --ext .ts
@brutal/components:lint: 
@brutal/foundation:lint: 
@brutal/foundation:lint: > @brutal/foundation@0.0.0 lint /workspaces/web/brutal-v5/packages/@brutal/foundation
@brutal/foundation:lint: > eslint src --ext .ts
@brutal/foundation:lint: 
@brutal/routing:lint: 
@brutal/routing:lint: > @brutal/routing@0.0.0 lint /workspaces/web/brutal-v5/packages/@brutal/routing
@brutal/routing:lint: > eslint src --ext .ts
@brutal/routing:lint: 
@brutal/templates:lint: 
@brutal/templates:lint: > @brutal/templates@0.0.0 lint /workspaces/web/brutal-v5/packages/@brutal/templates
@brutal/templates:lint: > eslint src --ext .ts
@brutal/templates:lint: 
@brutal/a11y:lint: 
@brutal/a11y:lint: > @brutal/a11y@0.0.0 lint /workspaces/web/brutal-v5/packages/@brutal/a11y
@brutal/a11y:lint: > eslint src --ext .ts
@brutal/a11y:lint: 
@brutal/events:lint: 
@brutal/events:lint: > @brutal/events@0.0.0 lint /workspaces/web/brutal-v5/packages/@brutal/events
@brutal/events:lint: > eslint src --ext .ts
@brutal/events:lint: 
@brutal/scheduling:lint: 
@brutal/scheduling:lint: Oops! Something went wrong! :(
@brutal/scheduling:lint: 
@brutal/scheduling:lint: ESLint: 8.57.1
@brutal/scheduling:lint: 
@brutal/scheduling:lint: ReferenceError: Cannot read config file: /workspaces/web/brutal-v5/packages/@brutal/scheduling/.eslintrc.js
@brutal/scheduling:lint: Error: module is not defined
@brutal/scheduling:lint:     at file:///workspaces/web/brutal-v5/packages/@brutal/scheduling/.eslintrc.js:1:1
@brutal/scheduling:lint:     at ModuleJobSync.runSync (node:internal/modules/esm/module_job:400:35)
@brutal/scheduling:lint:     at ModuleLoader.importSyncForRequire (node:internal/modules/esm/loader:427:47)
@brutal/scheduling:lint:     at loadESMFromCJS (node:internal/modules/cjs/loader:1561:24)
@brutal/scheduling:lint:     at Module._compile (node:internal/modules/cjs/loader:1712:5)
@brutal/scheduling:lint:     at Object..js (node:internal/modules/cjs/loader:1895:10)
@brutal/scheduling:lint:     at Module.load (node:internal/modules/cjs/loader:1465:32)
@brutal/scheduling:lint:     at Function._load (node:internal/modules/cjs/loader:1282:12)
@brutal/scheduling:lint:     at TracingChannel.traceSync (node:diagnostics_channel:322:14)
@brutal/scheduling:lint:     at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
@brutal/scheduling:lint:  ELIFECYCLE  Command failed with exit code 2.
@brutal/shared:lint: 
@brutal/shared:lint: Oops! Something went wrong! :(
@brutal/shared:lint: 
@brutal/shared:lint: ESLint: 8.57.1
@brutal/shared:lint: 
@brutal/shared:lint: ReferenceError: Cannot read config file: /workspaces/web/brutal-v5/packages/@brutal/shared/.eslintrc.js
@brutal/shared:lint: Error: module is not defined
@brutal/shared:lint:     at file:///workspaces/web/brutal-v5/packages/@brutal/shared/.eslintrc.js:1:1
@brutal/shared:lint:     at ModuleJobSync.runSync (node:internal/modules/esm/module_job:400:35)
@brutal/shared:lint:     at ModuleLoader.importSyncForRequire (node:internal/modules/esm/loader:427:47)
@brutal/shared:lint:     at loadESMFromCJS (node:internal/modules/cjs/loader:1561:24)
@brutal/shared:lint:     at Module._compile (node:internal/modules/cjs/loader:1712:5)
@brutal/shared:lint:     at Object..js (node:internal/modules/cjs/loader:1895:10)
@brutal/shared:lint:     at Module.load (node:internal/modules/cjs/loader:1465:32)
@brutal/shared:lint:     at Function._load (node:internal/modules/cjs/loader:1282:12)
@brutal/shared:lint:     at TracingChannel.traceSync (node:diagnostics_channel:322:14)
@brutal/shared:lint:     at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
@brutal/scheduling:lint:  WARN   Local package.json exists, but node_modules missing, did you mean to install?
@brutal/shared:lint:  ELIFECYCLE  Command failed with exit code 2.
@brutal/shared:lint:  WARN   Local package.json exists, but node_modules missing, did you mean to install?
@brutal/plugins:lint: 
@brutal/plugins:lint: Oops! Something went wrong! :(
@brutal/plugins:lint: 
@brutal/plugins:lint: ESLint: 8.57.1
@brutal/plugins:lint: 
@brutal/plugins:lint: ReferenceError: Cannot read config file: /workspaces/web/brutal-v5/packages/@brutal/plugins/.eslintrc.js
@brutal/plugins:lint: Error: module is not defined
@brutal/plugins:lint:     at file:///workspaces/web/brutal-v5/packages/@brutal/plugins/.eslintrc.js:1:1
@brutal/plugins:lint:     at ModuleJobSync.runSync (node:internal/modules/esm/module_job:400:35)
@brutal/plugins:lint:     at ModuleLoader.importSyncForRequire (node:internal/modules/esm/loader:427:47)
@brutal/plugins:lint:     at loadESMFromCJS (node:internal/modules/cjs/loader:1561:24)
@brutal/plugins:lint:     at Module._compile (node:internal/modules/cjs/loader:1712:5)
@brutal/plugins:lint:     at Object..js (node:internal/modules/cjs/loader:1895:10)
@brutal/plugins:lint:     at Module.load (node:internal/modules/cjs/loader:1465:32)
@brutal/plugins:lint:     at Function._load (node:internal/modules/cjs/loader:1282:12)
@brutal/plugins:lint:     at TracingChannel.traceSync (node:diagnostics_channel:322:14)
@brutal/plugins:lint:     at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
@brutal/scheduling:lint: ERROR: command finished with error: command (/workspaces/web/brutal-v5/packages/@brutal/scheduling) /home/codespace/.local/share/pnpm/.tools/pnpm/8.14.0/bin/pnpm run lint exited (1)
@brutal/state:lint: cache miss, executing 8d2ca0e23ff24a5b
@brutal/scheduling#lint: command (/workspaces/web/brutal-v5/packages/@brutal/scheduling) /home/codespace/.local/share/pnpm/.tools/pnpm/8.14.0/bin/pnpm run lint exited (1)

 Tasks:    0 successful, 11 total
Cached:    0 cached, 11 total
  Time:    5.986s 
Failed:    @brutal/scheduling#lint

 ERROR  run failed: command  exited (1)
 ELIFECYCLE  Command failed with exit code 1.
```

## 4. TYPE CHECKING ERRORS
```

> brutal-v5@0.0.0 type-check /workspaces/web/brutal-v5
> turbo type-check

• Packages in scope: @brutal/a11y, @brutal/cache, @brutal/components, @brutal/events, @brutal/foundation, @brutal/plugins, @brutal/routing, @brutal/scheduling, @brutal/shared, @brutal/state, @brutal/templates
• Running type-check in 11 packages
• Remote caching disabled
@brutal/foundation:type-check: cache miss, executing bb081265a5a27174
@brutal/shared:type-check: cache miss, executing 0c8e9972438a0d19
@brutal/shared:build: cache hit, replaying logs d56575f20f5e6cc2
@brutal/shared:build: 
@brutal/shared:build: > @brutal/shared@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/shared
@brutal/shared:build: > tsup
@brutal/shared:build: 
@brutal/shared:build: CLI Building entry: src/index.ts
@brutal/shared:build: CLI Using tsconfig: tsconfig.json
@brutal/shared:build: CLI tsup v8.5.0
@brutal/shared:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/shared/tsup.config.ts
@brutal/shared:build: CLI Target: es2022
@brutal/shared:build: CLI Cleaning output folder
@brutal/shared:build: ESM Build start
@brutal/shared:build: ESM dist/index.js     2.16 KB
@brutal/shared:build: ESM dist/index.js.map 6.14 KB
@brutal/shared:build: ESM ⚡️ Build success in 331ms
@brutal/shared:build: ✅ Build successful
@brutal/shared:build: DTS Build start
@brutal/shared:build: DTS ⚡️ Build success in 4981ms
@brutal/shared:build: DTS dist/index.d.ts 490.00 B
@brutal/templates:build: cache miss, executing a97048eee6984287
@brutal/templates:type-check: cache miss, executing a583715ce3709b0c
@brutal/scheduling:type-check: cache miss, executing 1aafddb309360dc9
@brutal/cache:type-check: cache miss, executing e7e96ae2ca2eed5d
@brutal/routing:type-check: cache miss, executing 4b32037447b9dec8
@brutal/a11y:type-check: cache miss, executing 6b61b7de524975ef
@brutal/foundation:build: cache hit, replaying logs 22b033841c416293
@brutal/foundation:build: 
@brutal/foundation:build: > @brutal/foundation@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/foundation
@brutal/foundation:build: > tsup
@brutal/foundation:build: 
@brutal/foundation:build: CLI Building entry: src/index.ts
@brutal/foundation:build: CLI Using tsconfig: tsconfig.json
@brutal/foundation:build: CLI tsup v8.5.0
@brutal/foundation:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/foundation/tsup.config.ts
@brutal/foundation:build: CLI Target: es2022
@brutal/foundation:build: CLI Cleaning output folder
@brutal/foundation:build: ESM Build start
@brutal/foundation:build: ESM dist/index.js     3.08 KB
@brutal/foundation:build: ESM dist/index.js.map 9.29 KB
@brutal/foundation:build: ESM ⚡️ Build success in 181ms
@brutal/foundation:build: ✅ Build successful
@brutal/foundation:build: DTS Build start
@brutal/foundation:build: DTS ⚡️ Build success in 2713ms
@brutal/foundation:build: DTS dist/index.d.ts 553.00 B
@brutal/events:type-check: cache miss, executing 4471c098e12572b9
@brutal/events:build: cache hit, replaying logs 3e98849f8915fbbb
@brutal/events:build: 
@brutal/events:build: > @brutal/events@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/events
@brutal/events:build: > tsup
@brutal/events:build: 
@brutal/events:build: CLI Building entry: src/index.ts
@brutal/events:build: CLI Using tsconfig: tsconfig.json
@brutal/events:build: CLI tsup v8.5.0
@brutal/events:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/events/tsup.config.ts
@brutal/events:build: CLI Target: es2022
@brutal/events:build: CLI Cleaning output folder
@brutal/events:build: ESM Build start
@brutal/events:build: ESM dist/index.js     1.72 KB
@brutal/events:build: ESM dist/index.js.map 5.17 KB
@brutal/events:build: ESM ⚡️ Build success in 101ms
@brutal/events:build: ✅ Build successful
@brutal/events:build: DTS Build start
@brutal/events:build: DTS ⚡️ Build success in 2215ms
@brutal/events:build: DTS dist/index.d.ts 391.00 B
@brutal/plugins:type-check: cache miss, executing 04962b43c70119f5
@brutal/scheduling:type-check: 
@brutal/scheduling:type-check: > @brutal/scheduling@0.0.0 type-check /workspaces/web/brutal-v5/packages/@brutal/scheduling
@brutal/scheduling:type-check: > tsc --noEmit
@brutal/scheduling:type-check: 
@brutal/plugins:type-check: 
@brutal/plugins:type-check: > @brutal/plugins@0.0.0 type-check /workspaces/web/brutal-v5/packages/@brutal/plugins
@brutal/plugins:type-check: > tsc --noEmit
@brutal/plugins:type-check: 
@brutal/cache:type-check: 
@brutal/cache:type-check: > @brutal/cache@0.0.0 type-check /workspaces/web/brutal-v5/packages/@brutal/cache
@brutal/cache:type-check: > tsc --noEmit
@brutal/cache:type-check: 
@brutal/events:type-check: 
@brutal/events:type-check: > @brutal/events@0.0.0 type-check /workspaces/web/brutal-v5/packages/@brutal/events
@brutal/events:type-check: > tsc --noEmit
@brutal/events:type-check: 
@brutal/foundation:type-check: 
@brutal/foundation:type-check: > @brutal/foundation@0.0.0 type-check /workspaces/web/brutal-v5/packages/@brutal/foundation
@brutal/foundation:type-check: > tsc --noEmit
@brutal/foundation:type-check: 
@brutal/shared:type-check: 
@brutal/shared:type-check: > @brutal/shared@0.0.0 type-check /workspaces/web/brutal-v5/packages/@brutal/shared
@brutal/shared:type-check: > tsc --noEmit
@brutal/shared:type-check: 
@brutal/templates:type-check: 
@brutal/templates:type-check: > @brutal/templates@0.0.0 type-check /workspaces/web/brutal-v5/packages/@brutal/templates
@brutal/templates:type-check: > tsc --noEmit
@brutal/templates:type-check: 
@brutal/routing:type-check: 
@brutal/routing:type-check: > @brutal/routing@0.0.0 type-check /workspaces/web/brutal-v5/packages/@brutal/routing
@brutal/routing:type-check: > tsc --noEmit
@brutal/routing:type-check: 
@brutal/a11y:type-check: 
@brutal/a11y:type-check: > @brutal/a11y@0.0.0 type-check /workspaces/web/brutal-v5/packages/@brutal/a11y
@brutal/a11y:type-check: > tsc --noEmit
@brutal/a11y:type-check: 
@brutal/templates:build: 
@brutal/templates:build: > @brutal/templates@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/templates
@brutal/templates:build: > tsup src/index.ts
@brutal/templates:build: 
@brutal/templates:build: CLI Building entry: src/index.ts
@brutal/templates:build: CLI Using tsconfig: tsconfig.json
@brutal/templates:build: CLI tsup v8.5.0
@brutal/templates:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/templates/tsup.config.ts
@brutal/templates:build: CLI Target: es2022
@brutal/templates:build: CLI Cleaning output folder
@brutal/templates:build: ESM Build start
@brutal/templates:build: ESM dist/index.js     4.48 KB
@brutal/templates:build: ESM dist/index.js.map 10.77 KB
@brutal/templates:build: ESM ⚡️ Build success in 290ms
@brutal/templates:build: ✅ Build successful
@brutal/templates:build: DTS Build start
@brutal/scheduling:type-check: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:type-check: tsconfig.json(6,5): error TS5069: Option 'declarationDir' cannot be specified without specifying option 'declaration' or option 'composite'.
@brutal/scheduling:type-check:  ELIFECYCLE  Command failed with exit code 2.
@brutal/scheduling:type-check:  WARN   Local package.json exists, but node_modules missing, did you mean to install?
@brutal/plugins:type-check: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:type-check: tsconfig.json(6,5): error TS5069: Option 'declarationDir' cannot be specified without specifying option 'declaration' or option 'composite'.
@brutal/scheduling:type-check: ERROR: command finished with error: command (/workspaces/web/brutal-v5/packages/@brutal/scheduling) /home/codespace/.local/share/pnpm/.tools/pnpm/8.14.0/bin/pnpm run type-check exited (1)
@brutal/state:type-check: cache miss, executing 8053f8697bdff11a
@brutal/scheduling#type-check: command (/workspaces/web/brutal-v5/packages/@brutal/scheduling) /home/codespace/.local/share/pnpm/.tools/pnpm/8.14.0/bin/pnpm run type-check exited (1)

 Tasks:    3 successful, 14 total
Cached:    3 cached, 14 total
  Time:    22.335s 
Failed:    @brutal/scheduling#type-check

 ERROR  run failed: command  exited (1)
 ELIFECYCLE  Command failed with exit code 1.
```

## 5. BUNDLE SIZE CHECK
```

> brutal-v5@0.0.0 size /workspaces/web/brutal-v5
> turbo size

• Packages in scope: @brutal/a11y, @brutal/cache, @brutal/components, @brutal/events, @brutal/foundation, @brutal/plugins, @brutal/routing, @brutal/scheduling, @brutal/shared, @brutal/state, @brutal/templates
• Running size in 11 packages
• Remote caching disabled
@brutal/cache:build: cache miss, executing 6ce6c39b3666f598
@brutal/shared:build: cache hit, replaying logs d56575f20f5e6cc2
@brutal/shared:build: 
@brutal/shared:build: > @brutal/shared@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/shared
@brutal/shared:build: > tsup
@brutal/shared:build: 
@brutal/shared:build: CLI Building entry: src/index.ts
@brutal/shared:build: CLI Using tsconfig: tsconfig.json
@brutal/shared:build: CLI tsup v8.5.0
@brutal/shared:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/shared/tsup.config.ts
@brutal/shared:build: CLI Target: es2022
@brutal/shared:build: CLI Cleaning output folder
@brutal/shared:build: ESM Build start
@brutal/shared:build: ESM dist/index.js     2.16 KB
@brutal/shared:build: ESM dist/index.js.map 6.14 KB
@brutal/shared:build: ESM ⚡️ Build success in 331ms
@brutal/shared:build: ✅ Build successful
@brutal/shared:build: DTS Build start
@brutal/shared:build: DTS ⚡️ Build success in 4981ms
@brutal/shared:build: DTS dist/index.d.ts 490.00 B
@brutal/scheduling:build: cache hit, replaying logs 67b73022a9dbe119
@brutal/scheduling:build: 
@brutal/scheduling:build: > @brutal/scheduling@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/scheduling
@brutal/scheduling:build: > tsup
@brutal/scheduling:build: 
@brutal/scheduling:build: ▲ [WARNING] Cannot find base config file "../../tsconfig.json" [tsconfig.json]
@brutal/scheduling:build: 
@brutal/scheduling:build:     tsconfig.json:2:13:
@brutal/scheduling:build:       2 │   "extends": "../../tsconfig.json",
@brutal/scheduling:build:         ╵              ~~~~~~~~~~~~~~~~~~~~~
@brutal/scheduling:build: 
@brutal/scheduling:build: CLI Building entry: src/index.ts
@brutal/scheduling:build: CLI Using tsconfig: tsconfig.json
@brutal/scheduling:build: CLI tsup v8.5.0
@brutal/scheduling:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/scheduling/tsup.config.ts
@brutal/scheduling:build: CLI Target: es2022
@brutal/scheduling:build: CLI Cleaning output folder
@brutal/scheduling:build: ESM Build start
@brutal/scheduling:build: 
@brutal/scheduling:build:  WARN  [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mCannot find base config file "../../tsconfig.json"[0m [tsconfig.json]
@brutal/scheduling:build: 
@brutal/scheduling:build:     tsconfig.json:2:13:
@brutal/scheduling:build: [37m      2 │   "extends": [32m"../../tsconfig.json"[37m,
@brutal/scheduling:build:         ╵              [32m~~~~~~~~~~~~~~~~~~~~~[0m
@brutal/scheduling:build: 
@brutal/scheduling:build: 
@brutal/scheduling:build: 
@brutal/scheduling:build: ESM dist/index.js     1.29 KB
@brutal/scheduling:build: ESM dist/index.js.map 3.90 KB
@brutal/scheduling:build: ESM ⚡️ Build success in 475ms
@brutal/scheduling:build: DTS Build start
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/scheduling:build: 
@brutal/scheduling:build: DTS ⚡️ Build success in 10552ms
@brutal/scheduling:build: DTS dist/index.d.ts 1.21 KB
@brutal/routing:build: cache miss, executing eea09cc723936112
@brutal/a11y:build: cache hit, replaying logs 061d980106dc8eb6
@brutal/a11y:build: 
@brutal/a11y:build: > @brutal/a11y@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/a11y
@brutal/a11y:build: > tsup
@brutal/a11y:build: 
@brutal/a11y:build: ▲ [WARNING] Cannot find base config file "../../tsconfig.json" [tsconfig.json]
@brutal/a11y:build: 
@brutal/a11y:build:     tsconfig.json:2:13:
@brutal/a11y:build:       2 │   "extends": "../../tsconfig.json",
@brutal/a11y:build:         ╵              ~~~~~~~~~~~~~~~~~~~~~
@brutal/a11y:build: 
@brutal/a11y:build: CLI Building entry: src/index.ts
@brutal/a11y:build: CLI Using tsconfig: tsconfig.json
@brutal/a11y:build: CLI tsup v8.5.0
@brutal/a11y:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/a11y/tsup.config.ts
@brutal/a11y:build: CLI Target: es2022
@brutal/a11y:build: CLI Cleaning output folder
@brutal/a11y:build: ESM Build start
@brutal/a11y:build: 
@brutal/a11y:build:  WARN  [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mCannot find base config file "../../tsconfig.json"[0m [tsconfig.json]
@brutal/a11y:build: 
@brutal/a11y:build:     tsconfig.json:2:13:
@brutal/a11y:build: [37m      2 │   "extends": [32m"../../tsconfig.json"[37m,
@brutal/a11y:build:         ╵              [32m~~~~~~~~~~~~~~~~~~~~~[0m
@brutal/a11y:build: 
@brutal/a11y:build: 
@brutal/a11y:build: 
@brutal/a11y:build: ESM dist/index.js     1.28 KB
@brutal/a11y:build: ESM dist/index.js.map 3.88 KB
@brutal/a11y:build: ESM ⚡️ Build success in 282ms
@brutal/a11y:build: ✅ Build successful
@brutal/a11y:build: DTS Build start
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/a11y:build: 
@brutal/a11y:build: DTS ⚡️ Build success in 4767ms
@brutal/a11y:build: DTS dist/index.d.ts 330.00 B
@brutal/templates:build: cache miss, executing a97048eee6984287
@brutal/events:build: cache hit, replaying logs 3e98849f8915fbbb
@brutal/events:build: 
@brutal/events:build: > @brutal/events@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/events
@brutal/events:build: > tsup
@brutal/events:build: 
@brutal/events:build: CLI Building entry: src/index.ts
@brutal/events:build: CLI Using tsconfig: tsconfig.json
@brutal/events:build: CLI tsup v8.5.0
@brutal/events:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/events/tsup.config.ts
@brutal/events:build: CLI Target: es2022
@brutal/events:build: CLI Cleaning output folder
@brutal/events:build: ESM Build start
@brutal/events:build: ESM dist/index.js     1.72 KB
@brutal/events:build: ESM dist/index.js.map 5.17 KB
@brutal/events:build: ESM ⚡️ Build success in 101ms
@brutal/events:build: ✅ Build successful
@brutal/events:build: DTS Build start
@brutal/events:build: DTS ⚡️ Build success in 2215ms
@brutal/events:build: DTS dist/index.d.ts 391.00 B
@brutal/a11y:size: cache miss, executing 38941aa990aa54c8
@brutal/scheduling:size: cache miss, executing 77e77f42a8951f69
@brutal/foundation:build: cache hit, replaying logs 22b033841c416293
@brutal/foundation:build: 
@brutal/foundation:build: > @brutal/foundation@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/foundation
@brutal/foundation:build: > tsup
@brutal/foundation:build: 
@brutal/foundation:build: CLI Building entry: src/index.ts
@brutal/foundation:build: CLI Using tsconfig: tsconfig.json
@brutal/foundation:build: CLI tsup v8.5.0
@brutal/foundation:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/foundation/tsup.config.ts
@brutal/foundation:build: CLI Target: es2022
@brutal/foundation:build: CLI Cleaning output folder
@brutal/foundation:build: ESM Build start
@brutal/foundation:build: ESM dist/index.js     3.08 KB
@brutal/foundation:build: ESM dist/index.js.map 9.29 KB
@brutal/foundation:build: ESM ⚡️ Build success in 181ms
@brutal/foundation:build: ✅ Build successful
@brutal/foundation:build: DTS Build start
@brutal/foundation:build: DTS ⚡️ Build success in 2713ms
@brutal/foundation:build: DTS dist/index.d.ts 553.00 B
@brutal/shared:size: cache miss, executing 786ee419390b4454
@brutal/state:build: cache miss, executing c66bb73283faf9b9
@brutal/plugins:build: cache hit, replaying logs 11a67a59402e4710
@brutal/plugins:build: 
@brutal/plugins:build: > @brutal/plugins@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/plugins
@brutal/plugins:build: > tsup
@brutal/plugins:build: 
@brutal/plugins:build: ▲ [WARNING] Cannot find base config file "../../tsconfig.json" [tsconfig.json]
@brutal/plugins:build: 
@brutal/plugins:build:     tsconfig.json:2:13:
@brutal/plugins:build:       2 │   "extends": "../../tsconfig.json",
@brutal/plugins:build:         ╵              ~~~~~~~~~~~~~~~~~~~~~
@brutal/plugins:build: 
@brutal/plugins:build: CLI Building entry: src/index.ts
@brutal/plugins:build: CLI Using tsconfig: tsconfig.json
@brutal/plugins:build: CLI tsup v8.5.0
@brutal/plugins:build: CLI Using tsup config: /workspaces/web/brutal-v5/packages/@brutal/plugins/tsup.config.ts
@brutal/plugins:build: CLI Target: es2022
@brutal/plugins:build: CLI Cleaning output folder
@brutal/plugins:build: ESM Build start
@brutal/plugins:build: 
@brutal/plugins:build:  WARN  [33m▲ [43;33m[[43;30mWARNING[43;33m][0m [1mCannot find base config file "../../tsconfig.json"[0m [tsconfig.json]
@brutal/plugins:build: 
@brutal/plugins:build:     tsconfig.json:2:13:
@brutal/plugins:build: [37m      2 │   "extends": [32m"../../tsconfig.json"[37m,
@brutal/plugins:build:         ╵              [32m~~~~~~~~~~~~~~~~~~~~~[0m
@brutal/plugins:build: 
@brutal/plugins:build: 
@brutal/plugins:build: 
@brutal/plugins:build: ESM dist/index.js     1.29 KB
@brutal/plugins:build: ESM dist/index.js.map 3.89 KB
@brutal/plugins:build: ESM ⚡️ Build success in 109ms
@brutal/plugins:build: ✅ Build successful
@brutal/plugins:build: DTS Build start
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: error TS5083: Cannot read file '/workspaces/web/brutal-v5/packages/tsconfig.json'.
@brutal/plugins:build: 
@brutal/plugins:build: DTS ⚡️ Build success in 2327ms
@brutal/plugins:build: DTS dist/index.d.ts 336.00 B
@brutal/events:size: cache miss, executing be1ce8417e2f00aa
@brutal/foundation:size: cache miss, executing 6fbede325dae95af
@brutal/plugins:size: cache miss, executing ee49e177868f6b07
@brutal/events:size: 
@brutal/events:size: > @brutal/events@0.0.0 size /workspaces/web/brutal-v5/packages/@brutal/events
@brutal/events:size: > size-limit
@brutal/events:size: 
@brutal/state:build: 
@brutal/state:build: > @brutal/state@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/state
@brutal/state:build: > tsup
@brutal/state:build: 
@brutal/a11y:size: 
@brutal/a11y:size: > @brutal/a11y@0.0.0 size /workspaces/web/brutal-v5/packages/@brutal/a11y
@brutal/a11y:size: > size-limit
@brutal/a11y:size: 
@brutal/routing:build: 
@brutal/routing:build: > @brutal/routing@0.0.0 build /workspaces/web/brutal-v5/packages/@brutal/routing
@brutal/routing:build: > tsup src/index.ts
@brutal/routing:build: 
@brutal/scheduling:size: 
@brutal/scheduling:size: > @brutal/scheduling@0.0.0 size /workspaces/web/brutal-v5/packages/@brutal/scheduling
@brutal/scheduling:size: > size-limit
@brutal/scheduling:size: 
@brutal/events:size: Install Size Limit preset depends on type of the project
@brutal/events:size: 
@brutal/events:size: For application, where you send JS bundle directly to users
@brutal/events:size:   npm install --save-dev @size-limit/preset-app
@brutal/events:size: 
@brutal/events:size: For frameworks, components and big libraries
@brutal/events:size:   npm install --save-dev @size-limit/preset-big-lib
@brutal/events:size: 
@brutal/events:size: For small (< 10 kB) libraries
@brutal/events:size:   npm install --save-dev @size-limit/preset-small-lib
@brutal/events:size: 
@brutal/events:size: Check out docs for more complicated cases
@brutal/events:size:   https://github.com/ai/size-limit/
@brutal/events:size: 
@brutal/events:size: You need to add size-limit dependency: npm install --save-dev size-limit
@brutal/events:size:  ELIFECYCLE  Command failed with exit code 1.
@brutal/a11y:size: Install Size Limit preset depends on type of the project
@brutal/a11y:size: 
@brutal/a11y:size: For application, where you send JS bundle directly to users
@brutal/a11y:size:   npm install --save-dev @size-limit/preset-app
@brutal/a11y:size: 
@brutal/a11y:size: For frameworks, components and big libraries
@brutal/a11y:size:   npm install --save-dev @size-limit/preset-big-lib
@brutal/a11y:size: 
@brutal/a11y:size: For small (< 10 kB) libraries
@brutal/a11y:size:   npm install --save-dev @size-limit/preset-small-lib
@brutal/a11y:size: 
@brutal/a11y:size: Check out docs for more complicated cases
@brutal/a11y:size:   https://github.com/ai/size-limit/
@brutal/a11y:size: 
@brutal/a11y:size: You need to add size-limit dependency: npm install --save-dev size-limit
@brutal/a11y:size:  ELIFECYCLE  Command failed with exit code 1.
@brutal/a11y:size:  WARN   Local package.json exists, but node_modules missing, did you mean to install?
@brutal/events:size: ERROR: command finished with error: command (/workspaces/web/brutal-v5/packages/@brutal/events) /home/codespace/.local/share/pnpm/.tools/pnpm/8.14.0/bin/pnpm run size exited (1)
@brutal/events#size: command (/workspaces/web/brutal-v5/packages/@brutal/events) /home/codespace/.local/share/pnpm/.tools/pnpm/8.14.0/bin/pnpm run size exited (1)

 Tasks:    6 successful, 16 total
Cached:    6 cached, 16 total
  Time:    4.487s 
Failed:    @brutal/events#size

 ERROR  run failed: command  exited (1)
 ELIFECYCLE  Command failed with exit code 1.
```

## 6. STRUCTURE VALIDATION
```

> brutal-v5@0.0.0 validate:structure /workspaces/web/brutal-v5
> node scripts/validate-structure.js

[1m[34m
🔍 BRUTAL V5 - Structure Validator
[0m[0m
[1m
📦 Validating @brutal/a11y...[0m
[32m  ✅ Structure is perfect![0m
[1m
📦 Validating @brutal/cache...[0m
[32m  ✅ Structure is perfect![0m
[1m
📦 Validating @brutal/components...[0m
[32m  ✅ Structure is perfect![0m
[1m
📦 Validating @brutal/events...[0m
[32m  ✅ Structure is perfect![0m
[1m
📦 Validating @brutal/foundation...[0m
[32m  ✅ Structure is perfect![0m
[1m
📦 Validating @brutal/plugins...[0m
[32m  ✅ Structure is perfect![0m
[1m
📦 Validating @brutal/routing...[0m
[32m  ✅ Structure is perfect![0m
[1m
📦 Validating @brutal/scheduling...[0m
[32m  ✅ Structure is perfect![0m
[1m
📦 Validating @brutal/shared...[0m
[32m  ✅ Structure is perfect![0m
[1m
📦 Validating @brutal/state...[0m
[32m  ✅ Structure is perfect![0m
[1m
📦 Validating @brutal/templates...[0m
[32m  ✅ Structure is perfect![0m
[1m[34m
📊 Validation Summary
[0m[0m
Total packages scanned: 11
[32mValid packages: 11[0m
[31mInvalid packages: 0[0m

Average test coverage: 100.0%
[1m
✅ All checks passed!
[0m
```

## 7. DEPENDENCY CHECK
```

> brutal-v5@0.0.0 check:dependencies /workspaces/web/brutal-v5
> node scripts/check-dependencies.js

[1m[34m
🔗 BRUTAL V5 - Dependency Validator
[0m[0m

📦 Validating dependencies for @brutal/a11y...
[32m  ✅ Dependencies valid[0m

📦 Validating dependencies for @brutal/cache...
[32m  ✅ Dependencies valid[0m

📦 Validating dependencies for @brutal/components...
[32m  ✅ Dependencies valid[0m

📦 Validating dependencies for @brutal/events...
[32m  ✅ Dependencies valid[0m

📦 Validating dependencies for @brutal/foundation...
[32m  ✅ Dependencies valid[0m

📦 Validating dependencies for @brutal/plugins...
[32m  ✅ Dependencies valid[0m

📦 Validating dependencies for @brutal/routing...
[32m  ✅ Dependencies valid[0m

📦 Validating dependencies for @brutal/scheduling...
[32m  ✅ Dependencies valid[0m

📦 Validating dependencies for @brutal/shared...
[32m  ✅ Dependencies valid[0m

📦 Validating dependencies for @brutal/state...
[32m  ✅ Dependencies valid[0m

📦 Validating dependencies for @brutal/templates...
[32m  ✅ Dependencies valid[0m

🔄 Checking for circular dependencies...
[32m  ✅ No circular dependencies found[0m

📋 Validating build order...
[32m  ✅ Valid build order determined:[0m

     Stage 1: @brutal/foundation, @brutal/shared, @brutal/scheduling, @brutal/a11y

     Stage 2: @brutal/events, @brutal/templates, @brutal/cache, @brutal/gpu, @brutal/workers, @brutal/i18n, @brutal/security, @brutal/ai

     Stage 3: @brutal/animation, @brutal/performance, @brutal/state, @brutal/routing, @brutal/plugins

     Stage 4: @brutal/components

     Stage 5: @brutal/enhanced-state, @brutal/enhanced-routing

     Stage 6: @brutal/pwa

     Stage 7: @brutal/enhanced-components

     Stage 8: @brutal/forms, @brutal/ui-primitives, @brutal/data, @brutal/debug

     Stage 9: @brutal/testing

     Stage 10: @brutal/mobile
[1m[34m
📊 Dependency Validation Summary
[0m[0m
Total packages analyzed: 11
Packages in dependency graph: 28
[33m
⚠️  Warnings: 3[0m
[33m   @brutal/cache: Missing expected dependencies: @brutal/shared[0m
[33m   @brutal/routing: Missing expected dependencies: @brutal/events, @brutal/shared[0m
[33m   @brutal/templates: Missing expected dependencies: @brutal/shared[0m
[1m
✅ All dependency checks passed!
[0m
```

## 8. MISSING CONFIGURATION FILES
```
```

## 9. CONFIGURATION FILE ANALYSIS
```
-rw-rw-rw- 1 codespace codespace 1315 Jul 12 18:27 /workspaces/web/brutal-v5/tsconfig.json

Checking for root config files:
-rw-rw-rw- 1 codespace codespace     54 Jul 12 19:22 /workspaces/web/brutal-v5/.eslintrc.js
-rw-rw-rw- 1 codespace codespace 336420 Jul 12 18:41 /workspaces/web/brutal-v5/package-lock.json
-rw-rw-rw- 1 codespace codespace   2187 Jul 12 19:22 /workspaces/web/brutal-v5/package.json
-rw-rw-rw- 1 codespace codespace   1315 Jul 12 18:27 /workspaces/web/brutal-v5/tsconfig.json
-rw-rw-rw- 1 codespace codespace    777 Jul 12 18:02 /workspaces/web/brutal-v5/turbo.json
```


# ERROR AND WARNING SUMMARY

## CRITICAL ERRORS (BUILD BLOCKERS)

### 1. TypeScript Build Errors
- **@brutal/templates**: Type error TS2345 - Argument of type 'string  < /dev/null |  undefined' is not assignable to parameter of type 'string'
  - Location: src/engine/engine.ts(26,22)
  - Impact: Build fails for @brutal/templates package

### 2. Missing tsconfig.json Base File
- **Multiple packages** (@brutal/a11y, @brutal/plugins, @brutal/scheduling): Cannot find base config file '../../tsconfig.json'
  - These packages are looking for tsconfig.json two directories up instead of at the root
  - Causes TS5083 errors during build

### 3. ESLint Configuration Errors
- **All packages**: 'module is not defined' error in .eslintrc.js files
  - Root cause: Project is configured as ESM (type: 'module') but .eslintrc.js files use CommonJS syntax
  - Impact: Linting completely fails for all packages

### 4. Jest Configuration Errors
- **All packages**: 'module is not defined' error in jest.config.js files
  - Root cause: Same ESM/CommonJS mismatch as ESLint
  - Impact: Tests cannot run for any package

### 5. TypeScript Compilation Errors
- **Multiple packages**: error TS5069 - Option 'declarationDir' cannot be specified without 'declaration' or 'composite'
  - tsconfig.json files are missing required TypeScript options

### 6. Size Limit Configuration
- **All packages**: size-limit command fails due to missing dependencies
  - Missing @size-limit/preset-* packages
  - size-limit configuration not properly set up in package.json files

## WARNINGS

### 1. Missing Package Dependencies
- **@brutal/cache**: Missing dependency on @brutal/shared
- **@brutal/routing**: Missing dependencies on @brutal/events and @brutal/shared
- **@brutal/templates**: Missing dependency on @brutal/shared

### 2. Node Modules Warning
- Multiple packages show warning: 'Local package.json exists, but node_modules missing'
  - Indicates pnpm install may not have been run properly

## SUMMARY BY SEVERITY

1. **Build completely fails** for @brutal/templates due to TypeScript error
2. **All testing is broken** due to Jest configuration issues
3. **All linting is broken** due to ESLint configuration issues
4. **Type checking fails** for multiple packages
5. **Size checking fails** for all packages

**Total packages affected**: 11/11 (100%)

## RECOMMENDED FIX ORDER

1. Fix ESM/CommonJS configuration mismatch (affects ESLint and Jest)
2. Fix tsconfig.json path references in package configs
3. Fix TypeScript error in @brutal/templates
4. Add missing TypeScript compiler options
5. Install and configure size-limit properly
6. Add missing package dependencies


## ADDITIONAL CHECKS

### Checking node_modules installation:
```
total 2332
drwxrwxrwx+ 480 codespace codespace  20480 Jul 12 20:35 .
drwxrwxrwx+  19 codespace codespace   4096 Jul 12 20:38 ..
drwxrwxrwx+   2 codespace codespace   4096 Jul 12 20:35 .bin
drwxrwxrwx+   3 codespace codespace   4096 Jul 12 18:26 .cache
drwxrwxrwx+  17 codespace codespace   4096 Jul 12 19:09 .ignored
-rw-rw-rw-    1 codespace codespace  37572 Jul 12 20:35 .modules.yaml
-rw-rw-rw-    1 codespace codespace 313607 Jul 12 18:41 .package-lock.json
drwxrwxrwx+ 633 codespace codespace  36864 Jul 12 20:35 .pnpm
drwxrwxrwx+   3 codespace codespace   4096 Jul 12 18:24 @ampproject
drwxrwxrwx+  37 codespace codespace   4096 Jul 12 18:24 @babel
drwxrwxrwx+   3 codespace codespace   4096 Jul 12 18:24 @bcoe
drwxrwxrwx+  18 codespace codespace   4096 Jul 12 19:10 @changesets
drwxrwxrwx+   3 codespace codespace   4096 Jul 12 18:41 @esbuild
drwxrwxrwx+   4 codespace codespace   4096 Jul 12 18:24 @eslint
drwxrwxrwx+   4 codespace codespace   4096 Jul 12 18:24 @eslint-community
drwxrwxrwx+   5 codespace codespace   4096 Jul 12 18:24 @humanwhocodes
drwxrwxrwx+   3 codespace codespace   4096 Jul 12 18:24 @isaacs
drwxrwxrwx+   4 codespace codespace   4096 Jul 12 18:24 @istanbuljs
drwxrwxrwx+  16 codespace codespace   4096 Jul 12 18:24 @jest

### Checking if packages have node_modules:
/workspaces/web/brutal-v5/packages/@brutal/state/node_modules
/workspaces/web/brutal-v5/packages/@brutal/components/node_modules
/workspaces/web/brutal-v5/packages/@brutal/plugins/node_modules
/workspaces/web/brutal-v5/packages/@brutal/events/node_modules
```

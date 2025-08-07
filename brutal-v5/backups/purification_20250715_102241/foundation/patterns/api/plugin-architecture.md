# Plugin Architecture Pattern

## Problem
Frameworks need to be extensible without modifying core code, but uncontrolled extension points lead to fragility and security issues.

## Solution
Controlled plugin system with explicit extension points, event-based communication, and sandboxed execution.

### Plugin Interface
```typescript
interface IBrutalPlugin {
  name: string;
  version: string;
  install(context: IPluginContext): void;
  uninstall?(): void;
}

interface IPluginContext {
  events: EventBus;
  shared: SharedUtilities;
  registerComponent?(name: string, component: Component): void;
  registerTransform?(phase: 'pre' | 'post', fn: Transform): void;
}
```

### Extension Points
1. **Runtime Extensions**
   - Component registration
   - Event interception
   - State transformation
   
2. **Build-time Plugins**
   - Code transforms
   - Bundle optimization
   - Custom compilation

3. **Lifecycle Hooks**
   ```typescript
   plugin.install({
     events: {
       on('component:mount', handler),
       on('state:change', handler),
       on('route:navigate', handler)
     }
   });
   ```

### Security Model
- No direct DOM access
- Event-based communication only
- Capability-based permissions
- Sandboxed execution context

## Evolution
- V3: Direct modifications, no plugin system
- V4: Planned but not implemented
- V5: Secure, controlled plugin architecture

## Trade-offs
- ✅ Safe extensibility
- ✅ Backward compatibility
- ✅ Clear boundaries
- ❌ Some performance overhead
- ❌ Limited access to internals

## Related
- [Event System](../core/event-system.md)
- [Security-First Design](../security/security-first-design.md)
- [Package Exports](./package-exports.md)
# 📋 Day 3 - Critical TODO List

**MUST START HERE** - No deviations until checkpoint complete

## 🚨 CRITICAL: Day 3 Checkpoint

### 1. Build Complete TODO App ⏰
**File**: `/workspaces/web/brutal-v6/examples/todo-complete.html`
- [ ] Integrate all 3 packages (@brutal/core, @brutal/dom, @brutal/state)
- [ ] Must work in < 50 lines total
- [ ] Include ALL standard TODO features:
  - Add todos
  - Toggle complete
  - Filter (all/active/completed)
  - Clear completed
  - Item count
- [ ] Test in browser
- [ ] Document line count

**Success Criteria**: If this doesn't work, STOP and reassess

## 🏗️ After Checkpoint Success

### 2. Design @brutal/events
**File**: `/workspaces/web/brutal-v6/packages/@brutal/events/DESIGN.md`
- [ ] Event delegation system
- [ ] Budget: 1KB max
- [ ] Must integrate with compose pattern
- [ ] Support custom events

### 3. Implement @brutal/events
- [ ] Core delegation logic
- [ ] withEvents integration
- [ ] Custom event support
- [ ] Bundle and verify < 1KB

### 4. Design @brutal/router
**File**: `/workspaces/web/brutal-v6/packages/@brutal/router/DESIGN.md`
- [ ] SPA routing without hash
- [ ] Budget: 1KB max
- [ ] Route matching
- [ ] History API integration

### 5. Implement @brutal/router
- [ ] Route registration
- [ ] Navigation handling
- [ ] withRouter behavior
- [ ] Bundle and verify < 1KB

## 📊 End of Day 3 Targets

- [ ] TODO app working (checkpoint ✅)
- [ ] 5 of 7 packages complete
- [ ] Total size < 5KB
- [ ] Can build SPA with routing

## ⚠️ Risk Mitigation

If behind schedule:
1. Skip animations for now
2. Focus on router (critical for SPA claim)
3. Document honestly what's missing

## 🔍 Alignment Checks

Every 2 hours ask:
1. Is the API getting cryptic?
2. Are we adding unnecessary features?
3. Will a developer say "why use React?"

## 💡 Remember

- Don't optimize prematurely
- Don't add features not needed for TODO/SPA
- Keep it BRUTAL (simple, direct, fast)

---

**First action**: Open `/workspaces/web/brutal-v6/examples/todo-complete.html` and build the TODO app.
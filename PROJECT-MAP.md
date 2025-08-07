# 🗺️ BRUTAL Project Map

Quick reference for navigating the BRUTAL ecosystem.

## 📍 Starting Points

### For Users
- **Production App?** → [framework-v3](./framework-v3) (206KB, complete)
- **Curious about 8.5KB?** → [brutal-v6](./brutal-v6) (3.2KB, 43% done)
- **Enterprise needs?** → [brutal-v5](./brutal-v5) (monorepo ready)

### For Contributors  
- **Help V6?** → [brutal-v6/OPERATIONAL-STATUS-2025-08-07.md](./brutal-v6/OPERATIONAL-STATUS-2025-08-07.md)
- **Understand history?** → [docs/framework-history](./docs/framework-history)
- **Run tests?** → [brutal-test](./brutal-test)

## 📊 Version Comparison

```
V3: [████████████████████] 100% - Production Ready
V4: [████████████████████] 100% - GPU Features Complete  
V5: [████████████████████] 100% - Architecture Complete
V6: [████████░░░░░░░░░░░░] 43%  - Core Working, Router Needed
```

## 🚀 Quick Commands

```bash
# V3 - Production
cd framework-v3 && npm start

# V6 - Experimental  
cd brutal-v6 && npm run dev

# V5 - Enterprise
cd brutal-v5 && npm run dev

# Run all tests
cd brutal-test && npm test
```

## 📁 Key Files

### Documentation
- [README.md](./README.md) - Main overview
- [brutal-v6/NORTH-STAR.md](./brutal-v6/NORTH-STAR.md) - V6 vision
- [brutal-v6/ROADMAP.md](./brutal-v6/ROADMAP.md) - Development timeline

### Status Reports
- [brutal-v6/OPERATIONAL-STATUS-2025-08-07.md](./brutal-v6/OPERATIONAL-STATUS-2025-08-07.md) - V6 current state
- [brutal-v6/COMPREHENSIVE-ANALYSIS-2025-08-07.md](./brutal-v6/COMPREHENSIVE-ANALYSIS-2025-08-07.md) - Deep dive

### Working Examples
- [framework-v3/demos](./framework-v3/demos) - V3 demos
- [brutal-v6/packages/@brutal/core/examples/counter.html](./brutal-v6/packages/@brutal/core/examples/counter.html) - V6 counter
- [brutal-v6/packages/@brutal/state/examples/todo.html](./brutal-v6/packages/@brutal/state/examples/todo.html) - V6 todo

## ❓ FAQ

**Q: Which version for production?**  
A: V3. It's complete, tested, and 15x faster than React.

**Q: What's special about V6?**  
A: Attempting to fit a full framework in 8.5KB. Currently 43% done.

**Q: Why multiple versions?**  
A: Each explores different limits - size (V6), performance (V3/V4), architecture (V5).

**Q: Can I help?**  
A: Yes! V6 needs router/events implementation. V3 needs real-world apps.

---

*Last updated: 2025-08-07*
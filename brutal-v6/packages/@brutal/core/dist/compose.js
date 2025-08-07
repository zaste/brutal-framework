export function compose(...fns) {
    return (x) => fns.reduceRight((v, f) => f(v), x);
}
//# sourceMappingURL=compose.js.map
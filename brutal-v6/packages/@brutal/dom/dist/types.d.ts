/**
 * DOM types and interfaces
 */
export interface Template {
    strings: TemplateStringsArray;
    values: any[];
    _compiled?: CompiledTemplate;
}
export interface CompiledTemplate {
    html: string;
    updates: UpdatePoint[];
}
export interface UpdatePoint {
    type: 'attr' | 'text' | 'event' | 'node';
    index: number;
    name?: string;
    path: number[];
}
export interface RenderOptions {
    target?: Element;
    position?: 'replace' | 'append' | 'prepend';
}
export interface QueryOptions {
    root?: Element | Document;
    all?: boolean;
}
export type DOMPatch = {
    type: 'text' | 'attr' | 'add' | 'remove' | 'replace';
    target: Node | Element;
    value?: any;
    name?: string;
};
//# sourceMappingURL=types.d.ts.map
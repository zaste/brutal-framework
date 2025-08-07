/**
 * Global package registry for BRUTAL
 */

interface PackageInfo {
  name: string;
  version: string;
  loaded: boolean;
}

export const registry = {
  packages: new Map<string, PackageInfo>(),
  
  register(name: string, version: string): void {
    this.packages.set(name, {
      name,
      version,
      loaded: true
    });
  },
  
  get(name: string): PackageInfo | undefined {
    return this.packages.get(name);
  },
  
  isLoaded(name: string): boolean {
    return this.packages.get(name)?.loaded ?? false;
  },
  
  list(): PackageInfo[] {
    return Array.from(this.packages.values());
  }
};

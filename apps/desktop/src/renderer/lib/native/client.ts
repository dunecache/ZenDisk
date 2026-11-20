/**
 * Typed native-API boundary for the renderer.
 *
 * React components must call this facade — never `@neutralinojs/lib`
 * namespaces directly. It is the single allowlisted surface for privileged
 * operations, and the place where inputs/outputs get validated (Zod).
 */

type Operation = (...args: never[]) => Promise<unknown>;

function notImplemented(name: string): Operation {
  return (async () => {
    throw new Error(`[${name}] native operation is not implemented yet`);
  }) as Operation;
}

/**
 * Logical frontend operations. Names mirror the ZenDisk spec; the underlying
 * Neutralino native calls and validation are added as features are built.
 */
export const nativeApi = {
  disk: {
    list: notImplemented("disk.list"),
    analyze: notImplemented("disk.analyze"),
  },
  files: {
    list: notImplemented("files.list"),
    inspect: notImplemented("files.inspect"),
  },
  cleanup: {
    preview: notImplemented("cleanup.preview"),
    execute: notImplemented("cleanup.execute"),
  },
  organizer: {
    preview: notImplemented("organizer.preview"),
    execute: notImplemented("organizer.execute"),
  },
  duplicates: {
    scan: notImplemented("duplicates.scan"),
  },
  operations: {
    history: notImplemented("operations.history"),
  },
} as const;

import type { BlockFlavourIdentifier } from '@blocksuite/block-std';

export abstract class ToolbarModule {
  constructor(public readonly id: ReturnType<typeof BlockFlavourIdentifier>) {}
}

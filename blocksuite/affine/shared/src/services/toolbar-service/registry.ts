import {
  type BlockStdScope,
  LifeCycleWatcher,
  StdIdentifier,
} from '@blocksuite/block-std';
import {
  type Container,
  createIdentifier,
  createScope,
} from '@blocksuite/global/di';
import type { ExtensionType } from '@blocksuite/store';

import type { ToolbarModule } from './module';

export const ToolbarModuleIdentifier = createIdentifier<ToolbarModule>(
  'AffineToolbarModuleIdentifier'
);

export const ToolbarModulesIdentifier = createIdentifier<
  Map<string, ToolbarModule>
>('AffineToolbarModulesIdentifier');

export const ToolbarRegistryScope = createScope('AffineToolbarRegistryScope');

export const ToolbarRegistryIdentifier =
  createIdentifier<ToolbarRegistryExtension>('AffineToolbarRegistryIdentifier');

export function ToolbarModuleExtension(module: ToolbarModule): ExtensionType {
  return {
    setup: di => {
      di.scope(ToolbarRegistryScope).addImpl(
        ToolbarModuleIdentifier(module.id.variant),
        module
      );
    },
  };
}

export class ToolbarRegistryExtension extends LifeCycleWatcher {
  constructor(
    std: BlockStdScope,
    readonly modules: Map<string, ToolbarModule>
  ) {
    super(std);
  }

  static override readonly key = 'toolbar-registry';

  static override setup(di: Container) {
    di.scope(ToolbarRegistryScope)
      .addImpl(ToolbarModulesIdentifier, provider =>
        provider.getAll(ToolbarModuleIdentifier)
      )
      .addImpl(ToolbarRegistryIdentifier, this, [
        StdIdentifier,
        ToolbarModulesIdentifier,
      ]);
  }
}

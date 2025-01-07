import { ImageSelectionExtension } from '@blocksuite/affine-shared/selection';
import { ToolbarModuleExtension } from '@blocksuite/affine-shared/services';
import {
  BlockFlavourIdentifier,
  BlockViewExtension,
  CommandExtension,
  FlavourExtension,
  WidgetViewMapExtension,
} from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { ImageBlockAdapterExtensions } from './adapters/extension.js';
import { commands } from './commands/index.js';
import { ImageBlockService, ImageDropOption } from './image-service.js';

const Flavour = 'affine:image';

export const ImageBlockSpec: ExtensionType[] = [
  FlavourExtension(Flavour),
  ImageBlockService,
  CommandExtension(commands),
  BlockViewExtension(Flavour, model => {
    const parent = model.doc.getParent(model.id);

    if (parent?.flavour === 'affine:surface') {
      return literal`affine-edgeless-image`;
    }

    return literal`affine-image`;
  }),
  WidgetViewMapExtension(Flavour, {
    imageToolbar: literal`affine-image-toolbar-widget`,
  }),
  ImageDropOption,
  ImageSelectionExtension,
  ImageBlockAdapterExtensions,
  ToolbarModuleExtension({
    id: BlockFlavourIdentifier(Flavour),
  }),
].flat();

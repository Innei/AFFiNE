import { ToolbarModuleExtension } from '@blocksuite/affine-shared/services';
import {
  BlockFlavourIdentifier,
  BlockViewExtension,
  FlavourExtension,
} from '@blocksuite/block-std';
import type { ExtensionType } from '@blocksuite/store';
import { literal } from 'lit/static-html.js';

import { AttachmentBlockNotionHtmlAdapterExtension } from './adapters/notion-html.js';
import {
  AttachmentBlockService,
  AttachmentDropOption,
} from './attachment-service.js';
import {
  AttachmentEmbedConfigExtension,
  AttachmentEmbedService,
} from './embed.js';

const Flavour = 'affine:attachment';

export const AttachmentBlockSpec: ExtensionType[] = [
  FlavourExtension(Flavour),
  AttachmentBlockService,
  BlockViewExtension(Flavour, model => {
    return model.parent?.flavour === 'affine:surface'
      ? literal`affine-edgeless-attachment`
      : literal`affine-attachment`;
  }),
  AttachmentDropOption,
  AttachmentEmbedConfigExtension(),
  AttachmentEmbedService,
  AttachmentBlockNotionHtmlAdapterExtension,
  ToolbarModuleExtension({
    id: BlockFlavourIdentifier(Flavour),
  }),
];

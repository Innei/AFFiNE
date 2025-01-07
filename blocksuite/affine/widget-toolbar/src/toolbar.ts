import {
  ToolbarRegistryIdentifier,
  ToolbarRegistryScope,
} from '@blocksuite/affine-shared/services';
import { WidgetComponent } from '@blocksuite/block-std';

export const AFFINE_TOOLBAR_WIDGET = 'affine-toolbar-widget';

export class AffineToolbarWidget extends WidgetComponent {
  override connectedCallback() {
    super.connectedCallback();

    const toolbarRegistry = this.std.container
      .provider(ToolbarRegistryScope, this.std.provider)
      .get(ToolbarRegistryIdentifier);
    console.log(toolbarRegistry);
  }
}

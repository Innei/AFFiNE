import { Entity, LiveData } from '@toeverything/infra';

import type { DocRecord, DocsService } from '../../doc';
import type { TemplateDocListStore } from '../store/list';

export class TemplateDocList extends Entity {
  constructor(
    public listStore: TemplateDocListStore,
    public docsService: DocsService
  ) {
    super();
  }

  public isTemplate$(docId: string) {
    return LiveData.from(this.listStore.watchTemplateDoc(docId), false);
  }

  public getTemplateDocs() {
    return Object.values(this.docsService.allDocProperties$.value)
      .filter(property => property.isTemplate)
      .map(property => this.docsService.list.doc$(property.id).value)
      .filter((doc): doc is DocRecord => !!doc);
  }
}

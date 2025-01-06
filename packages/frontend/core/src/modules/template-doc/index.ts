import type { Framework } from '@toeverything/infra';

import { WorkspaceDBService } from '../db';
import { DocsService } from '../doc';
import { WorkspaceScope } from '../workspace';
import { TemplateDocList } from './entities/list';
import { TemplateDocSetting } from './entities/setting';
import { TemplateDocService } from './services/template-doc';
import { TemplateDocListStore } from './store/list';

export { TemplateDocService };
export * from './view/template-list-menu';

export const configureTemplateDocModule = (framework: Framework) => {
  framework
    .scope(WorkspaceScope)
    .service(TemplateDocService)
    .store(TemplateDocListStore, [WorkspaceDBService])
    .entity(TemplateDocList, [TemplateDocListStore, DocsService])
    .entity(TemplateDocSetting);
};

import { Button, Menu, MenuItem } from '@affine/component';
import { type DocRecord, DocsService } from '@affine/core/modules/doc';
import { DocDisplayMetaService } from '@affine/core/modules/doc-display-meta';
import { FeatureFlagService } from '@affine/core/modules/feature-flag';
import { TemplateDocService } from '@affine/core/modules/template-doc';
import { useLiveData, useService, useServices } from '@toeverything/infra';
import { useCallback, useState } from 'react';

import * as styles from './template.css';

export const TemplateDocSetting = () => {
  const { featureFlagService, templateDocService } = useServices({
    FeatureFlagService,
    TemplateDocService,
  });
  const setting = templateDocService.setting;

  const enabled = useLiveData(featureFlagService.flags.enable_template_doc.$);
  const loading = useLiveData(setting.loading$);
  const pageTemplateDocId = useLiveData(setting.pageTemplateDocId$);
  const journalTemplateDocId = useLiveData(setting.journalTemplateDocId$);

  const updatePageTemplate = useCallback(
    (id?: string) => {
      setting.updatePageTemplateDocId(id);
    },
    [setting]
  );

  const updateJournalTemplate = useCallback(
    (id?: string) => {
      setting.updateJournalTemplateDocId(id);
    },
    [setting]
  );

  if (!enabled) return null;
  if (loading) return null;

  return (
    <div>
      Normal Page:
      <TemplateSelector
        current={pageTemplateDocId}
        onChange={updatePageTemplate}
      />
      <br />
      Journal:
      <TemplateSelector
        current={journalTemplateDocId}
        onChange={updateJournalTemplate}
      />
    </div>
  );
};

interface TemplateSelectorProps {
  current?: string;
  onChange?: (id?: string) => void;
}
const TemplateSelector = ({ current, onChange }: TemplateSelectorProps) => {
  const docsService = useService(DocsService);
  const doc = useLiveData(current ? docsService.list.doc$(current) : null);
  const isInTrash = useLiveData(doc?.trash$);

  return (
    <Menu items={<List onChange={onChange} />}>
      <Button>{isInTrash ? 'Doc is removed' : (doc?.id ?? 'Unset')}</Button>
    </Menu>
  );
};

const List = ({ onChange }: { onChange?: (id?: string) => void }) => {
  const list = useService(TemplateDocService).list;
  const [docs] = useState(list.getTemplateDocs());

  const handleClick = useCallback(
    (id: string) => {
      onChange?.(id);
    },
    [onChange]
  );

  return docs.map(doc => {
    return <DocItem key={doc.id} doc={doc} onClick={handleClick} />;
  });
};

interface DocItemProps {
  doc: DocRecord;
  onClick?: (id: string) => void;
}
const DocItem = ({ doc, onClick }: DocItemProps) => {
  const docDisplayService = useService(DocDisplayMetaService);
  const Icon = useLiveData(docDisplayService.icon$(doc.id));
  const title = useLiveData(docDisplayService.title$(doc.id));

  const handleClick = useCallback(() => {
    onClick?.(doc.id);
  }, [doc.id, onClick]);

  return (
    <MenuItem onClick={handleClick}>
      <li className={styles.menuItem}>
        <Icon className={styles.menuItemIcon} />
        <span className={styles.menuItemText}>{title}</span>
      </li>
    </MenuItem>
  );
};

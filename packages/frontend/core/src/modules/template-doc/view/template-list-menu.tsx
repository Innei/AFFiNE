import { Menu, MenuItem, type MenuProps, Scrollable } from '@affine/component';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { useLiveData, useService } from '@toeverything/infra';
import { type PropsWithChildren, useState } from 'react';

import { type DocRecord, DocsService } from '../../doc';
import { DocDisplayMetaService } from '../../doc-display-meta';
import { TemplateDocService } from '../services/template-doc';
import * as styles from './styles.css';
interface CommonProps {
  target?: string;
}

interface DocItemProps extends CommonProps {
  doc: DocRecord;
}

const DocItem = ({ doc, target }: DocItemProps) => {
  const docDisplayService = useService(DocDisplayMetaService);
  const Icon = useLiveData(docDisplayService.icon$(doc.id));
  const title = useLiveData(docDisplayService.title$(doc.id));
  const docsService = useService(DocsService);

  const onClick = useAsyncCallback(async () => {
    await docsService.duplicate(doc.id, target);
  }, [doc.id, docsService, target]);

  return (
    <MenuItem onClick={onClick} style={{ padding: 0 }}>
      <li className={styles.item}>
        <Icon className={styles.itemIcon} />
        <span className={styles.itemText}>{title}</span>
      </li>
    </MenuItem>
  );
};

export const TemplateListMenuContent = ({ target }: CommonProps) => {
  const templateDocService = useService(TemplateDocService);
  const [templateDocs] = useState(templateDocService.list.getTemplateDocs());

  return (
    <ul className={styles.list}>
      {templateDocs.map(doc => (
        <DocItem key={doc.id} doc={doc} target={target} />
      ))}
    </ul>
  );
};

export const TemplateListMenuContentScrollable = ({ target }: CommonProps) => {
  return (
    <Scrollable.Root>
      <Scrollable.Scrollbar />
      <Scrollable.Viewport className={styles.scrollableViewport}>
        <TemplateListMenuContent target={target} />
      </Scrollable.Viewport>
    </Scrollable.Root>
  );
};

export const TemplateListMenu = ({
  children,
  target,
  contentOptions,
  ...otherProps
}: PropsWithChildren<CommonProps> & Omit<MenuProps, 'items'>) => {
  return (
    <Menu
      items={<TemplateListMenuContentScrollable target={target} />}
      contentOptions={{
        ...contentOptions,
        className: styles.menuContent,
      }}
      {...otherProps}
    >
      {children}
    </Menu>
  );
};

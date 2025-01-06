import { Checkbox, PropertyValue } from '@affine/component';
import { DocService } from '@affine/core/modules/doc';
import { useLiveData, useService } from '@toeverything/infra';
import { type ChangeEvent, useCallback } from 'react';

import * as styles from './template.css';

export const TemplateValue = () => {
  const docService = useService(DocService);

  const isTemplate = useLiveData(
    docService.doc.record.properties$.selector(p => p.isTemplate)
  );

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.checked;
      docService.doc.record.setProperty('isTemplate', value);
    },
    [docService.doc.record]
  );

  const toggle = useCallback(() => {
    docService.doc.record.setProperty('isTemplate', !isTemplate);
  }, [docService.doc.record, isTemplate]);

  return (
    <PropertyValue className={styles.property} onClick={toggle}>
      <Checkbox
        data-testid="toggle-template-checkbox"
        checked={!!isTemplate}
        onChange={onChange}
        className={styles.checkbox}
      />
    </PropertyValue>
  );
};

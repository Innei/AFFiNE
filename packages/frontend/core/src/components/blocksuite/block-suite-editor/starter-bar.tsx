import { FeatureFlagService } from '@affine/core/modules/feature-flag';
import {
  TemplateDocService,
  TemplateListMenu,
} from '@affine/core/modules/template-doc';
import { useI18n } from '@affine/i18n';
import type { Blocks } from '@blocksuite/affine/store';
import {
  AiIcon,
  EdgelessIcon,
  TemplateColoredIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import clsx from 'clsx';
import { forwardRef, type HTMLAttributes, useMemo, useState } from 'react';

import * as styles from './starter-bar.css';

const Badge = forwardRef<
  HTMLLIElement,
  HTMLAttributes<HTMLLIElement> & {
    icon: React.ReactNode;
    text: string;
    active?: boolean;
  }
>(function Badge({ icon, text, className, active, ...attrs }, ref) {
  return (
    <li
      data-active={active}
      className={clsx(styles.badge, className)}
      ref={ref}
      {...attrs}
    >
      <span className={styles.badgeText}>{text}</span>
      <span className={styles.badgeIcon}>{icon}</span>
    </li>
  );
});

export const StarterBar = ({ doc }: { doc: Blocks }) => {
  const t = useI18n();

  const templateDocService = useService(TemplateDocService);
  const featureFlagService = useService(FeatureFlagService);

  const [templateMenuOpen, setTemplateMenuOpen] = useState(false);

  const isTemplate = useLiveData(
    useMemo(
      () => templateDocService.list.isTemplate$(doc.id),
      [doc.id, templateDocService.list]
    )
  );
  const enableTemplateDoc = useLiveData(
    featureFlagService.flags.enable_template_doc.$
  );

  const showAI = false;
  const showEdgeless = false;
  const showTemplate = !isTemplate && enableTemplateDoc;

  if (!showAI && !showEdgeless && !showTemplate) {
    return null;
  }

  return (
    <div className={styles.root}>
      {t['com.affine.page-starter-bar.start']()}
      <ul className={styles.badges}>
        {showAI ? (
          <Badge
            icon={<AiIcon />}
            text={t['com.affine.page-starter-bar.ai']()}
          />
        ) : null}

        {showTemplate ? (
          <TemplateListMenu
            target={doc.id}
            rootOptions={{
              open: templateMenuOpen,
              onOpenChange: setTemplateMenuOpen,
            }}
          >
            <Badge
              icon={<TemplateColoredIcon />}
              text={t['com.affine.page-starter-bar.template']()}
              active={templateMenuOpen}
            />
          </TemplateListMenu>
        ) : null}

        {showEdgeless ? (
          <Badge
            icon={<EdgelessIcon />}
            text={t['com.affine.page-starter-bar.edgeless']()}
          />
        ) : null}
      </ul>
    </div>
  );
};

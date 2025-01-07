import { Button, IconButton, notify } from '@affine/component';
import { AuthPageContainer } from '@affine/component/auth-components';
import { useMutation } from '@affine/core/components/hooks/use-mutation';
import { OpenInAppService } from '@affine/core/modules/open-in-app';
import { copyTextToClipboard } from '@affine/core/utils/clipboard';
import { generateLicenseKeyMutation, UserFriendlyError } from '@affine/graphql';
import { Trans, useI18n } from '@affine/i18n';
import { CopyIcon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { PageNotFound } from '../../404';
import * as styles from './styles.css';

/**
 * /upgrade-success/self-hosted-team page
 *
 * only on web
 */
export const Component = () => {
  const [params] = useSearchParams();
  const [key, setKey] = useState<string | null>(null);
  const sessionId = params.get('session_id');
  const { trigger: generateLicenseKey } = useMutation({
    mutation: generateLicenseKeyMutation,
  });

  useEffect(() => {
    if (sessionId && !key) {
      generateLicenseKey({ sessionId })
        .then(({ generateLicenseKey }) => {
          setKey(generateLicenseKey);
        })
        .catch(e => {
          const error = UserFriendlyError.fromAnyError(e);
          console.error(error);

          notify.error({
            title: error.name,
            message: error.message,
          });
        });
    }
  }, [generateLicenseKey, key, sessionId]);

  if (!sessionId) {
    return <PageNotFound noPermission />;
  }

  if (key) {
    return <Success licenseKey={key} />;
  } else {
    return (
      <AuthPageContainer
        title={'Failed to generate the license key'}
        subtitle={
          <span>
            Failed to generate the license key, please contact our {''}
            <a href="mailto:support@toeverything.info" className={styles.mail}>
              customer support
            </a>
            .
          </span>
        }
      ></AuthPageContainer>
    );
  }
};

const Success = ({ licenseKey }: { licenseKey: string }) => {
  const t = useI18n();
  const openInAppService = useService(OpenInAppService);

  const openAFFiNE = useCallback(() => {
    openInAppService.showOpenInAppPage();
  }, [openInAppService]);

  const onCopy = useCallback(() => {
    copyTextToClipboard(licenseKey)
      .then(success => {
        if (success) {
          notify.success({
            title: t['com.affine.payment.license-success.copy'](),
          });
        }
      })
      .catch(err => {
        console.error(err);
        notify.error({ title: 'Copy failed, please try again later' });
      });
  }, [licenseKey, t]);

  const subtitle = (
    <span className={styles.leftContentText}>
      <span>{t['com.affine.payment.license-success.text-1']()}</span>
      <span>
        <Trans
          i18nKey={'com.affine.payment.license-success.text-2'}
          components={{
            1: (
              <a
                href="mailto:support@toeverything.info"
                className={styles.mail}
              />
            ),
          }}
        />
      </span>
    </span>
  );
  return (
    <AuthPageContainer
      title={t['com.affine.payment.license-success.title']()}
      subtitle={subtitle}
    >
      <div className={styles.content}>
        <div className={styles.licenseKeyContainer}>
          {licenseKey}
          <IconButton
            icon={<CopyIcon />}
            className={styles.icon}
            size="20"
            tooltip={t['Copy']()}
            onClick={onCopy}
          />
        </div>
        <div>{t['com.affine.payment.license-success.hint']()}</div>
        <div>
          <Button variant="primary" size="extraLarge" onClick={openAFFiNE}>
            {t['com.affine.payment.license-success.open-affine']()}
          </Button>
        </div>
      </div>
    </AuthPageContainer>
  );
};

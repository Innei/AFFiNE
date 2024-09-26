import { Button } from '@affine/component/ui/button';
import { AuthService, ServerService } from '@affine/core/modules/cloud';
import { UrlService } from '@affine/core/modules/url';
import { OAuthProviderType } from '@affine/graphql';
import track from '@affine/track';
import { GithubIcon, GoogleDuotoneIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { type ReactElement, type SVGAttributes, useCallback } from 'react';

const OAuthProviderMap: Record<
  OAuthProviderType,
  {
    icon: ReactElement<SVGAttributes<SVGElement>>;
  }
> = {
  [OAuthProviderType.Google]: {
    icon: <GoogleDuotoneIcon />,
  },

  [OAuthProviderType.GitHub]: {
    icon: <GithubIcon />,
  },

  [OAuthProviderType.OIDC]: {
    // TODO(@catsjuice): Add OIDC icon
    icon: <GoogleDuotoneIcon />,
  },
};

export function OAuth({ redirectUrl }: { redirectUrl?: string }) {
  const serverService = useService(ServerService);
  const urlService = useService(UrlService);
  const oauth = useLiveData(serverService.server.features$.map(r => r?.oauth));
  const oauthProviders = useLiveData(
    serverService.server.config$.map(r => r?.oauthProviders)
  );
  const scheme = urlService.getClientScheme();

  if (!oauth) {
    return null;
  }

  return oauthProviders?.map(provider => (
    <OAuthProvider
      key={provider}
      provider={provider}
      redirectUrl={redirectUrl}
      scheme={scheme}
      popupWindow={url => {
        urlService.openPopupWindow(url);
      }}
    />
  ));
}

type OAuthProviderProps = {
  provider: OAuthProviderType;
  redirectUrl?: string;
  scheme?: string;
  popupWindow: (url: string) => void;
};

function OAuthProvider({
  provider,
  redirectUrl,
  scheme,
  popupWindow,
}: OAuthProviderProps) {
  const auth = useService(AuthService);
  const { icon } = OAuthProviderMap[provider];

  const onClick = useCallback(() => {
    async function preflight() {
      if (ignore) return;
      try {
        return await auth.oauthPreflight(provider, scheme, false, redirectUrl);
      } catch {
        return null;
      }
    }

    let ignore = false;
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    preflight().then(url => {
      // cover popup limit in safari
      setTimeout(() => {
        if (url && !ignore) {
          track.$.$.auth.signIn({ method: 'oauth', provider });
          popupWindow(url);
        }
      });
    });
    return () => {
      ignore = true;
    };
  }, [auth, popupWindow, provider, redirectUrl, scheme]);

  return (
    <Button
      key={provider}
      variant="primary"
      block
      size="extraLarge"
      style={{ marginTop: 30, width: '100%' }}
      prefix={icon}
      onClick={onClick}
    >
      Continue with {provider}
    </Button>
  );
}

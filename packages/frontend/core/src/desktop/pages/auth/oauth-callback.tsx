import { useService } from '@toeverything/infra';
import { useEffect, useRef } from 'react';
import {
  type LoaderFunction,
  redirect,
  useLoaderData,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  useNavigate,
} from 'react-router-dom';

import { AuthService } from '../../../modules/cloud';
import { supportedClient } from './common';

interface LoaderData {
  state: string;
  code: string;
  provider: string;
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const queries = url.searchParams;

  {
    // new client login flow
    const token = queries.get('token');
    const client = queries.get('client');
    const provider = queries.get('provider');
    if (token && client && provider) {
      const authParams = new URLSearchParams();
      authParams.set('method', 'oauth');
      authParams.set('payload', JSON.stringify({ token, provider }));

      return redirect(
        `/open-app/url?url=${encodeURIComponent(`${client}://authentication?${authParams.toString()}`)}`
      );
    }
  }

  /** @deprecated */
  const code = queries.get('code');
  const stateStr = queries.get('state') ?? '{}';

  try {
    if (!code || !stateStr) {
      return redirect('/sign-in?error=Invalid oauth callback parameters');
    }

    const { state, client, provider } = JSON.parse(stateStr);

    const payload: LoaderData = {
      state,
      code,
      provider,
    };

    if (!client || client === 'web') {
      return payload;
    }

    const clientCheckResult = supportedClient.safeParse(client);
    if (!clientCheckResult.success) {
      return redirect('/sign-in?error=Invalid oauth callback parameters');
    }

    const authParams = new URLSearchParams();
    authParams.set('method', 'oauth');
    authParams.set('payload', JSON.stringify(payload));
    authParams.set('server', location.origin);

    return redirect(
      `/open-app/url?url=${encodeURIComponent(`${client}://authentication?${authParams.toString()}`)}`
    );
  } catch {
    return redirect('/sign-in?error=Invalid oauth callback parameters');
  }
};

export const Component = () => {
  const auth = useService(AuthService);
  const data = useLoaderData() as LoaderData;

  // loader data from useLoaderData is not reactive, so that we can safely
  // assume the effect below is only triggered once
  const triggeredRef = useRef(false);

  const nav = useNavigate();

  useEffect(() => {
    if (triggeredRef.current) {
      return;
    }
    triggeredRef.current = true;
    auth
      .signInOauth(data.code, data.state, data.provider)
      .then(({ redirectUri }) => {
        // TODO(@forehalo): need a good way to go back to previous tab and close current one
        nav(redirectUri ?? '/');
      })
      .catch(e => {
        nav(`/sign-in?error=${encodeURIComponent(e.message)}`);
      });
  }, [data, auth, nav]);

  return null;
};

import { extractLinkSearchParams } from '@affine/core/utils/link';
import { useService } from '@toeverything/infra';
import { useEffect, useRef } from 'react';
import {
  type LoaderFunction,
  redirect,
  useLoaderData,
  // eslint-disable-next-line @typescript-eslint/no-restricted-imports
  useNavigate,
} from 'react-router-dom';
import { z } from 'zod';

import { AuthService } from '../../../modules/cloud';
import { supportedClient } from './common';

const LoaderData = z.object({
  state: z.string(),
  provider: z.string(),
  code: z.string().optional(),
});

const ParsedState = z.object({
  payload: LoaderData,
  client: supportedClient,
});

type LoaderData = z.infer<typeof LoaderData>;
type ParsedState = z.infer<typeof ParsedState>;

async function parseState(url: string): Promise<ParsedState> {
  const { code, state: stateStr } = extractLinkSearchParams(url);
  if (!code || !stateStr) throw new Error('Invalid oauth callback parameters');
  try {
    /** @deprecated old client compatibility*/
    // NOTE: in old client, state is a JSON string
    // we check and passthrough the state to the client
    const { state, client, provider } = JSON.parse(stateStr);
    return ParsedState.parse({ payload: { state, code, provider }, client });
  } catch {}
  // new client behavior
  const {
    token: state,
    provider,
    client,
  } = await fetch('/api/oauth/exchangeToken', {
    method: 'POST',
    body: JSON.stringify({ code, state: stateStr }),
    headers: { 'content-type': 'application/json' },
  }).then(r => r.json());
  return ParsedState.parse({ payload: { state, provider }, client });
}

export const loader: LoaderFunction = async args => {
  try {
    const { payload, client } = await parseState(args.request.url);
    // sign in directly if it's web client
    if (!client || client === 'web') return payload;

    return redirect(
      `/open-app/url?url=${encodeURIComponent(
        `${client}://authentication?${new URLSearchParams({
          method: 'oauth',
          payload: JSON.stringify(payload),
          server: location.origin,
        }).toString()}`
      )}`
    );
  } catch {
    return redirect('/sign-in?error=Invalid oauth callback parameters');
  }
};

export const Component = () => {
  const auth = useService(AuthService);
  const data = useLoaderData() as LoaderData;
  const nav = useNavigate();

  // loader data from useLoaderData is not reactive, so that we can safely
  // assume the effect below is only triggered once
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (triggeredRef.current) return;
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

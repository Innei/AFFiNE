import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ConnectedAccount, PrismaClient } from '@prisma/client';
import type { Request, Response } from 'express';
import { z } from 'zod';

import {
  Config,
  InvalidOauthCallbackState,
  MissingOauthQueryParameter,
  OauthAccountAlreadyConnected,
  OauthStateExpired,
  UnknownOauthProvider,
  URLHelper,
} from '../../base';
import { AuthService, Public, Session } from '../../core/auth';
import { UserService } from '../../core/user';
import { OAuthProviderName } from './config';
import { OAuthAccount, Tokens } from './providers/def';
import { OAuthProviderFactory } from './register';
import { OAuthService } from './service';

const LoginParams = z.object({
  provider: z.nativeEnum(OAuthProviderName),
  redirectUri: z.string().optional(),
});

// handle legacy clients oauth login
@Controller('/')
export class OAuthLegacyController {
  private readonly logger = new Logger(OAuthLegacyController.name);
  private readonly clientSchema: z.ZodEnum<any>;

  constructor(
    config: Config,
    private readonly auth: AuthService,
    private readonly oauth: OAuthService,
    private readonly providerFactory: OAuthProviderFactory,
    private readonly url: URLHelper
  ) {
    this.clientSchema = z.enum([
      'web',
      'affine',
      'affine-canary',
      'affine-beta',
      ...(config.node.dev ? ['affine-dev'] : []),
    ]);
  }

  @Public()
  @Get('/oauth/login')
  @Get('/desktop-signin')
  @HttpCode(HttpStatus.OK)
  async legacyLogin(
    @Res() res: Response,
    @Session() session: Session | undefined,
    @Body('provider') provider?: string,
    @Body('redirect_uri') redirectUri?: string,
    @Body('client') client?: string
  ) {
    // sign out first, web only
    if ((!!client || client === 'web') && session) {
      await this.auth.signOut(session.sessionId);
      await this.auth.refreshCookies(res, session.sessionId);
    }

    const params = LoginParams.extend({ client: this.clientSchema }).safeParse({
      provider: provider?.toLowerCase(),
      redirectUri: this.url.safeLink(redirectUri),
      client,
    });
    if (params.error) {
      return res.redirect(
        this.url.link('/sign-in', {
          error: `Invalid oauth parameters`,
        })
      );
    } else {
      const { provider: providerName, redirectUri, client } = params.data;
      const provider = this.providerFactory.get(providerName);
      if (!provider) {
        throw new UnknownOauthProvider({ name: providerName });
      }

      try {
        const token = await this.oauth.saveOAuthState({
          provider: providerName,
          redirectUri,
          clientId: client,
        });
        // legacy client state assemble
        const oAuthUrl = new URL(provider.getAuthUrl(token));
        oAuthUrl.searchParams.set(
          'state',
          JSON.stringify({
            state: oAuthUrl.searchParams.get('state'),
            client,
            provider,
          })
        );
        return res.redirect(oAuthUrl.toString());
      } catch (e: any) {
        this.logger.error(
          `Failed to preflight oauth login for provider ${providerName}`,
          e
        );
        return res.redirect(
          this.url.link('/sign-in', {
            error: `Invalid oauth provider parameters`,
          })
        );
      }
    }
  }
}

@Controller('/api/oauth')
export class OAuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly oauth: OAuthService,
    private readonly user: UserService,
    private readonly providerFactory: OAuthProviderFactory,
    private readonly db: PrismaClient
  ) {}

  @Public()
  @Post('/preflight')
  @HttpCode(HttpStatus.OK)
  async preflight(
    @Body('provider') unknownProviderName?: string,
    @Body('redirect_uri') redirectUri?: string,
    @Body('client') clientId?: string,
    @Body('state') clientState?: string
  ) {
    if (!unknownProviderName) {
      throw new MissingOauthQueryParameter({ name: 'provider' });
    }

    // @ts-expect-error safe
    const providerName = OAuthProviderName[unknownProviderName];
    const provider = this.providerFactory.get(providerName);

    if (!provider) {
      throw new UnknownOauthProvider({ name: unknownProviderName });
    }

    const oAuthToken = await this.oauth.saveOAuthState({
      provider: providerName,
      redirectUri,
      // new client will generate the state from the client side
      clientId,
      state: clientState,
    });

    return {
      url: provider.getAuthUrl(oAuthToken),
    };
  }

  @Public()
  @Post('/exchangeToken')
  @HttpCode(HttpStatus.OK)
  async exchangeToken(
    @Body('code') code: string,
    @Body('state') oAuthToken: string
  ) {
    if (!code) {
      throw new MissingOauthQueryParameter({ name: 'code' });
    }
    if (!oAuthToken) {
      throw new MissingOauthQueryParameter({ name: 'state' });
    }

    const oAuthState = await this.oauth.getOAuthState(oAuthToken);

    if (!oAuthState || !oAuthState?.state) {
      throw new InvalidOauthCallbackState();
    }

    // for new client, need exchange cookie by client state
    // we only cache the code and access token in server side
    const provider = this.providerFactory.get(oAuthState.provider);
    if (!provider) {
      throw new UnknownOauthProvider({
        name: oAuthState.provider ?? 'unknown',
      });
    }
    const token = await this.oauth.saveOAuthState({ ...oAuthState, code });

    return {
      token,
      provider: oAuthState.provider,
      client: oAuthState.clientId,
    };
  }

  @Public()
  @Post('/callback')
  @HttpCode(HttpStatus.OK)
  async callback(
    @Req() req: Request,
    @Res() res: Response,
    /** @deprecated */ @Body('code') code?: string,
    @Body('state') oAuthToken?: string,
    // new client will send token to exchange cookie
    @Body('secret') inAppState?: string
  ) {
    if (inAppState && oAuthToken) {
      // new method, need exchange cookie by client state
      // we only cache the code and access token in server side
      const authState = await this.oauth.getOAuthState(oAuthToken);
      if (!authState || authState.state !== inAppState || !authState.code) {
        console.log('authState', authState, 'inAppState', inAppState);
        throw new OauthStateExpired();
      }

      if (!authState.provider) {
        throw new MissingOauthQueryParameter({ name: 'provider' });
      }

      const provider = this.providerFactory.get(authState.provider);

      if (!provider) {
        throw new UnknownOauthProvider({
          name: authState.provider ?? 'unknown',
        });
      }

      // NOTE: in web client, we don't need to exchange token
      // and provide the auth code directly
      const tokens = await provider.getToken(code || authState.code);
      const externAccount = await provider.getUser(tokens.accessToken);
      const user = await this.loginFromOauth(
        authState.provider,
        externAccount,
        tokens
      );

      await this.auth.setCookies(req, res, user.id);
      res.send({
        id: user.id,
        /* @deprecated */
        redirectUri: authState.redirectUri,
      });
    } else {
      if (!code) {
        throw new MissingOauthQueryParameter({ name: 'code' });
      }

      if (!oAuthToken) {
        throw new MissingOauthQueryParameter({ name: 'state' });
      }

      if (
        typeof oAuthToken !== 'string' ||
        !this.oauth.isValidState(oAuthToken)
      ) {
        throw new InvalidOauthCallbackState();
      }

      const authState = await this.oauth.getOAuthState(oAuthToken);

      if (!authState) {
        throw new OauthStateExpired();
      }

      if (!authState.provider) {
        throw new MissingOauthQueryParameter({ name: 'provider' });
      }

      const provider = this.providerFactory.get(authState.provider);

      if (!provider) {
        throw new UnknownOauthProvider({
          name: authState.provider ?? 'unknown',
        });
      }

      const tokens = await provider.getToken(code);
      const externAccount = await provider.getUser(tokens.accessToken);
      const user = await this.loginFromOauth(
        authState.provider,
        externAccount,
        tokens
      );

      await this.auth.setCookies(req, res, user.id);
      res.send({
        id: user.id,
        /* @deprecated */
        redirectUri: authState.redirectUri,
      });
    }
  }

  private async loginFromOauth(
    provider: OAuthProviderName,
    externalAccount: OAuthAccount,
    tokens: Tokens
  ) {
    const connectedUser = await this.db.connectedAccount.findFirst({
      where: {
        provider,
        providerAccountId: externalAccount.id,
      },
      include: {
        user: true,
      },
    });

    if (connectedUser) {
      // already connected
      await this.updateConnectedAccount(connectedUser, tokens);

      return connectedUser.user;
    }

    const user = await this.user.fulfillUser(externalAccount.email, {
      emailVerifiedAt: new Date(),
      registered: true,
      avatarUrl: externalAccount.avatarUrl,
    });

    await this.db.connectedAccount.create({
      data: {
        userId: user.id,
        provider,
        providerAccountId: externalAccount.id,
        ...tokens,
      },
    });
    return user;
  }

  private async updateConnectedAccount(
    connectedUser: ConnectedAccount,
    tokens: Tokens
  ) {
    return this.db.connectedAccount.update({
      where: {
        id: connectedUser.id,
      },
      data: tokens,
    });
  }

  /**
   * we currently don't support connect oauth account to existing user
   * keep it incase we need it in the future
   */
  // @ts-expect-error allow unused
  private async _connectAccount(
    user: { id: string },
    provider: OAuthProviderName,
    externalAccount: OAuthAccount,
    tokens: Tokens
  ) {
    const connectedUser = await this.db.connectedAccount.findFirst({
      where: {
        provider,
        providerAccountId: externalAccount.id,
      },
    });

    if (connectedUser) {
      if (connectedUser.id !== user.id) {
        throw new OauthAccountAlreadyConnected();
      }
    } else {
      await this.db.connectedAccount.create({
        data: {
          userId: user.id,
          provider,
          providerAccountId: externalAccount.id,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      });
    }
  }
}

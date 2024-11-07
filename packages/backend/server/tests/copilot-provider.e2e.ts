import { randomUUID } from 'node:crypto';

import { createRandomAIUser } from '@affine-test/kit/utils/cloud';
import type { ExecutionContext, TestFn } from 'ava';
import ava from 'ava';

import { createWorkspace } from './utils';
import {
  chatWithImages,
  chatWithText,
  chatWithWorkflow,
  createCopilotMessage,
  createCopilotSession,
  ProviderActionTestCase,
  ProviderWorkflowTestCase,
  sse2array,
} from './utils/copilot';

type Tester = {
  app: any;
  userEmail: string;
  userToken: string;
  workspaceId: string;
};
const test = ava as TestFn<Tester>;

const e2eConfig = {
  endpoint: process.env.COPILOT_E2E_ENDPOINT || 'http://localhost:3010',
};

const isCopilotConfigured =
  !!process.env.COPILOT_OPENAI_API_KEY &&
  !!process.env.COPILOT_FAL_API_KEY &&
  process.env.COPILOT_OPENAI_API_KEY !== '1' &&
  process.env.COPILOT_FAL_API_KEY !== '1';
const runIfCopilotConfigured = test.macro(
  async (
    t,
    callback: (t: ExecutionContext<Tester>) => Promise<void> | void
  ) => {
    if (isCopilotConfigured) {
      await callback(t);
    } else {
      t.log('Skip test because copilot is not configured');
      t.pass();
    }
  }
);

export const runPrisma = async <T>(
  cb: (
    prisma: InstanceType<
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      typeof import('../../../../packages/backend/server/node_modules/@prisma/client').PrismaClient
    >
  ) => Promise<T>
): Promise<T> => {
  const {
    PrismaClient,
    // eslint-disable-next-line @typescript-eslint/no-var-requires
  } = await import(
    '../../../../packages/backend/server/node_modules/@prisma/client'
  );
  const client = new PrismaClient();
  await client.$connect();
  try {
    return await cb(client);
  } finally {
    await client.$disconnect();
  }
};

test.before(async t => {
  if (!isCopilotConfigured) return;
  const { endpoint } = e2eConfig;

  const { email, sessionId: token } = await createRandomAIUser(
    'affine.fail',
    runPrisma
  );
  const app = { getHttpServer: () => endpoint } as any;
  const { id } = await createWorkspace(app, token);

  t.context.app = app;
  t.context.userEmail = email;
  t.context.userToken = token;
  t.context.workspaceId = id;
});

test.after(async t => {
  if (!isCopilotConfigured) return;
  await runPrisma(async client => {
    await client.user.delete({
      where: {
        email: t.context.userEmail,
      },
    });
  });
});

const retry = async (
  action: string,
  t: ExecutionContext<Tester>,
  callback: (t: ExecutionContext<Tester>) => void
) => {
  let i = 3;
  while (i--) {
    const ret = await t.try(callback);
    if (ret.passed) {
      return ret.commit();
    } else {
      ret.discard();
      t.log(ret.errors.map(e => e.message).join('\n'));
      t.log(`retrying ${action} ${3 - i}/3 ...`);
    }
  }
  t.fail(`failed to run ${action}`);
};

const makeCopilotChat = async (
  t: ExecutionContext<Tester>,
  promptName: string,
  { content, attachments, params }: any
) => {
  const { app, userToken, workspaceId } = t.context;
  const sessionId = await createCopilotSession(
    app,
    userToken,
    workspaceId,
    randomUUID(),
    promptName
  );
  const messageId = await createCopilotMessage(
    app,
    userToken,
    sessionId,
    content,
    attachments,
    undefined,
    params
  );
  return { sessionId, messageId };
};

// ==================== action ====================

for (const { promptName, messages, verifier, type } of ProviderActionTestCase) {
  const prompts = Array.isArray(promptName) ? promptName : [promptName];
  for (const promptName of prompts) {
    test(
      `should be able to run action: ${promptName}`,
      runIfCopilotConfigured,
      async t => {
        await retry(`action: ${promptName}`, t, async t => {
          const { app, userToken } = t.context;
          const { sessionId, messageId } = await makeCopilotChat(
            t,
            promptName,
            messages[0]
          );

          if (type === 'text') {
            const result = await chatWithText(
              app,
              userToken,
              sessionId,
              messageId
            );
            t.truthy(result, 'should return result');
            verifier?.(t, result);
          } else if (type === 'image') {
            const result = sse2array(
              await chatWithImages(app, userToken, sessionId, messageId)
            )
              .filter(e => e.event !== 'event')
              .map(e => e.data)
              .filter(Boolean);
            t.truthy(result.length, 'should return result');
            for (const r of result) {
              verifier?.(t, r);
            }
          } else {
            t.fail('unsupported provider type');
          }
        });
      }
    );
  }
}

// ==================== workflow ====================

for (const { name, content, verifier } of ProviderWorkflowTestCase) {
  test(
    `should be able to run workflow: ${name}`,
    runIfCopilotConfigured,
    async t => {
      await retry(`workflow: ${name}`, t, async t => {
        const { app, userToken } = t.context;
        const { sessionId, messageId } = await makeCopilotChat(
          t,
          `workflow:${name}`,
          { content }
        );
        const r = await chatWithWorkflow(app, userToken, sessionId, messageId);
        const result = sse2array(r)
          .filter(e => e.event !== 'event' && e.data)
          .reduce((p, c) => p + c.data, '');
        t.truthy(result, 'should return result');
        verifier?.(t, result);
      });
    }
  );
}

import { randomInt, randomUUID } from 'node:crypto';

import { hash } from '@node-rs/argon2';
import type { ExecutionContext, TestFn } from 'ava';
import ava from 'ava';
import { z } from 'zod';

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
import { createWorkspace } from './utils/workspace';

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

const runPrisma = async <T>(
  cb: (
    prisma: InstanceType<
      typeof import('../node_modules/@prisma/client').PrismaClient
    >
  ) => Promise<T>
): Promise<T> => {
  const { PrismaClient } = await import('../node_modules/@prisma/client');
  const client = new PrismaClient();
  await client.$connect();
  try {
    return await cb(client);
  } finally {
    await client.$disconnect();
  }
};

const cloudUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
});

function randomName() {
  return Array.from({ length: 10 }, () =>
    String.fromCharCode(randomInt(65, 90))
  )
    .join('')
    .toLowerCase();
}

async function createRandomAIUser(): Promise<{
  name: string;
  email: string;
  password: string;
  id: string;
  sessionId: string;
}> {
  const name = randomName();
  const email = `${name}@affine.fail`;
  const user = { name, email, password: '123456' };
  const result = await runPrisma(async client => {
    const freeFeatureId = await client.feature
      .findFirst({
        where: { feature: 'free_plan_v1' },
        select: { id: true },
        orderBy: { version: 'desc' },
      })
      .then(f => f!.id);
    const aiFeatureId = await client.feature
      .findFirst({
        where: { feature: 'unlimited_copilot' },
        select: { id: true },
        orderBy: { version: 'desc' },
      })
      .then(f => f!.id);

    const { id: userId } = await client.user.create({
      data: {
        ...user,
        emailVerifiedAt: new Date(),
        password: await hash(user.password),
        features: {
          create: [
            {
              reason: 'created by test case',
              activated: true,
              featureId: freeFeatureId,
            },
            {
              reason: 'created by test case',
              activated: true,
              featureId: aiFeatureId,
            },
          ],
        },
      },
    });

    const { id: sessionId } = await client.session.create({ data: {} });
    await client.userSession.create({
      data: {
        sessionId,
        userId,
        // half an hour
        expiresAt: new Date(Date.now() + 60 * 30 * 1000),
      },
    });

    return await client.user
      .findUnique({
        where: {
          email: user.email,
        },
      })
      .then(r => ({ ...r, sessionId }));
  });
  cloudUserSchema.parse(result);
  return {
    ...result,
    password: user.password,
  } as any;
}

test.before(async t => {
  if (!isCopilotConfigured) return;
  const { endpoint } = e2eConfig;

  const { email, sessionId: token } = await createRandomAIUser();
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

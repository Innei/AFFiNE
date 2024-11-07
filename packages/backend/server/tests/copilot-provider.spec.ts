/// <reference types="../src/global.d.ts" />

import { TestingModule } from '@nestjs/testing';
import type { ExecutionContext, TestFn } from 'ava';
import ava from 'ava';

import { ConfigModule } from '../src/base/config';
import { AuthService } from '../src/core/auth';
import { QuotaModule } from '../src/core/quota';
import { CopilotModule } from '../src/plugins/copilot';
import { prompts, PromptService } from '../src/plugins/copilot/prompt';
import {
  CopilotProviderService,
  FalProvider,
  OpenAIProvider,
  registerCopilotProvider,
  unregisterCopilotProvider,
} from '../src/plugins/copilot/providers';
import {
  CopilotChatTextExecutor,
  CopilotWorkflowService,
  GraphExecutorState,
} from '../src/plugins/copilot/workflow';
import {
  CopilotChatImageExecutor,
  CopilotCheckHtmlExecutor,
  CopilotCheckJsonExecutor,
} from '../src/plugins/copilot/workflow/executor';
import { createTestingModule } from './utils';
import {
  checkMDList,
  ProviderActionTestCase,
  ProviderWorkflowTestCase,
} from './utils/copilot';

type Tester = {
  auth: AuthService;
  module: TestingModule;
  prompt: PromptService;
  provider: CopilotProviderService;
  workflow: CopilotWorkflowService;
  executors: {
    image: CopilotChatImageExecutor;
    text: CopilotChatTextExecutor;
    html: CopilotCheckHtmlExecutor;
    json: CopilotCheckJsonExecutor;
  };
};
const test = ava as TestFn<Tester>;

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

test.serial.before(async t => {
  const module = await createTestingModule({
    imports: [
      ConfigModule.forRoot({
        plugins: {
          copilot: {
            openai: {
              apiKey: process.env.COPILOT_OPENAI_API_KEY,
            },
            fal: {
              apiKey: process.env.COPILOT_FAL_API_KEY,
            },
          },
        },
      }),
      QuotaModule,
      CopilotModule,
    ],
  });

  const auth = module.get(AuthService);
  const prompt = module.get(PromptService);
  const provider = module.get(CopilotProviderService);
  const workflow = module.get(CopilotWorkflowService);

  t.context.module = module;
  t.context.auth = auth;
  t.context.prompt = prompt;
  t.context.provider = provider;
  t.context.workflow = workflow;
  t.context.executors = {
    image: module.get(CopilotChatImageExecutor),
    text: module.get(CopilotChatTextExecutor),
    html: module.get(CopilotCheckHtmlExecutor),
    json: module.get(CopilotCheckJsonExecutor),
  };
});

test.serial.before(async t => {
  const { prompt, executors } = t.context;

  executors.image.register();
  executors.text.register();
  executors.html.register();
  executors.json.register();

  registerCopilotProvider(OpenAIProvider);
  registerCopilotProvider(FalProvider);

  for (const name of await prompt.listNames()) {
    await prompt.delete(name);
  }

  for (const p of prompts) {
    await prompt.set(p.name, p.model, p.messages, p.config);
  }
});

test.after(async _ => {
  unregisterCopilotProvider(OpenAIProvider.type);
  unregisterCopilotProvider(FalProvider.type);
});

test.after(async t => {
  await t.context.module.close();
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

// ==================== utils ====================

test('should validate markdown list', t => {
  t.true(
    checkMDList(`
- item 1
- item 2
`)
  );
  t.true(
    checkMDList(`
- item 1
  - item 1.1
- item 2
`)
  );
  t.true(
    checkMDList(`
- item 1
  - item 1.1
    - item 1.1.1
- item 2
`)
  );
  t.true(
    checkMDList(`
- item 1
  - item 1.1
    - item 1.1.1
    - item 1.1.2
- item 2
`)
  );
  t.true(
    checkMDList(`
- item 1
  - item 1.1
    - item 1.1.1
- item 1.2
`)
  );
  t.false(
    checkMDList(`
- item 1
  - item 1.1
      - item 1.1.1.1
`)
  );
  t.true(
    checkMDList(`
- item 1
  - item 1.1
    - item 1.1.1.1
      item 1.1.1.1 line breaks
    - item 1.1.1.2
`),
    'should allow line breaks'
  );
});

// ==================== action ====================

for (const { promptName, messages, verifier, type } of ProviderActionTestCase) {
  const prompts = Array.isArray(promptName) ? promptName : [promptName];
  for (const promptName of prompts) {
    test(
      `should be able to run action: ${promptName}`,
      runIfCopilotConfigured,
      async t => {
        const { provider: providerService, prompt: promptService } = t.context;
        const prompt = (await promptService.get(promptName))!;
        t.truthy(prompt, 'should have prompt');
        const provider = (await providerService.getProviderByModel(
          prompt.model
        ))!;
        t.truthy(provider, 'should have provider');
        await retry(`action: ${promptName}`, t, async t => {
          if (type === 'text' && 'generateText' in provider) {
            const result = await provider.generateText(
              [
                ...prompt.finish(
                  messages.reduce(
                    // @ts-expect-error
                    (acc, m) => Object.assign(acc, m.params),
                    {}
                  )
                ),
                ...messages,
              ],
              prompt.model
            );
            t.truthy(result, 'should return result');
            verifier?.(t, result);
          } else if (type === 'image' && 'generateImages' in provider) {
            const result = await provider.generateImages(
              [
                ...prompt.finish(
                  messages.reduce(
                    // @ts-expect-error
                    (acc, m) => Object.assign(acc, m.params),
                    {}
                  )
                ),
                ...messages,
              ],
              prompt.model
            );
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
      const { workflow } = t.context;

      await retry(`workflow: ${name}`, t, async t => {
        let result = '';
        for await (const ret of workflow.runGraph({ content }, name)) {
          if (ret.status === GraphExecutorState.EnterNode) {
            t.log('enter node:', ret.node.name);
          } else if (ret.status === GraphExecutorState.ExitNode) {
            t.log('exit node:', ret.node.name);
          } else if (ret.status === GraphExecutorState.EmitAttachment) {
            t.log('stream attachment:', ret);
          } else {
            result += ret.content;
          }
        }
        t.truthy(result, 'should return result');
        verifier?.(t, result);
      });
    }
  );
}

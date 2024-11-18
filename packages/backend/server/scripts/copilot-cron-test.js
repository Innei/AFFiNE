// start process

import { spawn } from 'node:child_process';

import { WebClient } from '@slack/web-api';
import { jsxslack } from 'jsx-slack';
import { marked, Renderer } from 'marked';
import { Parser } from 'tap-parser';

async function runTest() {
  const tester = new Promise(resolve => {
    const test = spawn(
      'npx',
      [
        'ava',
        '--config',
        'tests/ava.docker.config.js',
        'tests/**/copilot-*.e2e.ts',
        '--tap',
      ],
      { env: { ...process.env, NODE_NO_WARNINGS: 1 } }
    );

    const parser = new Parser();
    test.stdout.on('data', data => {
      console.log(data.toString());
      parser.write(data);
    });

    test.on('close', _ => {
      const failures = parser?.failures.filter(f => !!f.fullname);
      const timeouts = parser?.failures.filter(f => !f.fullname);
      const result = [
        `${parser.results.pass} passed`,
        `${parser.results.fail - timeouts.length} failed`,
        `${timeouts.length} timeouts`,
        `${parser.results.skip} skipped`,
      ];
      const report = [
        `Test finished with ${result.join(', ')}.`,
        failures?.length > 0
          ? `Failed tests: \n\n${failures.map(failure => `- ${failure.fullname}`).join('\n')}`
          : '',
      ];
      resolve(report.join('\n\n'));
    });
  });

  try {
    return await tester;
  } catch (e) {
    return e.message;
  }
}

function render(markdown) {
  const rendered = marked(markdown, {
    renderer: new (class CustomRenderer extends Renderer {
      heading({ tokens }) {
        return `
            <Fragment>
              <Section><b>${tokens[0].text}</b></Section>
              <Divider />
            </Fragment>`;
      }

      paragraph({ tokens }) {
        return `<Section><p>${tokens[0].text}</p></Section>`;
      }

      list(token) {
        return `<Section>${super.list(token)}</Section>`;
      }

      hr() {
        return `<Divider />`;
      }
    })(),
  });
  return jsxslack([`<Blocks>${rendered}</Blocks>`]);
}

async function main() {
  const { CHANNEL_ID, SLACK_BOT_TOKEN, AFFINE_ENV } = process.env;

  const report = await runTest();
  const blocks = render(
    [`# AFFiNE Copilot Test ${AFFINE_ENV} Env Test Result`, report].join('\n\n')
  );
  const { ok } = await new WebClient(SLACK_BOT_TOKEN).chat.postMessage({
    channel: CHANNEL_ID,
    text: `AFFiNE Copilot Test ${AFFINE_ENV} Env Test Result`,
    blocks,
  });

  console.assert(ok, 'Failed to send a message to Slack');
}

await main();

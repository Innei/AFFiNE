import { WebClient } from '@slack/web-api';

import { render } from './markdown.js';

const {
  CHANNEL_ID,
  SLACK_BOT_TOKEN,
  COPILOT_RESULT,
  BRANCH_SHA,
  BRANCH_NAME,
  GITHUB_SERVER_URL,
  GITHUB_REPOSITORY,
  GITHUB_RUN_ID,
} = process.env;

const { ok } = await new WebClient(SLACK_BOT_TOKEN).chat.postMessage({
  channel: CHANNEL_ID,
  text: `AFFiNE Copilot Test ${COPILOT_RESULT}`,
  blocks: render(
    `# AFFiNE Copilot Test ${COPILOT_RESULT}

- Branch: [${BRANCH_NAME?.replace('refs/heads/', '') || BRANCH_SHA}](https://github.com/toeverything/AFFiNE/commit/${BRANCH_SHA})
- Job: [${GITHUB_RUN_ID}](${GITHUB_SERVER_URL}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID})
`
  ),
});

console.assert(ok, 'Failed to send a message to Slack');

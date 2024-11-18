import packageJson from '../package.json' with { type: 'json' };

export default {
  ...packageJson.ava,
  environmentVariables: {
    ...packageJson.ava.environmentVariables,
    TS_NODE_PROJECT: './tests/tsconfig.docker.json',
  },
};

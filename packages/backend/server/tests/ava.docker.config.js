import packageJson from '../package.json' with { type: 'json' };

export default {
  ...packageJson.ava,
  nodeArguments: [
    '--trace-sigint',
    '--loader',
    'ts-node/esm/transpile-only.mjs',
    '--es-module-specifier-resolution=node',
  ],
  environmentVariables: {
    ...packageJson.ava.environmentVariables,
    TS_NODE_PROJECT: './tests/tsconfig.docker.json',
  },
};

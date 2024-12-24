/// <reference types="../src/global.d.ts" />

import { ReadableStreamDefaultReader } from 'node:stream/web';

import ava, { TestFn } from 'ava';
import Sinon from 'sinon';

import { PerplexityProvider } from '../src/plugins/copilot/providers/perplexity';

const test = ava as TestFn<{
  provider: PerplexityProvider;
  mockReader: Sinon.SinonStubbedInstance<
    ReadableStreamDefaultReader<Uint8Array>
  >;
  loggerSpy: Sinon.SinonSpy;
}>;

test.beforeEach(t => {
  const provider = new PerplexityProvider({ apiKey: 'test-api-key' });
  const mockReader = {
    read: Sinon.stub(),
    releaseLock: Sinon.stub(),
    cancel: Sinon.stub(),
  } as unknown as Sinon.SinonStubbedInstance<
    ReadableStreamDefaultReader<Uint8Array>
  >;

  // Spy on the logger
  const loggerSpy = Sinon.spy(provider['logger'], 'warn');

  t.context = { provider, mockReader, loggerSpy };
});

test.afterEach.always(t => {
  // Restore the original logger method
  t.context.loggerSpy.restore();
});

test('should process incomplete data stream chunks correctly', async t => {
  const { provider, mockReader, loggerSpy } = t.context;

  const dataChunks = [
    new TextEncoder().encode(
      ` data: {"choices":[{"delta":{"content":"Hello"}}]}
      data: {"choices":[{"delta":{"content":", "}}]}
      da`
    ),
    new TextEncoder().encode(
      `ta: {"choices":[{"delta":{"content":"World"}}]}
      data:{"choices":[{"delta":{"content":"!"}}]}`
    ),
  ];

  mockReader.read
    .onFirstCall()
    .resolves({ done: false, value: dataChunks[0] })
    .onSecondCall()
    .resolves({ done: false, value: dataChunks[1] })
    .onThirdCall()
    .resolves({ done: true, value: undefined });

  const result: string[] = [];
  for await (const chunk of provider.processStreamChunks(
    mockReader,
    'llama-3.1-sonar-small-128k-online'
  )) {
    result.push(chunk);
  }

  t.deepEqual(result, ['Hello, ', 'World!']);
  t.true(loggerSpy.notCalled);
});

test('should process complete data stream chunks correctly', async t => {
  const { provider, mockReader, loggerSpy } = t.context;

  const dataChunks = [
    new TextEncoder().encode(
      ` data: {"choices":[{"delta":{"content":"Hello"}}]}
      data: {"choices":[{"delta":{"content":", "}}]}
      data: `
    ),
    new TextEncoder().encode(
      `{"choices":[{"delta":{"content":"World"}}]}
      data:{"choices":[{"delta":{"content":"!"}}]}`
    ),
  ];

  mockReader.read
    .onFirstCall()
    .resolves({ done: false, value: dataChunks[0] })
    .onSecondCall()
    .resolves({ done: false, value: dataChunks[1] })
    .onThirdCall()
    .resolves({ done: true, value: undefined });

  const result: string[] = [];
  for await (const chunk of provider.processStreamChunks(
    mockReader,
    'llama-3.1-sonar-small-128k-online'
  )) {
    result.push(chunk);
  }

  t.deepEqual(result, ['Hello, ', 'World!']);
  t.true(loggerSpy.notCalled);
});

test('should process incomplete json stream chunks correctly', async t => {
  const { provider, mockReader, loggerSpy } = t.context;

  const dataChunks = [
    new TextEncoder().encode(
      `data: {"choices":[{"delta":{"content":"Hello"}}]}
        data: {"choices":[{"delta":{"content":", `
    ),
    new TextEncoder().encode(
      `"}}]}
       data: {"choices":[{"delta":{"content":"World"}}]}
       data:{"choices":[{"delta":{"content":"!"}}]}`
    ),
  ];

  mockReader.read
    .onFirstCall()
    .resolves({ done: false, value: dataChunks[0] })
    .onSecondCall()
    .resolves({ done: false, value: dataChunks[1] })
    .onThirdCall()
    .resolves({ done: true, value: undefined });

  const result: string[] = [];
  for await (const chunk of provider.processStreamChunks(
    mockReader,
    'llama-3.1-sonar-small-128k-online'
  )) {
    result.push(chunk);
  }

  t.deepEqual(result, ['Hello', ', World!']);
  t.true(loggerSpy.notCalled);
});

test('should process incomplete unicode stream chunks correctly', async t => {
  const { provider, mockReader, loggerSpy } = t.context;

  const dataChunks = [
    new TextEncoder().encode(
      String.raw`data: {"choices":[{"delta":{"content":"\u4f60\u597d"}}]}
       data: {"choices":[{"delta":{"content":"\uf`
    ),
    new TextEncoder().encode(
      String.raw`f0c"}}]}
      data: {"choices":[{"delta":{"content":"\u4e16\u754c"}}]}`
    ),
  ];

  mockReader.read
    .onFirstCall()
    .resolves({ done: false, value: dataChunks[0] })
    .onSecondCall()
    .resolves({ done: false, value: dataChunks[1] })
    .onThirdCall()
    .resolves({ done: true, value: undefined });

  const result: string[] = [];
  for await (const chunk of provider.processStreamChunks(
    mockReader,
    'llama-3.1-sonar-small-128k-online'
  )) {
    result.push(chunk);
  }

  t.deepEqual(result, ['你好', '，世界']);
  t.true(loggerSpy.notCalled);
});

test('should skip invalid stream chunks and log warnings', async t => {
  const { provider, mockReader, loggerSpy } = t.context;

  const dataChunks = [
    new TextEncoder().encode(
      `data: {"choices":[{"delta":{"content":"Hello"}}]}
        data: {"choices":[{"delta":{"content":", `
    ),
    new TextEncoder().encode(
      `]}
       data: {"choices":[{"delta":{"content":"World"}}]}
      data: "delta":{"content":"!"}}`
    ),
  ];

  mockReader.read
    .onFirstCall()
    .resolves({ done: false, value: dataChunks[0] })
    .onSecondCall()
    .resolves({ done: false, value: dataChunks[1] })
    .onThirdCall()
    .resolves({ done: true, value: undefined });

  const result: string[] = [];
  for await (const chunk of provider.processStreamChunks(
    mockReader,
    'llama-3.1-sonar-small-128k-online'
  )) {
    result.push(chunk);
  }

  t.deepEqual(result, ['Hello', 'World']);
  t.true(loggerSpy.calledOnce);
});

test('processStreamChunks should handle errors during stream processing', async t => {
  const { provider, mockReader } = t.context;

  mockReader.read.rejects(new Error('Stream error'));

  const processStream = provider.processStreamChunks(
    mockReader,
    'llama-3.1-sonar-small-128k-online'
  );

  await t.throwsAsync(
    async () => {
      for await (const _ of processStream) {
        // Do nothing
      }
    },
    { message: 'Stream error' }
  );
});

test('injectCitations should replace citation placeholders with URLs', t => {
  const { provider } = t.context;

  const content =
    'This is [a] test sentence with citations [1] and [[2]] and [3].';
  const citations = [
    'https://example.com/citation1',
    'https://example.com/citation2',
  ];

  const expected =
    'This is [a] test sentence with citations [[1](https://example.com/citation1)] and [[2](https://example.com/citation2)] and [3].';
  const result = provider.injectCitations(content, citations);

  t.is(result, expected);
});

test('injectCitations should not replace citation already with URLs', t => {
  const { provider } = t.context;

  const content =
    'Test sentence with citations [1](https://example.com/citationx) and [[2]](https://example.com/citationy) and [[3](https://example.com/citationz)].';
  const citations = [
    'https://example.com/citation1',
    'https://example.com/citation2',
    'https://example.com/citation3',
  ];

  const expected = content;
  const result = provider.injectCitations(content, citations);

  t.is(result, expected);
});

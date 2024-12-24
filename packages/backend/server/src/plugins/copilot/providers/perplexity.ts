import assert from 'node:assert';

import { Logger } from '@nestjs/common';

import {
  CopilotPromptInvalid,
  CopilotProviderSideError,
  metrics,
} from '../../../base';
import {
  CopilotCapability,
  CopilotChatOptions,
  CopilotProviderType,
  CopilotTextToTextProvider,
  PromptMessage,
} from '../types';

export type PerplexityConfig = {
  apiKey: string;
};

interface Message {
  role: 'assistant';
  content: string;
}

interface Choice {
  message: Message;
  delta: Message;
  finish_reason: 'stop' | null;
}

interface PerplexityResponse {
  citations: string[];
  choices: Choice[];
}

export class PerplexityProvider implements CopilotTextToTextProvider {
  static readonly type = CopilotProviderType.Perplexity;

  static readonly capabilities = [CopilotCapability.TextToText];

  static assetsConfig(config: PerplexityConfig) {
    return !!config.apiKey;
  }

  private buffer: string[] = [];

  private readonly logger = new Logger('Perplexity');

  constructor(private readonly config: PerplexityConfig) {
    assert(PerplexityProvider.assetsConfig(config));
  }

  readonly availableModels = [
    'llama-3.1-sonar-small-128k-online',
    'llama-3.1-sonar-large-128k-online',
    'llama-3.1-sonar-huge-128k-online',
  ];

  get type(): CopilotProviderType {
    return PerplexityProvider.type;
  }

  getCapabilities(): CopilotCapability[] {
    return PerplexityProvider.capabilities;
  }

  injectCitations(content: string, citations: string[]) {
    // Match [[n]] and [n] patterns
    // Not match if they're already part of a formatted citation
    const regex = /(?:\[\[(\d+)\]\]|\[(\d+)\])(?!\]?\([^)]*\))/g;
    return content.replace(regex, (_, g1, g2) => {
      const index = parseInt(g1 || g2) - 1;
      if (index >= 0 && index < citations.length) {
        return `[[${g1 || g2}](${citations[index]})]`;
      }
      return _;
    });
  }

  async isModelAvailable(model: string): Promise<boolean> {
    return this.availableModels.includes(model);
  }

  async generateText(
    messages: PromptMessage[],
    model: string = 'llama-3.1-sonar-small-128k-online',
    options: CopilotChatOptions = {}
  ): Promise<string> {
    await this.checkParams({ messages, model, options });
    try {
      metrics.ai.counter('chat_text_calls').add(1, { model });
      const sMessages = messages
        .map(({ content, role }) => ({ content, role }))
        .filter(({ content }) => typeof content === 'string');

      const params = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: sMessages,
          max_tokens: options.maxTokens || 4096,
        }),
      };
      const response = await fetch(
        'https://api.perplexity.ai/chat/completions',
        params
      );
      const json: PerplexityResponse = await response.json();
      return this.injectCitations(
        json.choices[0].message.content,
        json.citations
      );
    } catch (e: any) {
      metrics.ai.counter('chat_text_errors').add(1, { model });
      throw this.handleError(e);
    }
  }

  async *generateTextStream(
    messages: PromptMessage[],
    model: string = 'llama-3.1-sonar-small-128k-online',
    options: CopilotChatOptions = {}
  ): AsyncIterable<string> {
    await this.checkParams({ messages, model, options });
    try {
      metrics.ai.counter('chat_text_stream_calls').add(1, { model });
      const sMessages = messages
        .map(({ content, role }) => ({ content, role }))
        .filter(({ content }) => typeof content === 'string');

      const params = {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: sMessages,
          max_tokens: options.maxTokens || 4096,
          stream: true,
        }),
      };
      const response = await fetch(
        'https://api.perplexity.ai/chat/completions',
        params
      );
      if (response.body) {
        const reader = response.body.getReader();
        yield* this.processStreamChunks(reader, model);
      } else {
        const result = await this.generateText(messages, model, options);
        yield result;
      }
    } catch (e) {
      metrics.ai.counter('chat_text_stream_errors').add(1, { model });
      throw e;
    }
  }

  async *processStreamChunks(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    model: string
  ): AsyncGenerator<string> {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (this.buffer.length) {
            this.logger.warn(
              `Perplexity stream process error, buffer length ${this.buffer.length}, ${JSON.stringify(this.buffer.slice(0, 3))}.`
            );
          }
          break;
        }
        const str = new TextDecoder().decode(value);
        const lines = str.split('\n').filter(s => s !== `\r`);
        let deltaContent: string = '';
        let lastResponse: PerplexityResponse | null = null;

        for (const line of lines) {
          const result = this.tryToParseDeltaContent(line);
          if (result) {
            const { response, content } = result;
            lastResponse = response;
            deltaContent += content;
          } else {
            this.buffer.push(line);
            // try parse again
            if (this.buffer.length > 1) {
              const bufferStr = this.buffer.reduce(
                (prev, current) => String.raw`${prev}` + String.raw`${current}`,
                ''
              );
              const result = this.tryToParseDeltaContent(bufferStr);
              if (result) {
                const { response, content } = result;
                lastResponse = response;
                deltaContent += content;
                this.buffer = [];
              }
            }
          }
        }
        const res = lastResponse
          ? this.injectCitations(deltaContent, lastResponse.citations)
          : deltaContent;
        yield res;
      }
    } catch (e) {
      metrics.ai.counter('chat_text_stream_errors').add(1, { model });
      throw e;
    }
  }

  private tryToParseDeltaContent(str: string) {
    const START_TOKEN_REGEX = /^\s*data:\s*/;
    const match = str.match(START_TOKEN_REGEX);
    let response: PerplexityResponse | null = null;
    if (match) {
      const sliced = str.slice(match[0].length);
      response = this.strictParseJSON(sliced);
    } else {
      return null;
    }
    if (response) {
      const content = response.choices[0]?.delta?.content || '';
      return { response, content };
    }
    return null;
  }

  protected async checkParams({
    model,
  }: {
    messages?: PromptMessage[];
    embeddings?: string[];
    model: string;
    options: CopilotChatOptions;
  }) {
    if (!(await this.isModelAvailable(model))) {
      throw new CopilotPromptInvalid(`Invalid model: ${model}`);
    }
  }

  private handleError(e: any) {
    return new CopilotProviderSideError({
      provider: this.type,
      kind: 'unexpected_response',
      message: e?.message || 'Unexpected perplexity response',
    });
  }

  private strictParseJSON(str: string): PerplexityResponse | null {
    try {
      const parsed = JSON.parse(str);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
      return null;
    } catch {
      // ignore the error
      return null;
    }
  }
}

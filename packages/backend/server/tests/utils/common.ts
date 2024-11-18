import { INestApplication } from '@nestjs/common';
import type { Response } from 'supertest';
import supertest from 'supertest';

export function handleGraphQLError(resp: Response) {
  const { errors } = resp.body;
  if (errors) {
    const cause = errors[0];
    const stacktrace = cause.extensions?.stacktrace;
    throw new Error(
      stacktrace
        ? Array.isArray(stacktrace)
          ? stacktrace.join('\n')
          : String(stacktrace)
        : cause.message,
      cause
    );
  }
}

export const gqlEndpoint = '/graphql';

export function gql(app: INestApplication, query?: string) {
  const req = supertest(app.getHttpServer())
    .post(gqlEndpoint)
    .set({ 'x-request-id': 'test', 'x-operation-name': 'test' });

  if (query) {
    return req.send({ query });
  }

  return req;
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

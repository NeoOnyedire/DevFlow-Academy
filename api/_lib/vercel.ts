import type { IncomingMessage, ServerResponse } from 'node:http'

export type VercelRequest = IncomingMessage & {
  query: { [key: string]: string | string[] }
  cookies: { [key: string]: string }
  body: unknown
}

export type VercelResponse = ServerResponse & {
  send: (body: unknown) => VercelResponse
  json: (jsonBody: unknown) => VercelResponse
  status: (statusCode: number) => VercelResponse
  redirect: (statusOrUrl: string | number, url?: string) => VercelResponse
}

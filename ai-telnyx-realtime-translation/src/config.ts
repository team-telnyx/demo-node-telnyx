import 'dotenv/config';

import Ajv from 'ajv';
import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { Static, Type } from '@fastify/type-provider-typebox';

export enum NodeEnv {
  development = 'development',
  test = 'test',
  production = 'production',
}

const ConfigSchema = Type.Object({
  NODE_ENV: Type.Enum(NodeEnv),
  LOG_LEVEL: Type.String({ default: 'info' }),
  API_HOST: Type.String({ default: '0.0.0.0' }),
  API_PORT: Type.String({ default: '4040' }),
  NGROK_DOMAIN: Type.String(),
  TELNYX_API_KEY: Type.String(),
  TELNYX_CONNECTION_ID: Type.String(),
  TELNYX_AGENT_NUMBER: Type.String(),
  OPENAI_API_KEY: Type.String(),
});

// Remove compositing symbols using JSON parse/stringify
const StrictConfigSchema = JSON.parse(JSON.stringify(ConfigSchema));

const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true,
});

export type Config = Static<typeof ConfigSchema>;

const configPlugin: FastifyPluginAsync = async (server) => {
  const validate = ajv.compile(StrictConfigSchema);
  const valid = validate(process.env);
  if (!valid) {
    throw new Error(
      `.env file validation failed - ${JSON.stringify(
        validate.errors,
        null,
        2,
      )}`,
    );
  }

  server.decorate('config', process.env as Config);
};

declare module 'fastify' {
  interface FastifyInstance {
    config: Config;
  }
}

export default fp(configPlugin);

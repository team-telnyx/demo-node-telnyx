import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { FastifyBaseLogger } from 'fastify';
import Telnyx from 'telnyx';

import AudioInterceptor from '@/services/AudioInterceptor';
import StreamSocket, { StartBaseAudioMessage } from '@/services/StreamSocket';

const interceptWS: FastifyPluginAsyncTypebox = async (server) => {
  server.get(
    '/intercept',
    {
      websocket: true,
    },
    async (connection, req) => {
      const telnyx = Telnyx(server.config.TELNYX_API_KEY);
      const logger = req.diScope.resolve<FastifyBaseLogger>('logger');
      const ss = new StreamSocket({
        logger,
        socket: connection.socket,
      });
      const map =
        req.diScope.resolve<Map<string, AudioInterceptor>>('audioInterceptors');

      ss.onStart(async (message: StartBaseAudioMessage) => {
        const { customParameters } = message.start;

        if (
          customParameters?.direction === 'inbound' &&
          typeof customParameters.from === 'string'
        ) {
          ss.from = customParameters.from;
          const interceptor = new AudioInterceptor({
            logger,
            config: server.config,
            callerLanguage: customParameters.lang.toString(),
          });
          interceptor.callerSocket = ss;
          map.set(customParameters.from, interceptor);

          await telnyx.calls.create({
            connection_id: server.config.TELNYX_CONNECTION_ID,
            to: server.config.TELNYX_AGENT_NUMBER,
            from: customParameters.from,
            texml: \`
              <Response>
                <Speak>A customer is on the line.</Speak>
                <StartStream name="Outbound Audio Stream" url="wss://\${server.config.NGROK_DOMAIN}/intercept">
                  <Parameter name="direction" value="outbound"/>
                  <Parameter name="from" value="\${customParameters.from}"/>
                </StartStream>
              </Response>
            \`,
          });
        }

        if (
          customParameters?.direction === 'outbound' &&
          typeof customParameters.from === 'string'
        ) {
          const interceptor = map.get(customParameters.from);
          ss.from = customParameters.from;
          if (!interceptor) {
            logger.error(
              'No inbound interceptor found for %s',
              customParameters.from,
            );
            return;
          }
          interceptor.agentSocket = ss;
        }
      });

      ss.onStop((message) => {
        if (!message?.from) {
          logger.info('No from in message - unknown what interceptor to close');
          return;
        }

        const interceptor = map.get(message.from);
        if (!interceptor) {
          logger.error('No interceptor found for %s', message.from);
          return;
        }

        interceptor.close();
        map.delete(message.from);
      });
    },
  );
};

export default interceptWS;

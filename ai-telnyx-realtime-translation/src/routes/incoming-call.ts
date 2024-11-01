import { FastifyPluginAsync } from 'fastify';

const incomingCall: FastifyPluginAsync = async (server) => {
  server.post(
    '/incoming-call',
    {
      logLevel: 'info',
    },
    async (req, reply) => {
      const response = \`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Speak voice="female">Please wait while we connect your call.</Speak>
          <StartStream
            name="Example Audio Stream"
            url="wss://\${server.config.NGROK_DOMAIN}/intercept">
            <Parameter name="direction" value="inbound"/>
            <Parameter name="from" value="\${req.body.from}"/>
            <Parameter name="lang" value="\${req.query.lang}"/>
          </StartStream>
        </Response>
      \`;
      reply.type('application/xml').send(response.trim());
    },
  );
};

export default incomingCall;

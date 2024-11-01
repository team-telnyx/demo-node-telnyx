import { FastifyPluginAsync } from 'fastify';

const outboundCall: FastifyPluginAsync = async (server) => {
  server.post(
    '/outbound-call',
    {
      logLevel: 'info',
    },
    async (req, reply) => {
      const response = \`
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Speak>A customer is on the line.</Speak>
          <StartStream
            name="Outbound Audio Stream"
            url="wss://\${server.config.NGROK_DOMAIN}/intercept">
            <Parameter name="direction" value="outbound"/>
            <Parameter name="from" value="\${req.body.from}"/>
          </StartStream>
        </Response>
      \`;
      reply.type('application/xml').send(response.trim());
    },
  );
};

export default outboundCall;

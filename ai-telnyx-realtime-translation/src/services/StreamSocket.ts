import { FastifyBaseLogger } from 'fastify';
import { WebSocket } from '@fastify/websocket';

type BaseAudioMessage = {
  sequenceNumber: number;
};

export type ConnectedBaseAudioMessage = BaseAudioMessage & {
  event: 'connected';
  protocol: string;
};

export type StartBaseAudioMessage = BaseAudioMessage & {
  event: 'start';
  start: {
    streamId: string;
    customParameters: Record<string, unknown>;
  };
};

export type MediaBaseAudioMessage = BaseAudioMessage & {
  event: 'media';
  media: {
    payload: string;
    track: 'inbound' | 'outbound';
  };
};

export type StopBaseAudioMessage = BaseAudioMessage & {
  event: 'stop';
  from?: string;
};

type AudioMessage =
  | StartBaseAudioMessage
  | MediaBaseAudioMessage
  | StopBaseAudioMessage
  | ConnectedBaseAudioMessage;

type OnCallback<T> = (message: T) => void;

type StreamSocketOptions = {
  logger: FastifyBaseLogger;
  socket: WebSocket;
};

export default class StreamSocket {
  private readonly logger: FastifyBaseLogger;

  public readonly socket: WebSocket;

  public streamId: string;

  public from?: string;

  private onStartCallback: OnCallback<StartBaseAudioMessage>[] = [];

  private onConnectedCallback: OnCallback<ConnectedBaseAudioMessage>[] = [];

  private onMediaCallback: OnCallback<MediaBaseAudioMessage>[] = [];

  private onStopCallback: OnCallback<StopBaseAudioMessage>[] = [];

  constructor(options: StreamSocketOptions) {
    this.logger = options.logger;
    this.socket = options.socket;

    this.socket.on('message', this.onMessage);
    this.socket.on('close', () => {
      this.logger.info('WebSocket connection closed');
    });
    this.socket.on('error', (err) => {
      this.logger.error(\`WebSocket error: \${err}\`);
    });
  }

  public close() {
    this.socket.close();
  }

  public onConnected = (callback: OnCallback<ConnectedBaseAudioMessage>) => {
    this.onConnectedCallback.push(callback);
  };

  public onStart = (callback: OnCallback<StartBaseAudioMessage>) => {
    this.onStartCallback.push(callback);
  };

  public onMedia = (callback: OnCallback<MediaBaseAudioMessage>) => {
    this.onMediaCallback.push(callback);
  };

  public onStop = (callback: OnCallback<StopBaseAudioMessage>) => {
    this.onStopCallback.push(callback);
  };

  public send = (messages: string[], isLast = false) => {
    const buffers = messages.map((msg) => Buffer.from(msg, 'base64'));
    const payload = Buffer.concat(buffers).toString('base64');

    const mediaMessage = {
      event: 'media',
      streamId: this.streamId,
      media: {
        payload,
      },
    };
    this.socket.send(JSON.stringify(mediaMessage));
    if (isLast) {
      const markMessage = {
        event: 'mark',
        streamId: this.streamId,
        mark: {
          name: Date.now(),
        },
      };
      this.socket.send(JSON.stringify(markMessage));
    }
  };

  private onMessage = (message: unknown) => {
    const parse = () => {
      if (typeof message === 'string') {
        return JSON.parse(message.toString()) as AudioMessage;
      }
      return JSON.parse(message.toString()) as AudioMessage;
    };

    try {
      const parsed = parse();

      if (parsed.event === 'start') {
        this.onStartCallback.map((cb) => cb(parsed));
        this.streamId = parsed.start.streamId;
      } else if (parsed.event === 'media') {
        this.onMediaCallback.map((cb) => cb(parsed));
      } else if (parsed.event === 'stop') {
        this.onMediaCallback = [];
        this.onStartCallback = [];
        this.onConnectedCallback = [];

        this.onStopCallback.map((cb) => cb({ ...parsed, from: this.from }));
      } else if (parsed.event === 'connected') {
        this.onConnectedCallback.map((cb) => cb(parsed));
      } else if (parsed.event === 'mark') {
        // do something
      } else {
        this.logger.error('Unknown event: %s', JSON.stringify(parsed));
      }
    } catch (error) {
      this.logger.error('Error parsing message', { error });
      this.logger.error('Message is %s', JSON.stringify(message));
    }
  };
}

import { FastifyBaseLogger } from 'fastify';
import WebSocket from 'ws';

import StreamSocket, { MediaBaseAudioMessage } from '@/services/StreamSocket';
import { Config } from '@/config';
import { AI_PROMPT_AGENT, AI_PROMPT_CALLER } from '@/prompts';

type AudioInterceptorOptions = {
  logger: FastifyBaseLogger;
  config: Config;
  callerLanguage: string;
};

type OpenAIMessage = {
  event_id: string;
  type: string;
  delta: string;
};

export default class AudioInterceptor {
  private readonly logger: FastifyBaseLogger;
  private config: Config;
  private readonly callerLanguage?: string;
  #callerSocket?: StreamSocket;
  #agentSocket?: StreamSocket;
  #callerOpenAISocket?: WebSocket;
  #agentOpenAISocket?: WebSocket;

  public constructor(options: AudioInterceptorOptions) {
    this.logger = options.logger;
    this.config = options.config;
    this.callerLanguage = options.callerLanguage;
    this.setupOpenAISockets();
  }

  public close() {
    if (this.#callerSocket) {
      this.#callerSocket.close();
      this.#callerSocket = null;
    }
    if (this.#agentSocket) {
      this.#agentSocket.close();
      this.#agentSocket = null;
    }
    if (this.#callerOpenAISocket) {
      this.#callerOpenAISocket.close();
    }
    if (this.#agentOpenAISocket) {
      this.#agentOpenAISocket.close();
    }
  }

  public start() {
    if (!this.#agentSocket || !this.#callerSocket) {
      this.logger.error('Both sockets are not set. Cannot start interception');
      return;
    }
    this.#callerSocket.onMedia(
      this.translateAndForwardCallerAudio.bind(this),
    );
    this.#agentSocket.onMedia(
      this.translateAndForwardAgentAudio.bind(this),
    );
  }

  private translateAndForwardAgentAudio(message: MediaBaseAudioMessage) {
    if (!this.#agentOpenAISocket) {
      this.logger.error('Agent OpenAI WebSocket is not available.');
      return;
    } else {
      this.forwardAudioToOpenAIForTranslation(
        this.#agentOpenAISocket,
        message.media.payload,
      );
    }
  }

  private translateAndForwardCallerAudio(message: MediaBaseAudioMessage) {
    if (!this.#callerOpenAISocket) {
      this.logger.error('Caller OpenAI WebSocket is not available.');
      return;
    }
    this.forwardAudioToOpenAIForTranslation(
      this.#callerOpenAISocket,
      message.media.payload,
    );
  }

  private setupOpenAISockets() {
    const url = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01';
    const callerSocket = new WebSocket(url, {
      headers: {
        Authorization: \`Bearer \${this.config.OPENAI_API_KEY}\`,
        'OpenAI-Beta': 'realtime=v1'
      },
    });
    const agentSocket = new WebSocket(url, {
      headers: {
        Authorization: \`Bearer \${this.config.OPENAI_API_KEY}\`,
        'OpenAI-Beta': 'realtime=v1'
      },
    });
    const callerPrompt = AI_PROMPT_CALLER.replace(
      /\\[CALLER_LANGUAGE\\]/g,
      this.callerLanguage,
    );
    const agentPrompt = AI_PROMPT_AGENT.replace(
      /\\[CALLER_LANGUAGE\\]/g,
      this.callerLanguage,
    );

    this.#callerOpenAISocket = callerSocket;
    this.#agentOpenAISocket = agentSocket;

    const callerConfigMsg = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: callerPrompt,
        input_audio_format: 'pcmu',
        output_audio_format: 'pcmu',
        input_audio_transcription: {model: 'whisper-1'},
        turn_detection: {type: 'server_vad'},
        temperature: 0.6
      }
    }
    const agentConfigMsg = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: agentPrompt,
        input_audio_format: 'pcmu',
        output_audio_format: 'pcmu',
        input_audio_transcription: {model: 'whisper-1'},
        turn_detection: {type: 'server_vad'},
        temperature: 0.6
      }
    }

    callerSocket.on('open', () => {
      this.sendMessageToOpenAI(callerSocket, callerConfigMsg);
    });
    agentSocket.on('open', () => {
      this.sendMessageToOpenAI(agentSocket, agentConfigMsg);
    });

    callerSocket.on('message', (msg) => {
      const message = JSON.parse(msg.toString()) as OpenAIMessage;
      if (message.type === 'response.audio.delta') {
        this.#agentSocket.send([message.delta]);
      }
    });
    agentSocket.on('message', (msg) => {
      const message = JSON.parse(msg.toString()) as OpenAIMessage;
      if (message.type === 'response.audio.delta') {
        this.#callerSocket.send([message.delta]);
      }
    });
  }

  private forwardAudioToOpenAIForTranslation(socket: WebSocket, audio: String) {
    this.sendMessageToOpenAI(socket, {
      type: 'input_audio_buffer.append',
      audio: audio,
    });
  }

  private sendMessageToOpenAI(socket: WebSocket, message: object) {
    if (socket.readyState === WebSocket.OPEN) {
      const jsonMessage = JSON.stringify(message);
      socket.send(jsonMessage);
    }
  }

  get callerSocket(): StreamSocket {
    if (!this.#callerSocket) {
      throw new Error('Caller socket not set');
    }
    return this.#callerSocket;
  }

  set callerSocket(value: StreamSocket) {
    this.#callerSocket = value;
  }

  get agentSocket(): StreamSocket {
    if (!this.#agentSocket) {
      throw new Error('Agent socket not set');
    }
    return this.#agentSocket;
  }

  set agentSocket(value: StreamSocket) {
    this.#agentSocket = value;
  }
}

import OpenAI from 'openai';

// Lazy initialization - only create OpenAI instance when first accessed
let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 0,
      timeout: 60000,
    });
  }
  return _openai;
}

// Export a getter that creates the instance only when accessed
export const openai = {
  get chat() {
    return getOpenAI().chat;
  },
  get models() {
    return getOpenAI().models;
  },
  get audio() {
    return getOpenAI().audio;
  },
  get images() {
    return getOpenAI().images;
  },
  get files() {
    return getOpenAI().files;
  },
  get fineTuning() {
    return getOpenAI().fineTuning;
  },
  get beta() {
    return getOpenAI().beta;
  }
};

import { VapiProvider } from './VapiProvider';
import { SelfHostedVoiceProvider } from './SelfHostedVoiceProvider';
import { Logger } from '../utils/logger';

export class VoiceProviderFactory {
  static create(apiKey) {
    const providerType = import.meta.env.VITE_VOICE_PROVIDER || 'vapi';
    Logger.info(`Initializing VoiceProviderFactory with provider: ${providerType}`);
    
    if (providerType === 'self-hosted') {
      return new SelfHostedVoiceProvider(apiKey);
    }
    return new VapiProvider(apiKey);
  }
}

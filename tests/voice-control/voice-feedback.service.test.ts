import { describe, expect, it } from 'vitest';

import { VoiceFeedbackService } from '../../packages/frontend/core/src/modules/voice-control/services/voice-feedback.service';

const baseConfig = {
  audioEnabled: false,
  visualEnabled: false,
  speechRate: 1,
  speechPitch: 1,
  speechVolume: 1,
};

describe('VoiceFeedbackService', () => {
  it('initializes and speaks without audio or visual channels', async () => {
    const service = new VoiceFeedbackService();
    await service.initialize(baseConfig);
    await expect(service.speak('hello world')).resolves.toBeUndefined();
  });

  it('updates configuration values', async () => {
    const service = new VoiceFeedbackService();
    await service.initialize(baseConfig);

    await service.updateConfig({ speechRate: 1.5 });
    await expect(service.speak('testing rate')).resolves.toBeUndefined();
  });
});

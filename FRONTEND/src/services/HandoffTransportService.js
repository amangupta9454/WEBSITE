/**
 * HandoffTransportService.js
 * 
 * Abstract base class defining the contract for Vapi handoffs.
 * 
 * SOLID: Dependency Inversion Principle
 * The Transition Manager relies on this interface, not the Vapi SDK directly.
 */
export class HandoffTransportService {
  /**
   * Transfers the active call to the specified target.
   * 
   * @param {Object} params
   * @param {string} params.target - The target assistant name or ID (e.g., "David")
   * @param {string} params.greeting - The greeting to say before transferring
   * @param {string} params.openingQuestion - The question to ask after transferring
   * @param {string} params.reason - The reason for the transition
   */
  async transfer({ target, greeting, openingQuestion, reason }) {
    throw new Error("Method 'transfer' must be implemented.");
  }
}

/**
 * Concrete implementation for the Vapi Web SDK using a hidden system message.
 * This forces the Vapi LLM to instantly trigger its Squad handoff tool.
 */
export class SystemMessageHandoffTransport extends HandoffTransportService {
  /**
   * @param {Object} vapiInstance - The @vapi-ai/web SDK instance
   */
  constructor(vapiInstance) {
    super();
    this.vapi = vapiInstance;
  }

  async transfer({ target, greeting, openingQuestion, reason }) {
    if (!this.vapi) {
      console.warn("Vapi instance not provided to SystemMessageHandoffTransport");
      return;
    }

    const safeGreeting = greeting || '';
    const safeQuestion = openingQuestion || '';
    
    // This injects a hidden system prompt directly into the active WebRTC stream.
    this.vapi.send({
      type: "add-message",
      message: {
        role: "system",
        content: `ROUTER COMMAND: Transfer the call to ${target} immediately using the handoff tool. Reason: ${reason}. Say "${safeGreeting} ${safeQuestion}" right before the transfer.`
      },
      triggerResponseEnabled: true
    });
  }
}

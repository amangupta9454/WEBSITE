import Vapi from '@vapi-ai/web';
const vapi = new Vapi('test-key');
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(vapi)));

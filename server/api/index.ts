import { createApp } from '../src/app';

const app = createApp();

export default function handler(req: any, res: any) {
  return app(req, res);
}

// Support CommonJS export interop
if (typeof module !== 'undefined' && module.exports) {
  module.exports = handler;
  (module.exports as any).default = handler;
}

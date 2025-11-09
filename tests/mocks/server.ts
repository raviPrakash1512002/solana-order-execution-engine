import { WsManager } from '../../src/wsManager';

export default function createMockServer() {
  const mockWsManager = {
    ...WsManager,
    broadcast: jest.fn()
  };

  return {
    wsManager: mockWsManager,
    close: jest.fn().mockResolvedValue(undefined),
    server: {
      address: () => ({ port: 80 })
    }
  };
}
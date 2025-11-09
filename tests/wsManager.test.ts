import { WsManager } from '../src/wsManager';
import WebSocket from 'ws';
import { OrderUpdateEvent } from '../src/types';

jest.mock('ws');

describe('WsManager', () => {
  let mockSocket: jest.Mocked<WebSocket>;

  beforeEach(() => {
    mockSocket = new WebSocket(null) as jest.Mocked<WebSocket>;
    mockSocket.send = jest.fn();
  });

  it('adds and removes clients', () => {
    const clientId = 'client1';
    WsManager.add(clientId, mockSocket);
    
    const mockEvent: OrderUpdateEvent = {
      id: 'order1',
      status: 'filled',
      filled: 1.5,
      avgPrice: 100
    };
    
    WsManager.broadcast('order:update', mockEvent);
    expect(mockSocket.send).toHaveBeenCalledWith(
      expect.stringContaining('"event":"order:update"')
    );

    WsManager.remove(clientId);
    mockSocket.send.mockClear();
    WsManager.broadcast('order:update', mockEvent);
    expect(mockSocket.send).not.toHaveBeenCalled();
  });

  it('handles send failures gracefully', () => {
    const clientId = 'client1';
    WsManager.add(clientId, mockSocket);
    
    mockSocket.send.mockImplementation(() => {
      throw new Error('Send failed');
    });
    
    // Should not throw
    expect(() => {
      WsManager.broadcast('test', { id: '1', status: 'filled' });
    }).not.toThrow();
  });
});
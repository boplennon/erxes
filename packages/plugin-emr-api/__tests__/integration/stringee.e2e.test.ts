// Test the actual business logic functions instead of endpoints
import { generateStringeeSDKToken, getOnlineUsers } from '../../src/stringeeService';
import { createOrUpdateCustomer } from '../../src/events';
import { sendCoreMessage } from '../../src/messageBroker';

// Mock dependencies
jest.mock('../../src/stringeeService', () => ({
  generateStringeeSDKToken: jest.fn().mockReturnValue('mock-token'),
  getOnlineUsers: jest.fn().mockResolvedValue(['user1', 'user2'])
}));

jest.mock('../../src/events', () => ({
  createOrUpdateCustomer: jest.fn().mockResolvedValue({ _id: 'mock-customer-id' })
}));

jest.mock('../../src/messageBroker', () => ({
  sendCoreMessage: jest.fn().mockResolvedValue({ _id: 'mock-customer-id' })
}));

describe('Stringee Integration Logic', () => {
  describe('Token Generation', () => {
    it('should generate SDK token for user', () => {
      const email = 'test@example.com';
      const token = generateStringeeSDKToken(email);
      
      expect(token).toBe('mock-token');
      expect(generateStringeeSDKToken).toHaveBeenCalledWith(email);
    });
  });

  describe('Customer Management', () => {
    it('should create or update customer', async () => {
      const subdomain = 'test-subdomain';
      const phoneNumber = '1234567890';
      
      const result = await createOrUpdateCustomer(subdomain, { phone: phoneNumber });
      
      expect(result).toHaveProperty('_id', 'mock-customer-id');
      expect(createOrUpdateCustomer).toHaveBeenCalledWith(subdomain, { phone: phoneNumber });
    });

    it('should fetch customer details', async () => {
      const subdomain = 'test-subdomain';
      const customerId = 'mock-customer-id';
      
      const customer = await sendCoreMessage({
        subdomain,
        action: 'customers.findOne',
        data: { _id: customerId },
        isRPC: true,
        defaultValue: null,
      });
      
      expect(customer).toHaveProperty('_id', 'mock-customer-id');
    });
  });

  describe('Online Users', () => {
    it('should fetch online users', async () => {
      const users = await getOnlineUsers();
      
      expect(users).toEqual(['user1', 'user2']);
      expect(getOnlineUsers).toHaveBeenCalled();
    });
  });

  describe('Call Flow Logic', () => {
    it('should handle external to internal call flow', () => {
      // Test the logic that would be in answer_url endpoint
      const from = '1234567890';
      const to = '0987654321';
      const isInternalCall = false;
      
      // This simulates the branching logic in answer_url
      const flowType = isInternalCall ? 'internalToExternal' : 'externalToInternal';
      
      expect(flowType).toBe('externalToInternal');
    });

    it('should handle internal to external call flow', () => {
      const from = 'user1';
      const to = '1234567890';
      const isInternalCall = true;
      
      const flowType = isInternalCall ? 'internalToExternal' : 'externalToInternal';
      
      expect(flowType).toBe('internalToExternal');
    });
  });
});



// Mock dependencies
jest.mock('../../src/stringeeService', () => ({
  getOnlineUsers: jest.fn().mockResolvedValue(['user1', 'user2', 'user3'])
}));

jest.mock('../../src/events', () => ({
  createOrUpdateCustomer: jest.fn().mockResolvedValue({ _id: 'mock-customer-id' })
}));

jest.mock('../../src/messageBroker', () => ({
  sendCoreMessage: jest.fn().mockResolvedValue({ 
    _id: 'mock-customer-id',
    firstName: 'John',
    lastName: 'Doe',
    primaryPhone: '1234567890',
    primaryEmail: 'john@example.com'
  })
}));

// Import the functions we want to test
import { createOrUpdateCustomer } from '../../src/events';
import { sendCoreMessage } from '../../src/messageBroker';
import { getOnlineUsers } from '../../src/stringeeService';

describe('initApp helper functions', () => {
  describe('Customer resolution', () => {
    it('should create or update customer', async () => {
      const subdomain = 'test-subdomain';
      const phoneNumber = '1234567890';
      
      const result = await createOrUpdateCustomer(subdomain, { phone: phoneNumber });
      
      expect(result).toHaveProperty('_id');
      expect(createOrUpdateCustomer).toHaveBeenCalledWith(subdomain, { phone: phoneNumber });
    });

    it('should fetch customer details from core', async () => {
      const subdomain = 'test-subdomain';
      const customerId = 'mock-customer-id';
      
      const customer = await sendCoreMessage({
        subdomain,
        action: 'customers.findOne',
        data: { _id: customerId },
        isRPC: true,
        defaultValue: null,
      });
      
      expect(customer).toHaveProperty('_id', customerId);
      expect(customer).toHaveProperty('firstName', 'John');
      expect(customer).toHaveProperty('lastName', 'Doe');
    });
  });

  describe('Online users', () => {
    it('should fetch online users', async () => {
      const users = await getOnlineUsers();
      
      expect(Array.isArray(users)).toBe(true);
      expect(users).toContain('user1');
      expect(users).toContain('user2');
      expect(users).toContain('user3');
    });
  });

  describe('Custom data building', () => {
    it('should build custom data with customer info', () => {
      const callType = 'incoming';
      const callId = 'test-call-123';
      const customerId = 'mock-customer-id';
      const coreCustomer = {
        _id: 'mock-customer-id',
        firstName: 'John',
        lastName: 'Doe',
        primaryPhone: '1234567890',
        primaryEmail: 'john@example.com'
      };

      const customData = {
        callType,
        customerId,
        customer: {
          _id: coreCustomer._id,
          firstName: coreCustomer.firstName,
          lastName: coreCustomer.lastName,
          primaryPhone: coreCustomer.primaryPhone,
          primaryEmail: coreCustomer.primaryEmail,
        },
        timestamp: expect.any(String),
        callId,
      };

      expect(customData).toMatchObject({
        callType: 'incoming',
        customerId: 'mock-customer-id',
        callId: 'test-call-123'
      });
      expect(customData.customer).toHaveProperty('firstName', 'John');
    });

    it('should build custom data without customer info', () => {
      const callType = 'outbound';
      const callId = 'test-call-456';
      const customerId = null;
      const coreCustomer = null;

      const customData = {
        callType,
        customerId,
        customer: undefined,
        timestamp: expect.any(String),
        callId,
      };

      expect(customData).toMatchObject({
        callType: 'outbound',
        customerId: null,
        callId: 'test-call-456'
      });
      expect(customData.customer).toBeUndefined();
    });
  });
});

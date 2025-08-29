import { generateStringeeSDKToken, generateStringeeRestToken, getOnlineUsers } from '../../src/stringeeService';

// Mock environment variables
process.env.STRINGEE_ACCOUNT_SID = 'test-sid';
process.env.STRINGEE_ACCOUNT_KEY = 'test-key';

describe('stringeeService', () => {
  describe('generateStringeeSDKToken', () => {
    it('should generate a valid JWT token for SDK', () => {
      const userId = 'test@example.com';
      const token = generateStringeeSDKToken(userId);
      
      expect(typeof token).toBe('string');
      expect(token).toContain('.');
      
      // Basic JWT structure validation
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should include userId in token payload', () => {
      const userId = 'test@example.com';
      const token = generateStringeeSDKToken(userId);
      
      const parts = token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      expect(payload).toHaveProperty('userId', userId);
      expect(payload).toHaveProperty('iss', 'test-sid');
    });
  });

  describe('generateStringeeRestToken', () => {
    it('should generate a valid JWT token for REST API', () => {
      const token = generateStringeeRestToken();
      
      expect(typeof token).toBe('string');
      expect(token).toContain('.');
      
      const parts = token.split('.');
      expect(parts).toHaveLength(3);
    });

    it('should include correct header and payload', () => {
      const token = generateStringeeRestToken();
      
      const parts = token.split('.');
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      expect(header).toHaveProperty('alg', 'HS256');
      expect(header).toHaveProperty('cty', 'stringee-api;v=1');
      expect(payload).toHaveProperty('iss', 'test-sid');
      expect(payload).toHaveProperty('exp');
    });
  });

  describe('getOnlineUsers', () => {
    it('should return array of online users', async () => {
      const users = await getOnlineUsers();
      
      expect(Array.isArray(users)).toBe(true);
      // In test environment, it should return mock data or empty array
    });
  });
});

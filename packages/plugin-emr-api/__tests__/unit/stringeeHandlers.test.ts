import { pickTargetUserId, handleGenerateToken, handleEventUrl, handleAnswerUrl, activeCalls } from '../../src/routes/stringeeHandlers';

const mockCustomer = {
  _id: 'cust123',
  firstName: 'Jon',
  lastName: 'Snow',
  primaryPhone: '123',
  primaryEmail: 'a@b.com'
};

jest.mock('../../src/stringeeService', () => ({
  generateStringeeSDKToken: jest.fn().mockReturnValue('mock-token'),
  getOnlineUsers: jest.fn().mockResolvedValue(['user1', 'user2', 'user3'])
}));

jest.mock('../../src/events', () => {
  const mc = {
    _id: 'cust123',
    firstName: 'Jon',
    lastName: 'Snow',
    primaryPhone: '123',
    primaryEmail: 'a@b.com'
  };
  return {
    createOrUpdateCustomer: jest.fn().mockResolvedValue(mc)
  };
});

jest.mock('@erxes/api-utils/src/core', () => ({
  getSubdomain: jest.fn().mockReturnValue('test-subdomain')
}));

describe('stringeeHandlers', () => {
  beforeEach(() => {
    activeCalls.clear();
  });

  describe('pickTargetUserId', () => {
    it('should pick a user from online list', async () => {
      const user = await pickTargetUserId();
      expect(['user1', 'user2', 'user3']).toContain(user);
    });
  });

  describe('handleGenerateToken', () => {
    it('should 400 without email', async () => {
      const req: any = { body: {} };
      const res: any = { status: jest.fn().mockReturnValue({ json: jest.fn() }), json: jest.fn() };
      await handleGenerateToken(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should 200 with email', async () => {
      const req: any = { body: { email: 'tester@example.com' } };
      const res: any = { status: jest.fn(), json: jest.fn() };
      await handleGenerateToken(req, res);
      expect(res.json).toHaveBeenCalledWith({ token: 'mock-token' });
    });
  });

  describe('handleEventUrl', () => {
    it('should store new call entry', async () => {
      const req: any = { body: { call_id: 'c1', call_status: 'ringing', from: { number: '1' }, to: { number: '2' } } };
      const res: any = { status: jest.fn().mockReturnValue({ send: jest.fn() }) };
      await handleEventUrl(req, res);
      expect(activeCalls.has('c1')).toBe(true);
    });
  });

  describe('handleAnswerUrl', () => {
    it('should reject unsupported when missing params', async () => {
      const req: any = { query: {}, body: {}, protocol: 'http', get: () => 'localhost:3306' };
      const json = jest.fn();
      const res: any = { json };
      await handleAnswerUrl(req, res);
      expect(json).toHaveBeenCalledWith([{ action: 'reject', reason: 'call_type_not_supported' }]);
    });

    it('should return externalToInternal SCCO when from/to provided', async () => {
      const req: any = { query: { from: '123', to: 'agent' }, body: {}, protocol: 'http', get: () => 'localhost:3306' };
      const json = jest.fn();
      const res: any = { json };
      await handleAnswerUrl(req, res);
      const scco = json.mock.calls[0][0];
      expect(Array.isArray(scco)).toBe(true);
      expect(scco[0]).toHaveProperty('action', 'connect');
      expect(['user1','user2','user3']).toContain(scco[0].to.number);

      const parsed = JSON.parse(scco[0].customData);
      expect(parsed).toEqual(mockCustomer);
    });

    it('should produce correct SCCO for externalToInternal with sample input and customData equals customer', async () => {
      const sample = {
        from: '84366623950',
        to: '842471098507',
        uuid: 'f7256642-e91e-4e94-b765-6ad84f99c56c',
        callId: 'call-vn-1-75DXHUD8CE-1754868214204',
        fromInternal: 'false',
        accountId: '2342600',
        projectId: '2510600'
      };
      const req: any = { query: sample, body: {}, protocol: 'http', get: () => 'localhost:3306' };
      const json = jest.fn();
      const res: any = { json };

      await handleAnswerUrl(req, res);

      const scco = json.mock.calls[0][0];
      expect(Array.isArray(scco)).toBe(true);
      expect(scco[0]).toMatchObject({ action: 'connect' });
      expect(scco[0].from).toMatchObject({ type: 'external', number: sample.from, alias: sample.from });
      expect(['user1','user2','user3']).toContain(scco[0].to.number);

      const parsed = JSON.parse(scco[0].customData);
      expect(parsed).toEqual(mockCustomer);

      expect(activeCalls.has(sample.callId)).toBe(true);
      const call = activeCalls.get(sample.callId);
      expect(call).toMatchObject({ from: sample.from, to: sample.to, callId: sample.callId, isOutbound: false });
    });
  });
});

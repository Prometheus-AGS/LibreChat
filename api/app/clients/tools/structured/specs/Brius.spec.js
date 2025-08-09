const Brius = require('../Brius');

describe('Brius', () => {
  it('should be created with a token', () => {
    const brius = new Brius({ token: 'test-token' });
    expect(brius.token).toBe('test-token');
  });
});

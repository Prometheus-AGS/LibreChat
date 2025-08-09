const Brius = require('../Brius');

describe('Brius Tool', () => {
  let briusTool;

  beforeEach(() => {
    briusTool = new Brius({
      credentials: {
        email: 'test@example.com',
        password: 'testpassword',
        baseUrl: 'https://test.brius.com',
      },
    });
  });

  test('should be created with correct properties', () => {
    expect(briusTool.name).toBe('brius');
    expect(briusTool.baseUrl).toBe('https://test.brius.com');
    expect(briusTool.apiUrl).toBe('https://test.brius.com/api/v1');
    expect(briusTool.authUrl).toBe('https://test.brius.com/rest-auth');
  });

  test('should have comprehensive description', () => {
    expect(briusTool.description).toContain('BRIUS Planner Application API');
    expect(briusTool.description).toContain(
      'Authentication: login, logout, changePassword, getCurrentUser',
    );
    expect(briusTool.description).toContain(
      'Patient Management: listPatients, createPatient, getPatient, updatePatient, deletePatient',
    );
    expect(briusTool.description).toContain(
      'File Management: listFiles, uploadFile, getFile, deleteFile',
    );
  });

  test('should have valid Zod schema', () => {
    const schema = briusTool.schema;
    expect(schema).toBeDefined();

    // Test valid operation
    const validInput = { operation: 'login', email: 'test@example.com', password: 'password' };
    const result = schema.safeParse(validInput);
    expect(result.success).toBe(true);

    // Test invalid operation
    const invalidInput = { operation: 'invalidOperation' };
    const invalidResult = schema.safeParse(invalidInput);
    expect(invalidResult.success).toBe(false);
  });

  test('should validate all supported operations', () => {
    const supportedOperations = [
      'login',
      'logout',
      'changePassword',
      'getCurrentUser',
      'getApiRoot',
      'listPatients',
      'createPatient',
      'getPatient',
      'updatePatient',
      'deletePatient',
      'listInstructions',
      'createInstruction',
      'getInstruction',
      'listPlans',
      'getPlan',
      'listOffices',
      'listUsers',
      'listCourses',
      'listProducts',
      'listFiles',
      'uploadFile',
      'getFile',
      'deleteFile',
    ];

    supportedOperations.forEach((operation) => {
      const input = { operation };
      const result = briusTool.schema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  test('should build query string correctly', () => {
    const params = {
      limit: 10,
      offset: 0,
      status: 1,
      doctor: 123,
      suspended: false,
    };

    const queryString = briusTool.buildQueryString(params);
    expect(queryString).toContain('limit=10');
    expect(queryString).toContain('offset=0');
    expect(queryString).toContain('status=1');
    expect(queryString).toContain('doctor=123');
    expect(queryString).toContain('suspended=false');
  });

  test('should handle undefined and null values in query string', () => {
    const params = {
      limit: 10,
      offset: undefined,
      status: null,
      doctor: 123,
    };

    const queryString = briusTool.buildQueryString(params);
    expect(queryString).toContain('limit=10');
    expect(queryString).toContain('doctor=123');
    expect(queryString).not.toContain('offset');
    expect(queryString).not.toContain('status');
  });

  test('should handle error responses correctly', async () => {
    // Mock fetch to return error response
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.resolve({ detail: 'Invalid credentials' }),
      }),
    );

    const result = await briusTool._call({
      operation: 'login',
      email: 'invalid@example.com',
      password: 'wrong',
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('Invalid credentials');
    expect(result.operation).toBe('login');
  });

  test('should handle network errors correctly', async () => {
    // Mock fetch to throw network error
    global.fetch = jest.fn(() => Promise.reject(new TypeError('fetch failed')));

    const result = await briusTool._call({
      operation: 'login',
      email: 'test@example.com',
      password: 'password',
    });

    expect(result.error).toBe(true);
    expect(result.message).toContain('Network error');
    expect(result.operation).toBe('login');
  });

  test('should validate required parameters for operations', async () => {
    // Test login without required parameters
    const result = await briusTool._call({ operation: 'login' });

    expect(result.error).toBe(true);
    expect(result.message).toContain('Email and password are required');
  });

  test('should handle unknown operations', async () => {
    const result = await briusTool._call({ operation: 'unknownOperation' });

    expect(result.error).toBe(true);
    expect(result.message).toContain('Unknown operation');
  });
});

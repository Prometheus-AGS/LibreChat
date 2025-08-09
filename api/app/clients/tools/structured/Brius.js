const { StructuredTool } = require('@langchain/core/tools');
const { z } = require('zod');
const { getDjangoAuthToken } = require('~/server/services/Tools/djangoAuth');

class Brius extends StructuredTool {
  constructor(fields = {}) {
    super();
    this.name = 'brius';
    this.description = `BRIUS Planner Application API - A comprehensive dental practice management and orthodontic treatment planning system.
    
Available operations:
- Authentication: login, logout, changePassword, getCurrentUser
- API Discovery: getApiRoot
- Patient Management: listPatients, createPatient, getPatient, updatePatient, deletePatient
- Instructions: listInstructions, createInstruction, getInstruction
- Treatment Plans: listPlans, getPlan
- Office Management: listOffices
- User Management: listUsers
- Courses & Products: listCourses, listProducts
- File Management: listFiles, uploadFile, getFile, deleteFile

Use operation names to specify which API endpoint to call. All operations require authentication except 'login'.`;

    this.baseUrl = 'https://test.brius.com';
    this.apiUrl = `${this.baseUrl}/api/v1`;
    this.authUrl = `${this.baseUrl}/rest-auth`;

    // Store authentication credentials
    this.credentials = fields.credentials || {};

    // Token caching and retry logic
    this.cachedToken = null;
    this.tokenExpiry = null;
    this.maxRetryAttempts = 3;
  }

  get schema() {
    return z.object({
      operation: z
        .enum([
          // Authentication operations
          'login',
          'logout',
          'changePassword',
          'getCurrentUser',
          // API Discovery
          'getApiRoot',
          // Patient operations
          'listPatients',
          'createPatient',
          'getPatient',
          'updatePatient',
          'deletePatient',
          // Instruction operations
          'listInstructions',
          'createInstruction',
          'getInstruction',
          // Treatment plan operations
          'listPlans',
          'getPlan',
          // Office operations
          'listOffices',
          // User operations
          'listUsers',
          // Course and product operations
          'listCourses',
          'listProducts',
          // File operations
          'listFiles',
          'uploadFile',
          'getFile',
          'deleteFile',
          // Task operations
          'listTasks',
          'createTask',
          'getTask',
          'updateTask',
          'deleteTask',
          // Payment operations
          'listPayments',
          'createPayment',
          'getPayment',
          'updatePayment',
          // Records operations
          'listRecords',
          'createRecord',
          'getRecord',
          // Notification operations
          'listNotifications',
          'getNotification',
          'markNotificationRead',
        ])
        .describe('The BRIUS API operation to perform'),

      // Common parameters
      id: z.number().optional().describe('Resource ID for operations that target specific records'),
      format: z.enum(['json', 'api']).optional().describe('Response format'),

      // Pagination parameters
      limit: z
        .number()
        .min(1)
        .max(1000)
        .optional()
        .describe('Number of results to return (1-1000)'),
      offset: z.number().min(0).optional().describe('Number of results to skip for pagination'),

      // Authentication parameters
      email: z.string().email().optional().describe('Email for login operation'),
      password: z.string().optional().describe('Password for login and changePassword operations'),
      old_password: z.string().optional().describe('Current password for changePassword operation'),
      new_password1: z.string().optional().describe('New password for changePassword operation'),
      new_password2: z
        .string()
        .optional()
        .describe('Confirm new password for changePassword operation'),

      // Patient parameters
      status: z.number().optional().describe('Filter by patient status (0,1,2,4,5,10,11,12)'),
      doctor: z.number().optional().describe('Filter by doctor ID'),
      suspended: z.boolean().optional().describe('Filter by suspended status'),
      archived: z.boolean().optional().describe('Filter by archived status'),

      // Instruction parameters
      patient: z.number().optional().describe('Filter by patient ID'),
      course: z.number().optional().describe('Filter by course ID'),

      // Treatment plan parameters
      instruction: z.number().optional().describe('Filter by instruction ID'),

      // User parameters
      role: z.string().optional().describe('Filter by user role/group'),

      // File parameters
      file: z.any().optional().describe('File data for upload operations'),
      filename: z.string().optional().describe('Filename for file operations'),

      // Task parameters
      actor: z.number().optional().describe('Filter by assigned actor ID'),
      template: z.number().optional().describe('Filter by template ID'),

      // Payment parameters
      order: z.number().optional().describe('Filter by order ID'),

      // Records parameters
      target_type: z.number().optional().describe('Filter by target type'),
      target_id: z.number().optional().describe('Filter by target ID'),

      // Notification parameters
      recipient: z.number().optional().describe('Filter by recipient user ID'),
      read: z.boolean().optional().describe('Filter by read status'),

      // Request body data for create/update operations
      data: z.record(z.any()).optional().describe('Request body data for create/update operations'),
    });
  }

  /**
   * Invalidate cached authentication token
   */
  invalidateToken() {
    this.cachedToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Check if an error is an authentication error (401 or 403)
   * @param {Error} error - The error to check
   * @returns {boolean} - True if it's an auth error
   */
  isAuthError(error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('401') ||
      message.includes('403') ||
      message.includes('unauthorized') ||
      message.includes('forbidden')
    );
  }

  /**
   * Attempt to login and get a fresh token
   * @returns {Promise<string>} - Authentication token
   */
  async attemptLogin() {
    try {
      // Clear any cached token before attempting login
      this.invalidateToken();

      // Try to get token using the Django auth service
      const token = await getDjangoAuthToken(this.credentials);
      if (token) {
        // Cache the token (tokens typically last 24 hours, but we'll be conservative)
        this.cachedToken = token;
        this.tokenExpiry = Date.now() + 12 * 60 * 60 * 1000; // 12 hours
        return token;
      }

      throw new Error('Authentication required. Please provide valid credentials or login first.');
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async getAuthToken() {
    // Return cached token if it's still valid
    if (this.cachedToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.cachedToken;
    }

    // Get fresh token
    return await this.attemptLogin();
  }

  async makeRequest(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.non_field_errors) {
            errorMessage = errorData.non_field_errors.join(', ');
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (_e) {
          // Use default error message if JSON parsing fails
        }
        throw new Error(errorMessage);
      }

      // Handle different response types
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to BRIUS API');
      }
      throw error;
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    let retryCount = 0;

    while (retryCount <= this.maxRetryAttempts) {
      try {
        const token = await this.getAuthToken();
        const response = await this.makeRequest(url, {
          ...options,
          headers: {
            Authorization: `Token ${token}`,
            ...options.headers,
          },
        });

        // If we get here, the request was successful
        return response;
      } catch (error) {
        // Check if this is an authentication error
        if (this.isAuthError(error) && retryCount < this.maxRetryAttempts) {
          retryCount++;

          // Invalidate the cached token
          this.invalidateToken();

          // Try to get a fresh token for the next attempt
          try {
            await this.attemptLogin();
          } catch (loginError) {
            // If login fails, continue to retry logic to potentially try again
            if (retryCount >= this.maxRetryAttempts) {
              throw new Error(
                `Authentication failed after ${this.maxRetryAttempts} retry attempts. Please check your credentials. Last error: ${loginError.message}`,
              );
            }
          }

          // Continue the retry loop
          continue;
        }

        // If it's not an auth error, or we've exceeded retry attempts, throw the error
        if (retryCount >= this.maxRetryAttempts && this.isAuthError(error)) {
          throw new Error(
            `Authentication failed after ${this.maxRetryAttempts} retry attempts. Please check your credentials and try again.`,
          );
        }

        // For non-auth errors, throw immediately
        throw error;
      }
    }
  }

  /**
   * Make authenticated request for file uploads (special handling for FormData)
   * @param {string} url - The URL to make the request to
   * @param {FormData} formData - The form data to upload
   * @returns {Promise<Object>} - The response data
   */
  async makeAuthenticatedFileRequest(url, formData) {
    let retryCount = 0;

    while (retryCount <= this.maxRetryAttempts) {
      try {
        const token = await this.getAuthToken();
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Token ${token}`,
            // Don't set Content-Type for FormData, let browser set it with boundary
          },
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            if (errorData.detail) {
              errorMessage = errorData.detail;
            } else if (errorData.non_field_errors) {
              errorMessage = errorData.non_field_errors.join(', ');
            } else if (errorData.message) {
              errorMessage = errorData.message;
            }
          } catch (_e) {
            // Use default error message if JSON parsing fails
          }
          throw new Error(errorMessage);
        }

        return await response.json();
      } catch (error) {
        // Check if this is an authentication error
        if (this.isAuthError(error) && retryCount < this.maxRetryAttempts) {
          retryCount++;

          // Invalidate the cached token
          this.invalidateToken();

          // Try to get a fresh token for the next attempt
          try {
            await this.attemptLogin();
          } catch (loginError) {
            // If login fails, continue to retry logic to potentially try again
            if (retryCount >= this.maxRetryAttempts) {
              throw new Error(
                `Authentication failed after ${this.maxRetryAttempts} retry attempts. Please check your credentials. Last error: ${loginError.message}`,
              );
            }
          }

          // Continue the retry loop
          continue;
        }

        // If it's not an auth error, or we've exceeded retry attempts, throw the error
        if (retryCount >= this.maxRetryAttempts && this.isAuthError(error)) {
          throw new Error(
            `Authentication failed after ${this.maxRetryAttempts} retry attempts. Please check your credentials and try again.`,
          );
        }

        // For non-auth errors, throw immediately
        throw error;
      }
    }
  }

  buildQueryString(params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });
    return searchParams.toString();
  }

  async _call(args) {
    const { operation, ...params } = args;

    try {
      switch (operation) {
        // Authentication Operations
        case 'login':
          return await this.handleLogin(params);
        case 'logout':
          return await this.handleLogout();
        case 'changePassword':
          return await this.handleChangePassword(params);
        case 'getCurrentUser':
          return await this.handleGetCurrentUser();

        // API Discovery
        case 'getApiRoot':
          return await this.handleGetApiRoot();

        // Patient Operations
        case 'listPatients':
          return await this.handleListPatients(params);
        case 'createPatient':
          return await this.handleCreatePatient(params);
        case 'getPatient':
          return await this.handleGetPatient(params);
        case 'updatePatient':
          return await this.handleUpdatePatient(params);
        case 'deletePatient':
          return await this.handleDeletePatient(params);

        // Instruction Operations
        case 'listInstructions':
          return await this.handleListInstructions(params);
        case 'createInstruction':
          return await this.handleCreateInstruction(params);
        case 'getInstruction':
          return await this.handleGetInstruction(params);

        // Treatment Plan Operations
        case 'listPlans':
          return await this.handleListPlans(params);
        case 'getPlan':
          return await this.handleGetPlan(params);

        // Office Operations
        case 'listOffices':
          return await this.handleListOffices(params);

        // User Operations
        case 'listUsers':
          return await this.handleListUsers(params);

        // Course and Product Operations
        case 'listCourses':
          return await this.handleListCourses(params);
        case 'listProducts':
          return await this.handleListProducts(params);

        // File Operations
        case 'listFiles':
          return await this.handleListFiles(params);
        case 'uploadFile':
          return await this.handleUploadFile(params);
        case 'getFile':
          return await this.handleGetFile(params);
        case 'deleteFile':
          return await this.handleDeleteFile(params);

        // Task Operations
        case 'listTasks':
          return await this.handleListTasks(params);
        case 'createTask':
          return await this.handleCreateTask(params);
        case 'getTask':
          return await this.handleGetTask(params);
        case 'updateTask':
          return await this.handleUpdateTask(params);
        case 'deleteTask':
          return await this.handleDeleteTask(params);

        // Payment Operations
        case 'listPayments':
          return await this.handleListPayments(params);
        case 'createPayment':
          return await this.handleCreatePayment(params);
        case 'getPayment':
          return await this.handleGetPayment(params);
        case 'updatePayment':
          return await this.handleUpdatePayment(params);

        // Records Operations
        case 'listRecords':
          return await this.handleListRecords(params);
        case 'createRecord':
          return await this.handleCreateRecord(params);
        case 'getRecord':
          return await this.handleGetRecord(params);

        // Notification Operations
        case 'listNotifications':
          return await this.handleListNotifications(params);
        case 'getNotification':
          return await this.handleGetNotification(params);
        case 'markNotificationRead':
          return await this.handleMarkNotificationRead(params);

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      return {
        error: true,
        message: error.message,
        operation: operation,
      };
    }
  }

  // Authentication Operations
  async handleLogin({ email, password }) {
    if (!email || !password) {
      throw new Error('Email and password are required for login');
    }

    const url = `${this.authUrl}/login/`;
    const response = await this.makeRequest(url, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Cache the token from successful login
    if (response.key) {
      this.cachedToken = response.key;
      this.tokenExpiry = Date.now() + 12 * 60 * 60 * 1000; // 12 hours
    }

    return {
      success: true,
      message: 'Login successful',
      token: response.key,
      user: response.user,
    };
  }

  async handleLogout() {
    const url = `${this.authUrl}/logout/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
    });

    // Clear cached token on logout
    this.invalidateToken();

    return {
      success: true,
      message: response.detail || 'Logout successful',
    };
  }

  async handleChangePassword({ old_password, new_password1, new_password2 }) {
    if (!old_password || !new_password1 || !new_password2) {
      throw new Error('old_password, new_password1, and new_password2 are required');
    }

    const url = `${this.authUrl}/password/change/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password1, new_password2 }),
    });

    return {
      success: true,
      message: response.detail || 'Password changed successfully',
    };
  }

  async handleGetCurrentUser() {
    const url = `${this.authUrl}/user/`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      user: response,
    };
  }

  // API Discovery
  async handleGetApiRoot() {
    const url = `${this.apiUrl}/`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      endpoints: response,
    };
  }

  // Patient Operations
  async handleListPatients({ format, limit, offset, status, doctor, suspended, archived }) {
    const queryParams = this.buildQueryString({
      format,
      limit,
      offset,
      status,
      doctor,
      suspended,
      archived,
    });

    const url = `${this.apiUrl}/patients/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      patients: response,
    };
  }

  async handleCreatePatient({ data }) {
    if (!data) {
      throw new Error('Patient data is required for creation');
    }

    const url = `${this.apiUrl}/patients/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return {
      success: true,
      message: 'Patient created successfully',
      patient: response,
    };
  }

  async handleGetPatient({ id, format }) {
    if (!id) {
      throw new Error('Patient ID is required');
    }

    const queryParams = this.buildQueryString({ format });
    const url = `${this.apiUrl}/patients/${id}/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      patient: response,
    };
  }

  async handleUpdatePatient({ id, data }) {
    if (!id) {
      throw new Error('Patient ID is required');
    }
    if (!data) {
      throw new Error('Patient data is required for update');
    }

    const url = `${this.apiUrl}/patients/${id}/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return {
      success: true,
      message: 'Patient updated successfully',
      patient: response,
    };
  }

  async handleDeletePatient({ id }) {
    if (!id) {
      throw new Error('Patient ID is required');
    }

    const url = `${this.apiUrl}/patients/${id}/`;
    await this.makeAuthenticatedRequest(url, {
      method: 'DELETE',
    });

    return {
      success: true,
      message: 'Patient deleted successfully',
    };
  }

  // Instruction Operations
  async handleListInstructions({ format, limit, offset, patient, status, course }) {
    const queryParams = this.buildQueryString({
      format,
      limit,
      offset,
      patient,
      status,
      course,
    });

    const url = `${this.apiUrl}/instructions/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      instructions: response,
    };
  }

  async handleCreateInstruction({ data }) {
    if (!data) {
      throw new Error('Instruction data is required for creation');
    }

    const url = `${this.apiUrl}/instructions/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return {
      success: true,
      message: 'Instruction created successfully',
      instruction: response,
    };
  }

  async handleGetInstruction({ id, format }) {
    if (!id) {
      throw new Error('Instruction ID is required');
    }

    const queryParams = this.buildQueryString({ format });
    const url = `${this.apiUrl}/instructions/${id}/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      instruction: response,
    };
  }

  // Treatment Plan Operations
  async handleListPlans({ format, limit, offset, instruction }) {
    const queryParams = this.buildQueryString({
      format,
      limit,
      offset,
      instruction,
    });

    const url = `${this.apiUrl}/plans/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      plans: response,
    };
  }

  async handleGetPlan({ id, format }) {
    if (!id) {
      throw new Error('Plan ID is required');
    }

    const queryParams = this.buildQueryString({ format });
    const url = `${this.apiUrl}/plans/${id}/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      plan: response,
    };
  }

  // Office Operations
  async handleListOffices({ format, limit, offset, doctor }) {
    const queryParams = this.buildQueryString({
      format,
      limit,
      offset,
      doctor,
    });

    const url = `${this.apiUrl}/offices/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      offices: response,
    };
  }

  // User Operations
  async handleListUsers({ format, limit, offset, role }) {
    const queryParams = this.buildQueryString({
      format,
      limit,
      offset,
      role,
    });

    const url = `${this.apiUrl}/users/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      users: response,
    };
  }

  // Course and Product Operations
  async handleListCourses({ format }) {
    const queryParams = this.buildQueryString({ format });
    const url = `${this.apiUrl}/courses/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      courses: response,
    };
  }

  async handleListProducts({ format, course }) {
    const queryParams = this.buildQueryString({ format, course });
    const url = `${this.apiUrl}/products/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      products: response,
    };
  }

  // File Operations
  async handleListFiles({ format, limit, offset }) {
    const queryParams = this.buildQueryString({
      format,
      limit,
      offset,
    });

    const url = `${this.apiUrl}/files/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      files: response,
    };
  }

  async handleUploadFile({ file, filename, data }) {
    if (!file && !data) {
      throw new Error('File data is required for upload');
    }

    const url = `${this.apiUrl}/files/`;

    // Handle file upload with FormData
    const formData = new FormData();
    if (file) {
      formData.append('file', file, filename);
    }
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const result = await this.makeAuthenticatedFileRequest(url, formData);
    return {
      success: true,
      message: 'File uploaded successfully',
      file: result,
    };
  }

  async handleGetFile({ id, format }) {
    if (!id) {
      throw new Error('File ID is required');
    }

    const queryParams = this.buildQueryString({ format });
    const url = `${this.apiUrl}/files/${id}/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      file: response,
    };
  }

  async handleDeleteFile({ id }) {
    if (!id) {
      throw new Error('File ID is required');
    }

    const url = `${this.apiUrl}/files/${id}/`;
    await this.makeAuthenticatedRequest(url, {
      method: 'DELETE',
    });

    return {
      success: true,
      message: 'File deleted successfully',
    };
  }

  // Task Operations
  async handleListTasks({ format, limit, offset, instruction, actor, template }) {
    const queryParams = this.buildQueryString({
      format,
      limit,
      offset,
      instruction,
      actor,
      template,
    });

    const url = `${this.apiUrl}/tasks/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      tasks: response,
    };
  }

  async handleCreateTask({ data }) {
    if (!data) {
      throw new Error('Task data is required for creation');
    }

    const url = `${this.apiUrl}/tasks/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return {
      success: true,
      message: 'Task created successfully',
      task: response,
    };
  }

  async handleGetTask({ id, format }) {
    if (!id) {
      throw new Error('Task ID is required');
    }

    const queryParams = this.buildQueryString({ format });
    const url = `${this.apiUrl}/tasks/${id}/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      task: response,
    };
  }

  async handleUpdateTask({ id, data }) {
    if (!id) {
      throw new Error('Task ID is required');
    }
    if (!data) {
      throw new Error('Task data is required for update');
    }

    const url = `${this.apiUrl}/tasks/${id}/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return {
      success: true,
      message: 'Task updated successfully',
      task: response,
    };
  }

  async handleDeleteTask({ id }) {
    if (!id) {
      throw new Error('Task ID is required');
    }

    const url = `${this.apiUrl}/tasks/${id}/`;
    await this.makeAuthenticatedRequest(url, {
      method: 'DELETE',
    });

    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }

  // Payment Operations
  async handleListPayments({ format, limit, offset, instruction, doctor }) {
    const queryParams = this.buildQueryString({
      format,
      limit,
      offset,
      instruction,
      doctor,
    });

    const url = `${this.apiUrl}/payments/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      payments: response,
    };
  }

  async handleCreatePayment({ data }) {
    if (!data) {
      throw new Error('Payment data is required for creation');
    }

    const url = `${this.apiUrl}/payments/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return {
      success: true,
      message: 'Payment created successfully',
      payment: response,
    };
  }

  async handleGetPayment({ id, format }) {
    if (!id) {
      throw new Error('Payment ID is required');
    }

    const queryParams = this.buildQueryString({ format });
    const url = `${this.apiUrl}/payments/${id}/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      payment: response,
    };
  }

  async handleUpdatePayment({ id, data }) {
    if (!id) {
      throw new Error('Payment ID is required');
    }
    if (!data) {
      throw new Error('Payment data is required for update');
    }

    const url = `${this.apiUrl}/payments/${id}/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    return {
      success: true,
      message: 'Payment updated successfully',
      payment: response,
    };
  }

  // Records Operations
  async handleListRecords({ format, limit, offset, type }) {
    const queryParams = this.buildQueryString({
      format,
      limit,
      offset,
      type,
    });

    const url = `${this.apiUrl}/records/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      records: response,
    };
  }

  async handleCreateRecord({ data }) {
    if (!data) {
      throw new Error('Record data is required for creation');
    }

    const url = `${this.apiUrl}/records/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return {
      success: true,
      message: 'Record created successfully',
      record: response,
    };
  }

  async handleGetRecord({ id, format }) {
    if (!id) {
      throw new Error('Record ID is required');
    }

    const queryParams = this.buildQueryString({ format });
    const url = `${this.apiUrl}/records/${id}/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      record: response,
    };
  }

  // Notification Operations
  async handleListNotifications({ format, limit, offset, recipient, read }) {
    const queryParams = this.buildQueryString({
      format,
      limit,
      offset,
      recipient,
      read,
    });

    const url = `${this.apiUrl}/notifications/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      notifications: response,
    };
  }

  async handleGetNotification({ id, format }) {
    if (!id) {
      throw new Error('Notification ID is required');
    }

    const queryParams = this.buildQueryString({ format });
    const url = `${this.apiUrl}/notifications/${id}/${queryParams ? `?${queryParams}` : ''}`;
    const response = await this.makeAuthenticatedRequest(url);

    return {
      success: true,
      notification: response,
    };
  }

  async handleMarkNotificationRead({ id }) {
    if (!id) {
      throw new Error('Notification ID is required');
    }

    const url = `${this.apiUrl}/notifications/${id}/mark_read/`;
    const response = await this.makeAuthenticatedRequest(url, {
      method: 'POST',
    });

    return {
      success: true,
      message: 'Notification marked as read',
      notification: response,
    };
  }
}

module.exports = Brius;

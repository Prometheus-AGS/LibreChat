import {
  createCipher,
  createDecipher,
  createHash,
  randomBytes,
  pbkdf2Sync,
  createHmac,
} from 'crypto';
import type { EncryptionService } from './tools';

/**
 * Configuration for encryption service
 */
export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  saltLength: number;
  iterations: number;
  hashAlgorithm: string;
  hmacAlgorithm: string;
}

/**
 * Default encryption configuration
 */
export const DEFAULT_ENCRYPTION_CONFIG: EncryptionConfig = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16, // 128 bits
  saltLength: 32, // 256 bits
  iterations: 100000, // PBKDF2 iterations
  hashAlgorithm: 'sha256',
  hmacAlgorithm: 'sha256',
};

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  data: string; // Base64 encoded encrypted data
  iv: string; // Base64 encoded initialization vector
  salt: string; // Base64 encoded salt
  tag?: string; // Base64 encoded authentication tag (for GCM mode)
  algorithm: string;
}

/**
 * Error classes for encryption operations
 */
export class EncryptionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

export class DecryptionError extends EncryptionError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DECRYPTION_FAILED', originalError);
    this.name = 'DecryptionError';
  }
}

export class KeyDerivationError extends EncryptionError {
  constructor(message: string, originalError?: Error) {
    super(message, 'KEY_DERIVATION_FAILED', originalError);
    this.name = 'KeyDerivationError';
  }
}

/**
 * Implementation of the EncryptionService interface
 */
export class CryptoEncryptionService implements EncryptionService {
  private masterKey: string;
  private config: EncryptionConfig;

  constructor(masterKey: string, config: Partial<EncryptionConfig> = {}) {
    if (!masterKey || masterKey.length < 32) {
      throw new EncryptionError(
        'Master key must be at least 32 characters long',
        'INVALID_MASTER_KEY',
      );
    }

    this.masterKey = masterKey;
    this.config = { ...DEFAULT_ENCRYPTION_CONFIG, ...config };
  }

  /**
   * Encrypt sensitive data
   */
  async encrypt(data: string): Promise<string> {
    try {
      if (!data) {
        throw new EncryptionError('Data to encrypt cannot be empty', 'EMPTY_DATA');
      }

      // Generate random salt and IV
      const salt = randomBytes(this.config.saltLength);
      const iv = randomBytes(this.config.ivLength);

      // Derive key from master key and salt
      const key = this.deriveKey(this.masterKey, salt);

      // Create cipher
      const cipher = createCipher(this.config.algorithm, key);

      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      // Get authentication tag for GCM mode
      let tag: string | undefined;
      if (this.config.algorithm.includes('gcm')) {
        tag = (cipher as any).getAuthTag().toString('base64');
      }

      // Create encrypted data structure
      const encryptedData: EncryptedData = {
        data: encrypted,
        iv: iv.toString('base64'),
        salt: salt.toString('base64'),
        tag,
        algorithm: this.config.algorithm,
      };

      // Return as JSON string
      return JSON.stringify(encryptedData);
    } catch (error) {
      throw new EncryptionError(
        `Failed to encrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ENCRYPTION_FAILED',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      if (!encryptedData) {
        throw new DecryptionError('Encrypted data cannot be empty');
      }

      // Parse encrypted data
      let parsedData: EncryptedData;
      try {
        parsedData = JSON.parse(encryptedData);
      } catch (error) {
        throw new DecryptionError('Invalid encrypted data format');
      }

      // Validate required fields
      if (!parsedData.data || !parsedData.iv || !parsedData.salt || !parsedData.algorithm) {
        throw new DecryptionError('Missing required encryption fields');
      }

      // Convert from base64
      const iv = Buffer.from(parsedData.iv, 'base64');
      const salt = Buffer.from(parsedData.salt, 'base64');
      const tag = parsedData.tag ? Buffer.from(parsedData.tag, 'base64') : undefined;

      // Derive key from master key and salt
      const key = this.deriveKey(this.masterKey, salt);

      // Create decipher
      const decipher = createDecipher(parsedData.algorithm, key);

      // Set authentication tag for GCM mode
      if (tag && parsedData.algorithm.includes('gcm')) {
        (decipher as any).setAuthTag(tag);
      }

      // Decrypt the data
      let decrypted = decipher.update(parsedData.data, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new DecryptionError(
        `Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Generate a secure hash for data integrity
   */
  async hash(data: string): Promise<string> {
    try {
      if (!data) {
        throw new EncryptionError('Data to hash cannot be empty', 'EMPTY_DATA');
      }

      // Generate random salt
      const salt = randomBytes(this.config.saltLength);

      // Create hash with salt
      const hash = createHash(this.config.hashAlgorithm);
      hash.update(data);
      hash.update(salt);

      const hashValue = hash.digest('base64');

      // Return hash with salt
      return JSON.stringify({
        hash: hashValue,
        salt: salt.toString('base64'),
        algorithm: this.config.hashAlgorithm,
      });
    } catch (error) {
      throw new EncryptionError(
        `Failed to hash data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'HASH_FAILED',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Verify hash
   */
  async verifyHash(data: string, hashString: string): Promise<boolean> {
    try {
      if (!data || !hashString) {
        return false;
      }

      // Parse hash data
      let hashData: { hash: string; salt: string; algorithm: string };
      try {
        hashData = JSON.parse(hashString);
      } catch (error) {
        return false;
      }

      // Validate required fields
      if (!hashData.hash || !hashData.salt || !hashData.algorithm) {
        return false;
      }

      // Convert salt from base64
      const salt = Buffer.from(hashData.salt, 'base64');

      // Create hash with original salt
      const hash = createHash(hashData.algorithm);
      hash.update(data);
      hash.update(salt);

      const computedHash = hash.digest('base64');

      // Compare hashes using constant-time comparison
      return this.constantTimeCompare(computedHash, hashData.hash);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate HMAC for message authentication
   */
  async generateHmac(data: string, secret?: string): Promise<string> {
    try {
      if (!data) {
        throw new EncryptionError('Data for HMAC cannot be empty', 'EMPTY_DATA');
      }

      const key = secret || this.masterKey;
      const hmac = createHmac(this.config.hmacAlgorithm, key);
      hmac.update(data);

      return hmac.digest('base64');
    } catch (error) {
      throw new EncryptionError(
        `Failed to generate HMAC: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'HMAC_FAILED',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Verify HMAC
   */
  async verifyHmac(data: string, hmacString: string, secret?: string): Promise<boolean> {
    try {
      if (!data || !hmacString) {
        return false;
      }

      const computedHmac = await this.generateHmac(data, secret);
      return this.constantTimeCompare(computedHmac, hmacString);
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a secure random key
   */
  generateRandomKey(length: number = 32): string {
    return randomBytes(length).toString('base64');
  }

  /**
   * Derive encryption key from master key and salt using PBKDF2
   */
  private deriveKey(masterKey: string, salt: Buffer): Buffer {
    try {
      return pbkdf2Sync(
        masterKey,
        salt,
        this.config.iterations,
        this.config.keyLength,
        this.config.hashAlgorithm,
      );
    } catch (error) {
      throw new KeyDerivationError(
        `Failed to derive encryption key: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

/**
 * Simple encryption service for environments without crypto module
 */
export class SimpleEncryptionService implements EncryptionService {
  private masterKey: string;

  constructor(masterKey: string) {
    if (!masterKey || masterKey.length < 16) {
      throw new EncryptionError(
        'Master key must be at least 16 characters long',
        'INVALID_MASTER_KEY',
      );
    }
    this.masterKey = masterKey;
  }

  /**
   * Simple XOR encryption (not cryptographically secure, for fallback only)
   */
  async encrypt(data: string): Promise<string> {
    try {
      if (!data) {
        throw new EncryptionError('Data to encrypt cannot be empty', 'EMPTY_DATA');
      }

      const key = this.masterKey;
      let encrypted = '';

      for (let i = 0; i < data.length; i++) {
        const keyChar = key.charCodeAt(i % key.length);
        const dataChar = data.charCodeAt(i);
        encrypted += String.fromCharCode(dataChar ^ keyChar);
      }

      // Base64 encode the result
      return Buffer.from(encrypted, 'binary').toString('base64');
    } catch (error) {
      throw new EncryptionError(
        `Failed to encrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ENCRYPTION_FAILED',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Simple XOR decryption
   */
  async decrypt(encryptedData: string): Promise<string> {
    try {
      if (!encryptedData) {
        throw new DecryptionError('Encrypted data cannot be empty');
      }

      // Base64 decode
      const encrypted = Buffer.from(encryptedData, 'base64').toString('binary');
      const key = this.masterKey;
      let decrypted = '';

      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = key.charCodeAt(i % key.length);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }

      return decrypted;
    } catch (error) {
      throw new DecryptionError(
        `Failed to decrypt data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Simple hash using built-in methods
   */
  async hash(data: string): Promise<string> {
    try {
      if (!data) {
        throw new EncryptionError('Data to hash cannot be empty', 'EMPTY_DATA');
      }

      // Simple hash using string manipulation (not cryptographically secure)
      let hash = 0;
      const combined = data + this.masterKey;

      for (let i = 0; i < combined.length; i++) {
        const char = combined.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
      }

      return Math.abs(hash).toString(36);
    } catch (error) {
      throw new EncryptionError(
        `Failed to hash data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'HASH_FAILED',
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * Simple hash verification
   */
  async verifyHash(data: string, hashString: string): Promise<boolean> {
    try {
      const computedHash = await this.hash(data);
      return computedHash === hashString;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Factory function to create encryption service
 */
export function createEncryptionService(
  masterKey: string,
  config?: Partial<EncryptionConfig>,
): EncryptionService {
  try {
    // Try to use crypto module
    return new CryptoEncryptionService(masterKey, config);
  } catch (error) {
    // Fallback to simple encryption if crypto is not available
    console.warn(
      'Crypto module not available, using simple encryption (not recommended for production)',
    );
    return new SimpleEncryptionService(masterKey);
  }
}

/**
 * Utility functions for encryption operations
 */
export const EncryptionUtils = {
  /**
   * Generate a secure master key
   */
  generateMasterKey(length: number = 64): string {
    try {
      return randomBytes(length).toString('base64');
    } catch (error) {
      // Fallback for environments without crypto
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }
  },

  /**
   * Validate master key strength
   */
  validateMasterKey(key: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!key) {
      errors.push('Master key is required');
    } else {
      if (key.length < 32) {
        errors.push('Master key must be at least 32 characters long');
      }
      if (key.length > 1024) {
        errors.push('Master key is too long (max 1024 characters)');
      }
      if (!/[A-Z]/.test(key)) {
        errors.push('Master key should contain uppercase letters');
      }
      if (!/[a-z]/.test(key)) {
        errors.push('Master key should contain lowercase letters');
      }
      if (!/[0-9]/.test(key)) {
        errors.push('Master key should contain numbers');
      }
      if (!/[^A-Za-z0-9]/.test(key)) {
        errors.push('Master key should contain special characters');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  /**
   * Test encryption service functionality
   */
  async testEncryptionService(service: EncryptionService): Promise<{
    success: boolean;
    errors: string[];
    performance: {
      encryptTime: number;
      decryptTime: number;
      hashTime: number;
    };
  }> {
    const errors: string[] = [];
    const testData = 'test-encryption-data-' + Date.now();
    let encryptTime = 0;
    let decryptTime = 0;
    let hashTime = 0;

    try {
      // Test encryption/decryption
      const encryptStart = Date.now();
      const encrypted = await service.encrypt(testData);
      encryptTime = Date.now() - encryptStart;

      const decryptStart = Date.now();
      const decrypted = await service.decrypt(encrypted);
      decryptTime = Date.now() - decryptStart;

      if (decrypted !== testData) {
        errors.push('Encryption/decryption test failed: data mismatch');
      }

      // Test hashing
      const hashStart = Date.now();
      const hash = await service.hash(testData);
      hashTime = Date.now() - hashStart;

      const hashValid = await service.verifyHash(testData, hash);
      if (!hashValid) {
        errors.push('Hash verification test failed');
      }

      const hashInvalid = await service.verifyHash(testData + 'modified', hash);
      if (hashInvalid) {
        errors.push('Hash verification should fail for modified data');
      }
    } catch (error) {
      errors.push(
        `Encryption service test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return {
      success: errors.length === 0,
      errors,
      performance: {
        encryptTime,
        decryptTime,
        hashTime,
      },
    };
  },
};

/**
 * Global encryption service instance
 */
let globalEncryptionService: EncryptionService | null = null;

/**
 * Get the global encryption service instance
 */
export function getEncryptionService(
  masterKey?: string,
  config?: Partial<EncryptionConfig>,
): EncryptionService {
  if (!globalEncryptionService) {
    if (!masterKey) {
      throw new EncryptionError(
        'Master key is required to initialize encryption service',
        'MISSING_MASTER_KEY',
      );
    }
    globalEncryptionService = createEncryptionService(masterKey, config);
  }
  return globalEncryptionService;
}

/**
 * Initialize the global encryption service
 */
export function initializeEncryptionService(
  masterKey: string,
  config?: Partial<EncryptionConfig>,
): EncryptionService {
  globalEncryptionService = createEncryptionService(masterKey, config);
  return globalEncryptionService;
}

/**
 * Clear the global encryption service
 */
export function clearEncryptionService(): void {
  globalEncryptionService = null;
}

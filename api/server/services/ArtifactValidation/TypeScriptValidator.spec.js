const TypeScriptValidator = require('./TypeScriptValidator');

describe('TypeScriptValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new TypeScriptValidator();
  });

  describe('validate', () => {
    test('should validate a simple React component successfully', async () => {
      const artifact = {
        identifier: 'test-component',
        type: 'application/vnd.react',
        title: 'Test Component',
        content: `
import React from 'react';

const TestComponent = () => {
  return <div>Hello World</div>;
};

export default TestComponent;
        `,
      };

      const result = await validator.validate(artifact);

      console.log('Simple component validation result:', result);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should fail validation for React component with syntax errors', async () => {
      const artifact = {
        identifier: 'invalid-component',
        type: 'application/vnd.react',
        title: 'Invalid Component',
        content: `
import React from 'react';

const InvalidComponent = () => {
  return <div>Hello World</div>
  // Missing closing brace
        `,
      };

      const result = await validator.validate(artifact);

      console.log('Invalid component validation result:', result);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate React component with hooks', async () => {
      const artifact = {
        identifier: 'hooks-component',
        type: 'application/vnd.react',
        title: 'Hooks Component',
        content: `
import React, { useState, useEffect } from 'react';

const HooksComponent = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = \`Count: \${count}\`;
  }, [count]);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

export default HooksComponent;
        `,
      };

      const result = await validator.validate(artifact);

      console.log('Hooks component validation result:', result);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should validate React component with TypeScript types', async () => {
      const artifact = {
        identifier: 'typescript-component',
        type: 'application/vnd.react',
        title: 'TypeScript Component',
        content: `
import React from 'react';

interface Props {
  name: string;
  age?: number;
}

const TypeScriptComponent: React.FC<Props> = ({ name, age }) => {
  return (
    <div>
      <p>Name: {name}</p>
      {age && <p>Age: {age}</p>}
    </div>
  );
};

export default TypeScriptComponent;
        `,
      };

      const result = await validator.validate(artifact);

      console.log('TypeScript component validation result:', result);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should handle artifact with no content', async () => {
      const artifact = {
        identifier: 'empty-component',
        type: 'application/vnd.react',
        title: 'Empty Component',
        content: '',
      };

      const result = await validator.validate(artifact);

      console.log('Empty component validation result:', result);

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle artifact with nested content structure', async () => {
      const artifact = {
        identifier: 'nested-component',
        type: 'application/vnd.react',
        title: 'Nested Component',
        content: {
          code: `
import React from 'react';

const NestedComponent = () => {
  return <div>Nested Content</div>;
};

export default NestedComponent;
          `,
        },
      };

      const result = await validator.validate(artifact);

      console.log('Nested component validation result:', result);

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('extractCode', () => {
    test('should extract code from artifact.content string', () => {
      const artifact = {
        content: 'const test = "hello";',
      };

      const code = validator.extractCode(artifact);
      expect(code).toBe('const test = "hello";');
    });

    test('should extract code from artifact.code', () => {
      const artifact = {
        code: 'const test = "hello";',
      };

      const code = validator.extractCode(artifact);
      expect(code).toBe('const test = "hello";');
    });

    test('should extract code from nested content structure', () => {
      const artifact = {
        content: {
          code: 'const test = "hello";',
        },
      };

      const code = validator.extractCode(artifact);
      expect(code).toBe('const test = "hello";');
    });

    test('should return null when no code is found', () => {
      const artifact = {
        content: {},
      };

      const code = validator.extractCode(artifact);
      expect(code).toBeNull();
    });
  });

  describe('getStats', () => {
    test('should return validation statistics', () => {
      const stats = validator.getStats();

      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('validationsAttempted');
      expect(stats).toHaveProperty('validationsSucceeded');
      expect(stats).toHaveProperty('validationsFailed');
      expect(stats).toHaveProperty('averageValidationTime');
      expect(typeof stats.validationsAttempted).toBe('number');
      expect(typeof stats.validationsSucceeded).toBe('number');
      expect(typeof stats.validationsFailed).toBe('number');
      expect(typeof stats.averageValidationTime).toBe('number');
    });
  });

  describe('resetStats', () => {
    test('should reset validation statistics', () => {
      // Perform some validation to change stats
      validator.resetStats();

      const stats = validator.getStats();
      expect(stats.validationsAttempted).toBe(0);
      expect(stats.validationsSucceeded).toBe(0);
      expect(stats.validationsFailed).toBe(0);
      expect(stats.averageValidationTime).toBe(0);
    });
  });
});

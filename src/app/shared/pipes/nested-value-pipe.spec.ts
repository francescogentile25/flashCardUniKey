import { NestedValuePipe } from './nested-value-pipe';

describe('NestedValuePipe', () => {
  let pipe: NestedValuePipe;

  beforeEach(() => {
    pipe = new NestedValuePipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should get simple property value', () => {
      const obj = { name: 'John' };

      const result = pipe.transform(obj, 'name');

      expect(result).toBe('John');
    });

    it('should get nested property value', () => {
      const obj = {
        user: {
          profile: {
            name: 'Jane'
          }
        }
      };

      const result = pipe.transform(obj, 'user.profile.name');

      expect(result).toBe('Jane');
    });

    it('should return undefined for non-existent property', () => {
      const obj = { name: 'John' };

      const result = pipe.transform(obj, 'age');

      expect(result).toBeUndefined();
    });

    it('should return undefined for non-existent nested property', () => {
      const obj = {
        user: {
          name: 'Jane'
        }
      };

      const result = pipe.transform(obj, 'user.profile.name');

      expect(result).toBeUndefined();
    });

    it('should handle null object', () => {
      const result = pipe.transform(null, 'name');

      expect(result).toBeUndefined();
    });

    it('should handle undefined object', () => {
      const result = pipe.transform(undefined, 'name');

      expect(result).toBeUndefined();
    });

    it('should handle empty path', () => {
      const obj = { name: 'John' };

      const result = pipe.transform(obj, '');

      expect(result).toEqual(obj);
    });

    it('should get array element', () => {
      const obj = {
        items: [
          { id: 1, name: 'First' },
          { id: 2, name: 'Second' }
        ]
      };

      const result = pipe.transform(obj, 'items.0.name');

      expect(result).toBe('First');
    });

    it('should get deeply nested array element', () => {
      const obj = {
        users: [
          {
            addresses: [
              { city: 'New York' },
              { city: 'Los Angeles' }
            ]
          }
        ]
      };

      const result = pipe.transform(obj, 'users.0.addresses.1.city');

      expect(result).toBe('Los Angeles');
    });

    it('should handle numeric values', () => {
      const obj = { count: 42 };

      const result = pipe.transform(obj, 'count');

      expect(result).toBe(42);
    });

    it('should handle boolean values', () => {
      const obj = { isActive: true };

      const result = pipe.transform(obj, 'isActive');

      expect(result).toBe(true);
    });

    it('should handle zero value', () => {
      const obj = { count: 0 };

      const result = pipe.transform(obj, 'count');

      expect(result).toBe(0);
    });

    it('should handle false value', () => {
      const obj = { isActive: false };

      const result = pipe.transform(obj, 'isActive');

      expect(result).toBe(false);
    });

    it('should handle empty string value', () => {
      const obj = { name: '' };

      const result = pipe.transform(obj, 'name');

      expect(result).toBe('');
    });

    it('should handle null value in property', () => {
      const obj = { name: null };

      const result = pipe.transform(obj, 'name');

      expect(result).toBeNull();
    });

    it('should handle complex nested structures', () => {
      const obj = {
        company: {
          departments: {
            engineering: {
              teams: {
                frontend: {
                  members: [
                    { name: 'Alice', role: 'Developer' }
                  ]
                }
              }
            }
          }
        }
      };

      const result = pipe.transform(obj, 'company.departments.engineering.teams.frontend.members.0.name');

      expect(result).toBe('Alice');
    });

    it('should handle object with numeric keys', () => {
      const obj = {
        data: {
          '123': {
            value: 'test'
          }
        }
      };

      const result = pipe.transform(obj, 'data.123.value');

      expect(result).toBe('test');
    });

    it('should return undefined when path partially exists', () => {
      const obj = {
        user: {
          name: 'John'
        }
      };

      const result = pipe.transform(obj, 'user.profile.email.address');

      expect(result).toBeUndefined();
    });
  });
});

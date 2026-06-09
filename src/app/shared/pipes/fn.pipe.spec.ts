import { FnPipe } from './fn.pipe';

describe('FnPipe', () => {
  let pipe: FnPipe;

  beforeEach(() => {
    pipe = new FnPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should apply function to data and return result', () => {
      const data = { name: 'John', age: 30 };
      const func = (entity: any) => entity.name;

      const result = pipe.transform(data, func);

      expect(result).toBe('John');
    });

    it('should work with number transformations', () => {
      const data = { price: 100 };
      const func = (entity: any) => entity.price * 1.2;

      const result = pipe.transform(data, func);

      expect(result).toBe(120);
    });

    it('should work with string transformations', () => {
      const data = { firstName: 'John', lastName: 'Doe' };
      const func = (entity: any) => `${entity.firstName} ${entity.lastName}`;

      const result = pipe.transform(data, func);

      expect(result).toBe('John Doe');
    });

    it('should work with boolean transformations', () => {
      const data = { isActive: true };
      const func = (entity: any) => !entity.isActive;

      const result = pipe.transform(data, func);

      expect(result).toBe(false);
    });

    it('should work with object transformations', () => {
      const data = { x: 10, y: 20 };
      const func = (entity: any) => ({ sum: entity.x + entity.y });

      const result = pipe.transform(data, func);

      expect(result).toEqual({ sum: 30 });
    });

    it('should work with array transformations', () => {
      const data = [1, 2, 3, 4, 5];
      const func = (entity: any) => entity.filter((n: number) => n > 2);

      const result = pipe.transform(data, func);

      expect(result).toEqual([3, 4, 5]);
    });

    it('should handle null data', () => {
      const func = (entity: any) => entity ? 'not null' : 'null';

      const result = pipe.transform(null, func);

      expect(result).toBe('null');
    });

    it('should handle undefined data', () => {
      const func = (entity: any) => entity ? 'defined' : 'undefined';

      const result = pipe.transform(undefined, func);

      expect(result).toBe('undefined');
    });

    it('should work with complex nested data', () => {
      const data = {
        user: {
          profile: {
            name: 'Jane',
            age: 25
          }
        }
      };
      const func = (entity: any) => entity.user.profile.name;

      const result = pipe.transform(data, func);

      expect(result).toBe('Jane');
    });

    it('should preserve type safety', () => {
      interface User {
        id: number;
        name: string;
      }

      const data: User = { id: 1, name: 'Alice' };
      const func = (user: User): string => user.name.toUpperCase();

      const result = pipe.transform(data, func);

      expect(result).toBe('ALICE');
    });
  });
});

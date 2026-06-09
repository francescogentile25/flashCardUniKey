import { ResolveStringOrFnPipe } from './resolve-string-or-fn-pipe';

describe('ResolveStringOrFnPipe', () => {
  let pipe: ResolveStringOrFnPipe<any>;

  beforeEach(() => {
    pipe = new ResolveStringOrFnPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  describe('transform', () => {
    it('should return empty string for undefined property', () => {
      const result = pipe.transform(undefined);

      expect(result).toBe('');
    });

    it('should return empty string for null property', () => {
      const result = pipe.transform(null as any);

      expect(result).toBe('');
    });

    it('should return the string when property is a string', () => {
      const result = pipe.transform('Hello World');

      expect(result).toBe('Hello World');
    });

    it('should return empty string when property is empty string', () => {
      const result = pipe.transform('');

      expect(result).toBe('');
    });

    it('should call function and return its result when property is a function', () => {
      const data = { name: 'John' };
      const func = (d: any) => `Hello ${d.name}`;

      const result = pipe.transform(func, data);

      expect(result).toBe('Hello John');
    });

    it('should handle function returning empty string', () => {
      const func = () => '';

      const result = pipe.transform(func);

      expect(result).toBe('');
    });

    it('should handle function returning null', () => {
      const func = () => null as any;

      const result = pipe.transform(func);

      expect(result).toBe('');
    });

    it('should handle function returning undefined', () => {
      const func = () => undefined as any;

      const result = pipe.transform(func);

      expect(result).toBe('');
    });

    it('should pass undefined data to function', () => {
      const func = (d: any) => d ? 'has data' : 'no data';

      const result = pipe.transform(func, undefined);

      expect(result).toBe('no data');
    });

    it('should work with complex data objects', () => {
      const data = {
        user: {
          firstName: 'Jane',
          lastName: 'Doe'
        }
      };
      const func = (d: any) => `${d.user.firstName} ${d.user.lastName}`;

      const result = pipe.transform(func, data);

      expect(result).toBe('Jane Doe');
    });

    it('should work with typed data', () => {
      interface User {
        id: number;
        name: string;
      }

      const data: User = { id: 1, name: 'Alice' };
      const func = (user: User | undefined) => user ? user.name.toUpperCase() : 'NO USER';

      const result = pipe.transform(func, data);

      expect(result).toBe('ALICE');
    });

    it('should handle multiline strings', () => {
      const multiline = `Line 1
Line 2
Line 3`;

      const result = pipe.transform(multiline);

      expect(result).toBe(multiline);
    });

    it('should handle special characters in strings', () => {
      const special = '<div>HTML & "quotes" and \'apostrophes\'</div>';

      const result = pipe.transform(special);

      expect(result).toBe(special);
    });

    it('should handle function with conditional logic', () => {
      const data = { isActive: true };
      const func = (d: any) => d && d.isActive ? 'Active' : 'Inactive';

      const result = pipe.transform(func, data);

      expect(result).toBe('Active');
    });

    it('should handle function with number formatting', () => {
      const data = { price: 1234.56 };
      const func = (d: any) => `€ ${d.price.toFixed(2)}`;

      const result = pipe.transform(func, data);

      expect(result).toBe('€ 1234.56');
    });
  });
});

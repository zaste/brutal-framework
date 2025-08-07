import { describe, test, expect } from '@jest/globals';
import { c as createStore, h as shallow, l as createSelector, p as persist } from '../src/minimal';

describe('@brutal/state - Integration', () => {
  describe('real-world scenarios', () => {
    test('todo app state management', () => {
      interface Todo {
        id: number;
        text: string;
        completed: boolean;
      }
      
      interface TodoState {
        todos: Todo[];
        filter: 'all' | 'active' | 'completed';
        nextId: number;
      }
      
      const store = createStore<TodoState>({
        todos: [],
        filter: 'all',
        nextId: 1
      });
      
      // Add todo action
      const addTodo = (text: string) => {
        store.s(state => ({
          todos: [...state.todos, { id: state.nextId, text, completed: false }],
          nextId: state.nextId + 1
        }));
      };
      
      // Toggle todo action
      const toggleTodo = (id: number) => {
        store.s(state => ({
          todos: state.todos.map(todo =>
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
          )
        }));
      };
      
      // Filtered todos selector
      const getFilteredTodos = createSelector((state: TodoState) => {
        switch (state.filter) {
          case 'active':
            return state.todos.filter(t => !t.completed);
          case 'completed':
            return state.todos.filter(t => t.completed);
          default:
            return state.todos;
        }
      });
      
      // Add some todos
      addTodo('Learn BRUTAL');
      addTodo('Build an app');
      addTodo('Deploy to production');
      
      expect(store.todos).toHaveLength(3);
      expect(getFilteredTodos(store.g())).toHaveLength(3);
      
      // Complete a todo
      toggleTodo(1);
      expect(store.todos[0].completed).toBe(true);
      
      // Filter active todos
      store.filter = 'active';
      expect(getFilteredTodos(store.g())).toHaveLength(2);
      
      // Filter completed todos
      store.filter = 'completed';
      expect(getFilteredTodos(store.g())).toHaveLength(1);
    });

    test('shopping cart with computed values', () => {
      interface CartItem {
        id: string;
        name: string;
        price: number;
        quantity: number;
      }
      
      interface CartState {
        items: CartItem[];
        taxRate: number;
        discount: number;
      }
      
      const store = createStore<CartState>({
        items: [],
        taxRate: 0.08,
        discount: 0
      });
      
      // Computed selectors
      const getSubtotal = createSelector((state: CartState) =>
        state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      );
      
      const getTax = createSelector((state: CartState) => {
        const subtotal = getSubtotal(state);
        return subtotal * state.taxRate;
      });
      
      const getTotal = createSelector((state: CartState) => {
        const subtotal = getSubtotal(state);
        const tax = getTax(state);
        return subtotal + tax - state.discount;
      });
      
      // Cart actions
      const addItem = (item: Omit<CartItem, 'quantity'>) => {
        store.s(state => {
          const existing = state.items.find(i => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map(i =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              )
            };
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }]
          };
        });
      };
      
      const removeItem = (id: string) => {
        store.s(state => ({
          items: state.items.filter(item => item.id !== id)
        }));
      };
      
      const updateQuantity = (id: string, quantity: number) => {
        store.s(state => ({
          items: state.items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        }));
      };
      
      // Test cart operations
      addItem({ id: '1', name: 'Widget', price: 10 });
      addItem({ id: '2', name: 'Gadget', price: 20 });
      addItem({ id: '1', name: 'Widget', price: 10 }); // Add same item
      
      expect(store.items).toHaveLength(2);
      expect(store.items[0].quantity).toBe(2);
      
      expect(getSubtotal(store.g())).toBe(40); // 2*10 + 1*20
      expect(getTax(store.g())).toBeCloseTo(3.2); // 40 * 0.08
      expect(getTotal(store.g())).toBeCloseTo(43.2);
      
      // Apply discount
      store.discount = 5;
      expect(getTotal(store.g())).toBeCloseTo(38.2);
      
      // Update quantity
      updateQuantity('2', 3);
      expect(getSubtotal(store.g())).toBe(80); // 2*10 + 3*20
      
      // Remove item
      removeItem('1');
      expect(store.items).toHaveLength(1);
      expect(getTotal(store.g())).toBeCloseTo(59.8); // 60 + 4.8 - 5
    });

    test('form state with validation', () => {
      interface FormState {
        values: Record<string, any>;
        errors: Record<string, string>;
        touched: Record<string, boolean>;
        isSubmitting: boolean;
      }
      
      const store = createStore<FormState>({
        values: {
          email: '',
          password: '',
          confirmPassword: ''
        },
        errors: {},
        touched: {},
        isSubmitting: false
      });
      
      // Form helpers
      const setValue = (field: string, value: any) => {
        store.s(state => ({
          values: { ...state.values, [field]: value },
          errors: { ...state.errors, [field]: '' } // Clear error on change
        }));
      };
      
      const setError = (field: string, error: string) => {
        store.s(state => ({
          errors: { ...state.errors, [field]: error }
        }));
      };
      
      const setTouched = (field: string) => {
        store.s(state => ({
          touched: { ...state.touched, [field]: true }
        }));
      };
      
      const validate = () => {
        const errors: Record<string, string> = {};
        const { email, password, confirmPassword } = store.values;
        
        if (!email) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          errors.email = 'Invalid email address';
        }
        
        if (!password) {
          errors.password = 'Password is required';
        } else if (password.length < 8) {
          errors.password = 'Password must be at least 8 characters';
        }
        
        if (password !== confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
        
        store.errors = errors;
        return Object.keys(errors).length === 0;
      };
      
      // Form is valid selector
      const isValid = createSelector((state: FormState) =>
        Object.keys(state.errors).length === 0 &&
        Object.values(state.values).every(v => v !== '')
      );
      
      // Test form flow
      setValue('email', 'test');
      setTouched('email');
      validate();
      expect(store.errors.email).toBe('Invalid email address');
      
      setValue('email', 'test@example.com');
      validate();
      expect(store.errors.email).toBeUndefined();
      
      setValue('password', '12345');
      validate();
      expect(store.errors.password).toBe('Password must be at least 8 characters');
      
      setValue('password', '12345678');
      setValue('confirmPassword', '12345679');
      validate();
      expect(store.errors.confirmPassword).toBe('Passwords do not match');
      
      setValue('confirmPassword', '12345678');
      validate();
      expect(isValid(store.g())).toBe(true);
      
      // Submit form
      store.isSubmitting = true;
      expect(store.isSubmitting).toBe(true);
    });
  });

  describe('performance scenarios', () => {
    test('handles large state updates efficiently', () => {
      const store = createStore({
        items: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: i }))
      });
      
      const start = performance.now();
      
      // Update many items
      for (let i = 0; i < 100; i++) {
        store.s(state => ({
          items: state.items.map(item =>
            item.id === i ? { ...item, value: item.value * 2 } : item
          )
        }));
      }
      
      const end = performance.now();
      
      // Should complete quickly (< 100ms for 100 updates)
      expect(end - start).toBeLessThan(100);
      
      // Verify updates
      expect(store.items[0].value).toBe(0); // 0 * 2 = 0
      expect(store.items[50].value).toBe(100); // 50 * 2 = 100
      expect(store.items[99].value).toBe(198); // 99 * 2 = 198
      expect(store.items[100].value).toBe(100); // Not updated
    });

    test('memoized selectors prevent unnecessary computations', () => {
      const store = createStore({
        data: Array.from({ length: 1000 }, (_, i) => i),
        filter: 0
      });
      
      let computeCount = 0;
      const expensiveSelector = createSelector((state: any) => {
        computeCount++;
        return state.data.filter((n: number) => n % 2 === 0).length;
      });
      
      // First computation
      const result1 = expensiveSelector(store.g());
      expect(result1).toBe(500);
      expect(computeCount).toBe(1);
      
      // Update unrelated property
      store.filter = 1;
      const result2 = expensiveSelector(store.g());
      expect(result2).toBe(500);
      expect(computeCount).toBe(1); // No recomputation
      
      // Update related property
      store.data = [...store.data, 1001];
      const result3 = expensiveSelector(store.g());
      expect(result3).toBe(500); // 1001 is odd
      expect(computeCount).toBe(2);
    });
  });
});
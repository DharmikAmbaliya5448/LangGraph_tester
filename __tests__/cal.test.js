
import { add, subtract } from '../cal';

describe('Add function', () => {
  test('should return correct sum for positive numbers', () => {
    expect(add(1, 2)).toBe(3);
    expect(add(-1, -2)).toBe(-3);
    expect(add(0.5, 0.5)).toBe(1);
    expect(add(-0.5, -0.5)).toBe(-1);
  });

  test('should return correct sum for negative numbers', () => {
    expect(add(-1, 2)).toBe(1);
    expect(add(1, -2)).toBe(-1);
    expect(add(-0.5, 2)).toBe(1.5);
    expect(add(0.5, -2)).toBe(-1.5);
  });

  test('should return correct sum for positive and negative numbers', () => {
    expect(add(1, -2)).toBe(-1);
    expect(add(-1, 2)).toBe(1);
    expect(add(0.5, -2)).toBe(-1.5);
    expect(add(-0.5, 2)).toBe(1.5);
  });
});

describe('Subtract function', () => {
  test('should return correct difference for positive numbers', () => {
    expect(subtract(3, 2)).toBe(1);
    expect(subtract(2, 3)).toBe(-1);
    expect(subtract(0.5, 0.5)).toBe(0);
    expect(subtract(-0.5, -0.5)).toBe(0);
  });

  test('should return correct difference for negative numbers', () => {
    expect(subtract(-3, 2)).toBe(-1);
    expect(subtract(2, -3)).toBe(1);
    expect(subtract(-0.5, 0.5)).toBe(-1);
    expect(subtract(0.5, -0.5)).toBe(1);
  });

  test('should return correct difference for positive and negative numbers', () => {
    expect(subtract(3, -2)).toBe(5);
    expect(subtract(-3, 2)).toBe(-1);
    expect(subtract(0.5, -0.5)).toBe(1);
    expect(subtract(-0.5, 0.5)).toBe(-1);
  });
});

describe('Add and subtract functions', () => {
  test('should return correct result for positive numbers', () => {
    expect(add(3, 2)).toBe(5);
    expect(subtract(3, 2)).toBe(1);
  });

  test('should return correct result for negative numbers', () => {
    expect(add(-3, -2)).toBe(-5);
    expect(subtract(-3, -2)).toBe(1);
  });

  test('should return correct result for positive and negative numbers', () => {
    expect(add(3, -2)).toBe(1);
    expect(subtract(3, -2)).toBe(5);
    expect(add(-3, 2)).toBe(-1);
    expect(subtract(-3, 2)).toBe(-5);
  });
});
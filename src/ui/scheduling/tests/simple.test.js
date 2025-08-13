// Simple JavaScript test to verify Jest works
describe('Simple Test', () => {
  test('should pass basic test', () => {
    expect(2 + 2).toBe(4);
  });

  test('should handle arrays', () => {
    const arr = [1, 2, 3];
    expect(arr.length).toBe(3);
  });
});

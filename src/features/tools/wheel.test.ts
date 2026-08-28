import { describe, expect, it } from 'vitest';
import { addTask, removeTask, spin } from './wheel';

describe('task wheel', () => {
  it('adds and removes local tasks', () => {
    const state = addTask({ tasks: [] }, 'رياضيات');
    expect(state.tasks).toEqual(['رياضيات']);
    expect(removeTask(state, 0).tasks).toEqual([]);
  });
  it('selects deterministically with injected randomness', () => expect(spin(['a', 'b'], () => 0.99)).toBe('b'));
});

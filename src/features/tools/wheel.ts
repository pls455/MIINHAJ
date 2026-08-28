export interface TaskWheelState { tasks: string[]; selected?: string; }

export function addTask(state: TaskWheelState, task: string): TaskWheelState {
  const value = task.trim();
  return value ? { ...state, tasks: [...state.tasks, value] } : state;
}

export function removeTask(state: TaskWheelState, index: number): TaskWheelState {
  return { ...state, tasks: state.tasks.filter((_, i) => i !== index), selected: undefined };
}

export function spin(tasks: readonly string[], random = Math.random): string | null {
  if (!tasks.length) return null;
  return tasks[Math.floor(random() * tasks.length)];
}

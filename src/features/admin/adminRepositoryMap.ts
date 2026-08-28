import { branches, categories, contributors, flashcards, foundations, problemReports, resources, solutions, subjects, suggestions, templates } from '../../repositories';
import type { AdminRepository } from './types';

const adapt = <T extends { list: Function; create: Function; update: Function; remove: Function }>(repository: T): AdminRepository => ({
  list: (options) => repository.list(options),
  create: (data) => repository.create(data),
  update: (id, data) => repository.update(id, data),
  remove: (id) => repository.remove(id),
});

export const adminRepositories: Record<string, AdminRepository> = {
  branches: adapt(branches), subjects: adapt(subjects), categories: adapt(categories), resources: adapt(resources),
  foundations: adapt(foundations), flashcards: adapt(flashcards), solutions: adapt(solutions), suggestions: adapt(suggestions),
  problemReports: adapt(problemReports), contributors: adapt(contributors), templates: adapt(templates),
};

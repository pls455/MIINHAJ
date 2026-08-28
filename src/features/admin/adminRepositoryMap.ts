import type { BaseDocument, ListOptions, Page } from '../../types';
import { branches, categories, contributors, flashcards, foundations, problemReports, resources, solutions, subjects, suggestions, templates } from '../../repositories';
import type { AdminRepository } from './types';

type RepositoryLike = {
  list: (options?: ListOptions) => Promise<Page<BaseDocument>>;
  create: (data: Record<string, unknown>) => Promise<string>;
  update: (id: string, data: Record<string, unknown>) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const adapt = (repository: RepositoryLike): AdminRepository => ({
  list: (options) => repository.list(options),
  create: (data) => repository.create(data),
  update: (id, data) => repository.update(id, data),
  remove: (id) => repository.remove(id),
});

export const adminRepositories: Record<string, AdminRepository> = {
  branches: adapt(branches),
  subjects: adapt(subjects),
  categories: adapt(categories),
  resources: adapt(resources),
  foundations: adapt(foundations),
  flashcards: adapt(flashcards),
  solutions: adapt(solutions),
  suggestions: adapt(suggestions),
  problemReports: adapt(problemReports),
  contributors: adapt(contributors),
  templates: adapt(templates),
};

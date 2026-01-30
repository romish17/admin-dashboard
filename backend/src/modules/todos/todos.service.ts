import { TodoStatus } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../middleware/errorHandler.js';
import { PaginationParams, paginatedResponse, getPrismaSkipTake } from '../../utils/pagination.js';
import {
  CreateProjectInput, UpdateProjectInput,
  CreateTodoInput, UpdateTodoInput, TodoQueryInput, BulkUpdateTodosInput,
} from './todos.schema.js';

class TodosService {
  // Projects
  async findAllProjects(userId: string) {
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { todos: true } },
      },
    });

    // Get todo counts by status for each project
    const projectsWithStats = await Promise.all(
      projects.map(async (project) => {
        const stats = await prisma.todo.groupBy({
          by: ['status'],
          where: { projectId: project.id },
          _count: true,
        });
        return {
          ...project,
          stats: stats.reduce<Record<string, number>>((acc, s) => ({ ...acc, [s.status]: s._count }), {}),
        };
      })
    );

    return projectsWithStats;
  }

  async findProjectById(id: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        todos: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!project) throw new NotFoundError('Project', id);
    return project;
  }

  async createProject(userId: string, data: CreateProjectInput) {
    return prisma.project.create({ data: { ...data, userId } });
  }

  async updateProject(id: string, userId: string, data: UpdateProjectInput) {
    await this.findProjectById(id, userId);
    return prisma.project.update({ where: { id }, data });
  }

  async deleteProject(id: string, userId: string) {
    await this.findProjectById(id, userId);
    await prisma.project.delete({ where: { id } });
    return { success: true };
  }

  // Todos
  async findAllTodos(userId: string, query: TodoQueryInput, pagination: PaginationParams) {
    const where: Record<string, unknown> = { userId, parentId: null };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.projectId) where.projectId = query.projectId;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isPinned !== undefined) where.isPinned = query.isPinned;
    if (query.isFavorite !== undefined) where.isFavorite = query.isFavorite;
    if (!query.showCompleted) {
      where.status = { not: TodoStatus.DONE };
    }

    const [todos, total] = await Promise.all([
      prisma.todo.findMany({
        where,
        ...getPrismaSkipTake(pagination),
        orderBy: [
          { isPinned: 'desc' },
          { priority: 'desc' },
          { [pagination.sortBy || 'createdAt']: pagination.sortOrder },
        ],
        include: {
          project: { select: { id: true, name: true, color: true } },
          category: { select: { id: true, name: true, color: true } },
          tags: { include: { tag: { select: { id: true, name: true, color: true } } } },
          subtasks: { orderBy: { createdAt: 'asc' } },
        },
      }),
      prisma.todo.count({ where }),
    ]);

    return paginatedResponse(
      todos.map((t) => ({ ...t, tags: t.tags.map((tag) => tag.tag) })),
      total,
      pagination
    );
  }

  async findTodoById(id: string, userId: string) {
    const todo = await prisma.todo.findFirst({
      where: { id, userId },
      include: {
        project: true,
        category: true,
        tags: { include: { tag: true } },
        subtasks: { orderBy: { createdAt: 'asc' } },
        parent: { select: { id: true, title: true } },
      },
    });
    if (!todo) throw new NotFoundError('Todo', id);
    return { ...todo, tags: todo.tags.map((t) => t.tag) };
  }

  async createTodo(userId: string, data: CreateTodoInput) {
    const { tagIds, dueDate, ...todoData } = data;

    const todo = await prisma.todo.create({
      data: {
        ...todoData,
        dueDate: dueDate ? new Date(dueDate) : null,
        userId,
        tags: tagIds?.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: {
        project: { select: { id: true, name: true, color: true } },
        category: { select: { id: true, name: true, color: true } },
        tags: { include: { tag: true } },
      },
    });

    return { ...todo, tags: todo.tags.map((t) => t.tag) };
  }

  async updateTodo(id: string, userId: string, data: UpdateTodoInput) {
    await this.findTodoById(id, userId);
    const { tagIds, dueDate, ...todoData } = data;

    const updateData: Record<string, unknown> = { ...todoData };
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    // Handle completion timestamp
    if (data.status === TodoStatus.DONE) {
      updateData.completedAt = new Date();
    } else if (data.status) {
      updateData.completedAt = null;
    }

    const todo = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        await tx.todoTag.deleteMany({ where: { todoId: id } });
        if (tagIds.length > 0) {
          await tx.todoTag.createMany({
            data: tagIds.map((tagId) => ({ todoId: id, tagId })),
          });
        }
      }

      return tx.todo.update({
        where: { id },
        data: updateData,
        include: {
          project: { select: { id: true, name: true, color: true } },
          category: { select: { id: true, name: true, color: true } },
          tags: { include: { tag: true } },
        },
      });
    });

    return { ...todo, tags: todo.tags.map((t) => t.tag) };
  }

  async deleteTodo(id: string, userId: string) {
    await this.findTodoById(id, userId);
    await prisma.todo.delete({ where: { id } });
    return { success: true };
  }

  async toggleTodoStatus(id: string, userId: string) {
    const todo = await this.findTodoById(id, userId);
    const newStatus = todo.status === TodoStatus.DONE ? TodoStatus.TODO : TodoStatus.DONE;

    return this.updateTodo(id, userId, { status: newStatus });
  }

  async toggleFavorite(id: string, userId: string) {
    const todo = await this.findTodoById(id, userId);
    const updated = await prisma.todo.update({
      where: { id },
      data: { isFavorite: !todo.isFavorite },
    });
    return { isFavorite: updated.isFavorite };
  }

  async togglePinned(id: string, userId: string) {
    const todo = await this.findTodoById(id, userId);
    const updated = await prisma.todo.update({
      where: { id },
      data: { isPinned: !todo.isPinned },
    });
    return { isPinned: updated.isPinned };
  }

  async bulkUpdate(userId: string, data: BulkUpdateTodosInput) {
    const { ids, ...updateData } = data;

    await prisma.todo.updateMany({
      where: { id: { in: ids }, userId },
      data: updateData as Record<string, unknown>,
    });

    return { success: true, updated: ids.length };
  }

  // Get pinned/favorite todos for dashboard
  async getDashboardTodos(userId: string) {
    const todos = await prisma.todo.findMany({
      where: {
        userId,
        OR: [{ isPinned: true }, { isFavorite: true }],
        status: { not: TodoStatus.DONE },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
      take: 10,
      include: {
        project: { select: { id: true, name: true, color: true } },
      },
    });

    return todos;
  }

  async search(userId: string, query: string, limit = 10) {
    const todos = await prisma.todo.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        project: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } },
      },
    });

    return todos.map((todo) => ({
      id: todo.id,
      type: 'todo' as const,
      title: todo.title,
      description: todo.description,
      tags: todo.tags.map((t) => t.tag.name),
      categories: todo.project ? [todo.project.name] : [],
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    }));
  }
}

export const todosService = new TodosService();

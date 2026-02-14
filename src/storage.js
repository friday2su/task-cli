const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

class TaskStorage {
  constructor() {
    this.dataDir = path.join(os.homedir(), '.task-cli');
    this.tasksFile = path.join(this.dataDir, 'tasks.json');
    this.backupFile = path.join(this.dataDir, 'tasks.backup.json');
    this.init();
  }

  init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.tasksFile)) {
      this.save([]);
    }
  }

  load() {
    try {
      const data = fs.readFileSync(this.tasksFile, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  save(tasks) {
    const backupExists = fs.existsSync(this.tasksFile);
    if (backupExists) {
      fs.copyFileSync(this.tasksFile, this.backupFile);
    }
    fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2));
  }

  getAll() {
    return this.load();
  }

  getById(id) {
    const tasks = this.load();
    return tasks.find(t => t.id === id);
  }

  add(taskData) {
    const tasks = this.load();
    const task = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'medium',
      category: taskData.category || 'General',
      dueDate: taskData.dueDate || null,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
      tags: taskData.tags || []
    };
    tasks.push(task);
    this.save(tasks);
    return task;
  }

  update(id, updates) {
    const tasks = this.load();
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates };
      this.save(tasks);
      return tasks[index];
    }
    return null;
  }

  delete(id) {
    const tasks = this.load();
    const filtered = tasks.filter(t => t.id !== id);
    this.save(filtered);
    return filtered.length < tasks.length;
  }

  toggleComplete(id) {
    const tasks = this.load();
    const task = tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      this.save(tasks);
      return task;
    }
    return null;
  }

  clearCompleted() {
    const tasks = this.load();
    const pending = tasks.filter(t => !t.completed);
    this.save(pending);
    return tasks.length - pending.length;
  }

  search(query) {
    const tasks = this.load();
    const lowerQuery = query.toLowerCase();
    return tasks.filter(t =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.category.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  filter(criteria) {
    let tasks = this.load();

    if (criteria.status === 'pending') {
      tasks = tasks.filter(t => !t.completed);
    } else if (criteria.status === 'completed') {
      tasks = tasks.filter(t => t.completed);
    }

    if (criteria.priority) {
      tasks = tasks.filter(t => t.priority === criteria.priority);
    }

    if (criteria.category) {
      tasks = tasks.filter(t => t.category.toLowerCase() === criteria.category.toLowerCase());
    }

    return tasks;
  }

  sort(tasks, sortBy, reverse = false) {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    
    const sorted = [...tasks].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'priority':
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'due':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate) - new Date(b.dueDate);
          break;
        case 'date':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        default:
          comparison = 0;
      }
      
      return comparison;
    });

    return reverse ? sorted.reverse() : sorted;
  }

  getStats() {
    const tasks = this.load();
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    
    const byPriority = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };

    const categories = {};
    tasks.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + 1;
    });

    return {
      total,
      completed,
      pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      byPriority,
      categories
    };
  }
}

module.exports = new TaskStorage();

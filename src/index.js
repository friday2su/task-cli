#!/usr/bin/env node

const readline = require('readline');
const keypress = require('keypress');
const chalk = require('chalk');
const storage = require('./storage');
const ui = require('./ui');

const PRIORITIES = ['urgent', 'high', 'medium', 'low'];

function clear() {
  console.clear();
}

function isInteractive() {
  return process.stdin.isTTY === true;
}

async function ask(text) {
  return new Promise(resolve => {
    const r = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    r.question(text, ans => {
      r.close();
      resolve(ans);
    });
  });
}

function resetStdin() {
  try {
    process.stdin.setRawMode(false);
  } catch (e) {}
  process.stdin.removeAllListeners('keypress');
}

async function showMenu(options, title) {
  if (!isInteractive()) {
    return { index: 0, ok: true };
  }

  let selected = 0;
  
  function draw() {
    console.clear();
    console.log(chalk.cyan('\n  ' + title + '\n'));
    options.forEach((opt, i) => {
      const marker = i === selected ? chalk.green('►') : ' ';
      const text = i === selected ? chalk.white(opt) : chalk.gray(opt);
      console.log(`  ${marker} ${text}`);
    });
    console.log(chalk.gray('\n  ↑↓ navigate  ↵ select  esc cancel'));
  }

  draw();

  return new Promise(resolve => {
    try {
      process.stdin.setRawMode(true);
    } catch (e) {}
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    keypress(process.stdin);
    
    function onKey(ch, key) {
      if (!key) return;
      
      if (key.name === 'up') {
        selected = Math.max(0, selected - 1);
        draw();
      } else if (key.name === 'down') {
        selected = Math.min(options.length - 1, selected + 1);
        draw();
      } else if (key.name === 'return') {
        resetStdin();
        resolve({ index: selected, ok: true });
      } else if (key.name === 'escape') {
        resetStdin();
        resolve({ index: selected, ok: false });
      }
    }
    
    process.stdin.on('keypress', onKey);
  });
}

async function multiSelect(options, title) {
  if (!isInteractive()) {
    return { indexes: [0], ok: true };
  }

  const selected = new Set();
  let current = 0;
  
  function draw() {
    console.clear();
    console.log(chalk.cyan('\n  ' + title + '\n'));
    options.forEach((opt, i) => {
      const check = selected.has(i) ? chalk.green('◉') : '○';
      const marker = i === current ? chalk.green('►') : ' ';
      const text = i === current ? chalk.white(opt) : chalk.gray(opt);
      console.log(`  ${marker} ${check} ${text}`);
    });
    const info = selected.size > 0 ? chalk.green(` (${selected.size} selected)`) : '';
    console.log(chalk.gray('\n  ↑↓ navigate  ⎵ toggle  ↵ confirm  esc cancel') + info);
  }

  draw();

  return new Promise(resolve => {
    try {
      process.stdin.setRawMode(true);
    } catch (e) {}
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    keypress(process.stdin);
    
    function onKey(ch, key) {
      if (!key) return;
      
      if (key.name === 'up') {
        current = Math.max(0, current - 1);
        draw();
      } else if (key.name === 'down') {
        current = Math.min(options.length - 1, current + 1);
        draw();
      } else if (ch === ' ') {
        if (selected.has(current)) selected.delete(current);
        else selected.add(current);
        draw();
      } else if (key.name === 'return') {
        const results = Array.from(selected);
        resetStdin();
        resolve({ indexes: results, ok: true });
      } else if (key.name === 'escape') {
        resetStdin();
        resolve({ indexes: [], ok: false });
      }
    }
    
    process.stdin.on('keypress', onKey);
  });
}

async function confirm(message, opts) {
  if (!isInteractive()) {
    return { index: 0, ok: true };
  }

  let selected = 0;
  
  function draw() {
    console.clear();
    console.log(chalk.cyan('\n  ' + message + '\n'));
    opts.forEach((opt, i) => {
      const marker = i === selected ? chalk.green('►') : ' ';
      const style = i === 0 ? (i === selected ? chalk.red.bold : chalk.red) : (i === selected ? chalk.white.bold : chalk.gray);
      console.log(`  ${marker} ${style(opt)}`);
    });
    console.log(chalk.gray('\n  ↑↓ navigate  ↵ confirm'));
  }

  draw();

  return new Promise(resolve => {
    try {
      process.stdin.setRawMode(true);
    } catch (e) {}
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    keypress(process.stdin);
    
    function onKey(ch, key) {
      if (!key) return;
      
      if (key.name === 'up') {
        selected = Math.max(0, selected - 1);
        draw();
      } else if (key.name === 'down') {
        selected = Math.min(opts.length - 1, selected + 1);
        draw();
      } else if (key.name === 'return') {
        resetStdin();
        resolve({ index: selected, ok: selected === 0 });
      }
    }
    
    process.stdin.on('keypress', onKey);
  });
}

async function waitForKey() {
  return new Promise(resolve => {
    try {
      process.stdin.setRawMode(true);
    } catch (e) {}
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    keypress(process.stdin);
    
    function onKey(ch, key) {
      process.stdin.removeListener('keypress', onKey);
      resetStdin();
      resolve();
    }
    process.stdin.on('keypress', onKey);
  });
}

async function main() {
  clear();
  await ui.welcome();
  await waitForKey();

  const menuItems = [
    { name: 'List Tasks', fn: listTasks },
    { name: 'Add Task', fn: addTask },
    { name: 'Complete Task', fn: completeTask },
    { name: 'Edit Task', fn: editTask },
    { name: 'Delete Task', fn: deleteTask },
    { name: 'Statistics', fn: showStats },
    { name: 'Search Tasks', fn: searchTasks },
    { name: 'Clear Completed', fn: clearCompleted },
    { name: 'Help', fn: showHelp },
    { name: 'Exit', fn: () => { clear(); console.log(chalk.green('\n  Goodbye!\n')); process.exit(0); } }
  ];

  const names = menuItems.map(m => m.name);

  while (true) {
    const result = await showMenu(names, 'Main Menu');
    if (!result.ok) continue;

    const item = menuItems[result.index];
    clear();
    await item.fn();

    if (item.name !== 'Exit') {
      resetStdin();
      await ask(chalk.gray('\n  Press Enter to continue...'));
    }
  }
}

async function listTasks() {
  const tasks = storage.getAll();
  if (!tasks.length) {
    console.log(chalk.yellow('\n  No tasks\n'));
    return;
  }

  const sorted = storage.sort(tasks, 'priority');
  const opts = sorted.map(t => {
    const st = t.completed ? chalk.green('✓') : chalk.yellow('○');
    return `${st} ${t.title.substring(0, 30)} | ${ui.PRIORITY_EMOJI[t.priority]} ${t.priority} | ${t.category}`;
  });

  const res = await multiSelect(opts, 'Tasks - Space to select, Enter to view');
  
  if (!res.ok || res.indexes.length === 0) return;
  
  clear();
  res.indexes.forEach(i => sorted[i] && ui.renderTaskDetail(sorted[i]));
}

async function addTask() {
  console.log(chalk.cyan('\n  ADD TASK\n'));

  const title = await ask(chalk.cyan('  Title: '));
  if (!title.trim()) {
    console.log(chalk.red('\n  Title required\n'));
    return;
  }

  const p = await showMenu(
    PRIORITIES.map(p => `${ui.PRIORITY_EMOJI[p]} ${p.charAt(0).toUpperCase() + p.slice(1)}`),
    'Priority'
  );
  const priority = p.ok ? PRIORITIES[p.index] : 'medium';

  const c = await showMenu(ui.CATEGORIES, 'Category');
  const category = c.ok ? ui.CATEGORIES[c.index] : 'General';

  const due = await ask(chalk.gray('  Due (YYYY-MM-DD): '));
  const desc = await ask(chalk.gray('  Description: '));

  const task = storage.add({
    title: title.trim(),
    priority,
    category,
    dueDate: due.trim() || null,
    description: desc.trim()
  });

  clear();
  console.log(chalk.green('\n  Created!\n'));
  ui.renderTaskDetail(task);
}

async function completeTask() {
  const tasks = storage.filter({ status: 'pending' });
  if (!tasks.length) {
    console.log(chalk.yellow('\n  No pending tasks\n'));
    return;
  }

  const opts = tasks.map(t => 
    `${ui.PRIORITY_EMOJI[t.priority]} ${t.title.substring(0, 35)} | ${t.category}`
  );

  const res = await multiSelect(opts, 'Complete - Space to select, Enter to complete');
  if (!res.ok || res.indexes.length === 0) return;

  res.indexes.forEach(i => tasks[i] && storage.toggleComplete(tasks[i].id));
  clear();
  console.log(chalk.green(`\n  ${res.indexes.length} completed\n`));
}

async function editTask() {
  const tasks = storage.getAll();
  if (!tasks.length) {
    console.log(chalk.yellow('\n  No tasks\n'));
    return;
  }

  const sorted = storage.sort(tasks, 'priority');
  const opts = sorted.map(t => 
    `${t.completed ? chalk.green('✓') : chalk.yellow('○')} ${t.title.substring(0, 28)} | ${ui.PRIORITY_EMOJI[t.priority]} ${t.priority}`
  );

  const res = await showMenu(opts, 'Edit');
  if (!res.ok || !sorted[res.index]) return;

  const task = sorted[res.index];
  clear();
  console.log(chalk.cyan('\n  EDIT TASK\n'));
  console.log(chalk.gray('  Current: ') + task.title + '\n');

  const title = await ask(chalk.cyan('  Title: ')) || task.title;
  
  const p = await showMenu(
    PRIORITIES.map(p => `${ui.PRIORITY_EMOJI[p]} ${p.charAt(0).toUpperCase() + p.slice(1)}`),
    'Priority'
  );
  const priority = p.ok ? PRIORITIES[p.index] : task.priority;

  const c = await showMenu(ui.CATEGORIES, 'Category');
  const category = c.ok ? ui.CATEGORIES[c.index] : task.category;

  const due = await ask(chalk.gray('  Due: ')) || task.dueDate;
  const desc = await ask(chalk.gray('  Description: ')) || task.description;

  storage.update(task.id, {
    title: title.trim() || task.title,
    priority,
    category,
    dueDate: due?.trim() || null,
    description: desc?.trim() || ''
  });

  clear();
  console.log(chalk.green('\n  Updated!\n'));
  ui.renderTaskDetail(storage.getById(task.id));
}

async function deleteTask() {
  const tasks = storage.getAll();
  if (!tasks.length) {
    console.log(chalk.yellow('\n  No tasks\n'));
    return;
  }

  const sorted = storage.sort(tasks, 'priority');
  const opts = sorted.map(t => 
    `${t.completed ? chalk.green('✓') : chalk.yellow('○')} ${t.title.substring(0, 28)} | ${ui.PRIORITY_EMOJI[t.priority]} ${t.priority}`
  );

  const res = await multiSelect(opts, 'Delete - Space to select, Enter to delete');
  if (!res.ok || res.indexes.length === 0) return;

  const confirmRes = await confirm(
    `Delete ${res.indexes.length} task(s)?`,
    ['Yes, Delete', 'Cancel']
  );

  if (!confirmRes.ok) return;

  res.indexes.forEach(i => sorted[i] && storage.delete(sorted[i].id));
  clear();
  console.log(chalk.green(`\n  ${res.indexes.length} deleted\n`));
}

async function showStats() {
  ui.renderStats();
}

async function searchTasks() {
  resetStdin();
  const q = await ask(chalk.cyan('  Search: '));
  if (!q.trim()) return;

  const results = storage.search(q);
  clear();
  if (!results.length) {
    console.log(chalk.yellow(`\n  No results for "${q}"\n`));
  } else {
    console.log(chalk.cyan(`\n  ${results.length} result(s)\n`));
    ui.renderTaskTable(results);
  }
}

async function clearCompleted() {
  const stats = storage.getStats();
  if (!stats.completed) {
    console.log(chalk.yellow('\n  No completed tasks\n'));
    return;
  }

  const confirmRes = await confirm(
    `Clear ${stats.completed} completed?`,
    ['Yes, Clear', 'Cancel']
  );

  if (!confirmRes.ok) return;

  storage.clearCompleted();
  clear();
  console.log(chalk.green('\n  Cleared\n'));
}

async function showHelp() {
  ui.renderHelp();
}

process.on('uncaughtException', () => { resetStdin(); process.exit(0); });
process.on('SIGINT', () => { resetStdin(); process.exit(0); });

main().catch(() => process.exit(0));

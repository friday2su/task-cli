const chalk = require('chalk');
const { format } = require('date-fns');

const COLORS = {
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e'
};

const PRIORITY_EMOJI = {
  urgent: '●',
  high: '●',
  medium: '●',
  low: '●'
};

function formatDueDate(dueDate) {
  if (!dueDate) return chalk.gray('-');
  return chalk.gray(dueDate);
}

function renderTaskTable(tasks) {
  if (tasks.length === 0) {
    console.log(chalk.yellow('\n  No tasks\n'));
    return;
  }

  console.log(chalk.cyan('\n  Tasks\n'));
  console.log(chalk.gray('  ' + '─'.repeat(60)));

  tasks.forEach((task, i) => {
    const status = task.completed ? chalk.green('✓') : '○';
    const priorityColor = chalk.hex(COLORS[task.priority]);
    const title = task.completed ? chalk.gray.strikethrough(task.title) : chalk.white(task.title);
    
    console.log(`  ${chalk.gray(i + 1 + '.')} ${status} ${title.substring(0, 35)}`);
    console.log(`      ${priorityColor(PRIORITY_EMOJI[task.priority])} ${task.priority}  ${chalk.gray('|')}  ${chalk.blue(task.category)}  ${chalk.gray('|')}  ${formatDueDate(task.dueDate)}`);
  });

  console.log(chalk.gray('  ' + '─'.repeat(60)) + '\n');
}

function renderTaskDetail(task) {
  const priorityColor = chalk.hex(COLORS[task.priority]);
  const status = task.completed ? chalk.green('Completed') : chalk.yellow('Pending');

  console.log(chalk.cyan('\n  Task Details\n'));
  console.log(chalk.gray('  ─').repeat(25) + '\n');
  
  console.log(`  ${chalk.bold('Title:')}    ${task.completed ? chalk.gray.strikethrough(task.title) : task.title}`);
  console.log(`  ${chalk.bold('Status:')}   ${status}`);
  console.log(`  ${chalk.bold('Priority:')} ${priorityColor(PRIORITY_EMOJI[task.priority] + ' ' + task.priority.toUpperCase())}`);
  console.log(`  ${chalk.bold('Category:')} ${chalk.blue(task.category)}`);
  console.log(`  ${chalk.bold('Due:')}      ${formatDueDate(task.dueDate)}`);
  if (task.description) console.log(`  ${chalk.bold('Desc:')}    ${chalk.gray(task.description)}`);
  console.log(chalk.gray('\n  ID: ') + chalk.gray(task.id.substring(0, 8)) + chalk.gray('  |  Created: ') + chalk.gray(format(new Date(task.createdAt), 'MMM d, HH:mm')));
  console.log(chalk.gray('  ' + '─'.repeat(25)) + '\n');
}

function renderStats() {
  const storage = require('./storage');
  const stats = storage.getStats();

  console.log(chalk.cyan('\n  Statistics\n'));
  console.log(chalk.gray('  ─').repeat(20) + '\n');
  
  console.log(`  ${chalk.bold('Total:')}     ${chalk.white(stats.total)}`);
  console.log(`  ${chalk.green('Completed:')} ${chalk.green(stats.completed)}`);
  console.log(`  ${chalk.yellow('Pending:')}   ${chalk.yellow(stats.pending)}`);
  
  const rate = stats.completionRate;
  const rateColor = rate >= 70 ? chalk.green : rate >= 40 ? chalk.yellow : chalk.red;
  console.log(`  ${chalk.bold('Rate:')}     ${rateColor(rate + '%')}`);

  console.log(chalk.gray('\n  By Priority:'));
  console.log(`    ${chalk.red('●')} Urgent:  ${chalk.red(stats.byPriority.urgent)}`);
  console.log(`    ${chalk.hex(COLORS.high)('●')} High:    ${chalk.hex(COLORS.high)(stats.byPriority.high)}`);
  console.log(`    ${chalk.yellow('●')} Medium:  ${chalk.yellow(stats.byPriority.medium)}`);
  console.log(`    ${chalk.green('●')} Low:     ${chalk.green(stats.byPriority.low)}`);

  if (Object.keys(stats.categories).length > 0) {
    console.log(chalk.gray('\n  By Category:'));
    Object.entries(stats.categories).forEach(([cat, count]) => {
      console.log(`    ${chalk.blue('▸')} ${cat}: ${count}`);
    });
  }
  
  console.log('');
}

function renderHelp() {
  console.log(chalk.cyan('\n  Help\n'));
  console.log(chalk.gray('  ─').repeat(15) + '\n');
  console.log('  ↑↓ navigate   Navigate menu');
  console.log('  ↵ select     Select / Confirm');
  console.log('  ⎵ toggle     Toggle selection');
  console.log('  esc cancel   Go back / Cancel');
  console.log(chalk.gray('\n  Commands:'));
  console.log('  List         View all tasks');
  console.log('  Add          Create new task');
  console.log('  Complete     Mark task done');
  console.log('  Edit         Modify task');
  console.log('  Delete       Remove task');
  console.log('  Search       Find tasks');
  console.log('  Stats        View statistics');
  console.log('');
}

async function welcome() {
  console.log(chalk.cyan('\n'));
  console.log(chalk.cyan('  ╔═══════════════════════════════════╗'));
  console.log(chalk.cyan('  ║         ') + chalk.white.bold('TASK-CLI') + chalk.cyan('             ║'));
  console.log(chalk.cyan('  ║    ') + chalk.gray('Your smart task manager') + chalk.cyan('    ║'));
  console.log(chalk.cyan('  ╚═══════════════════════════════════╝'));
  console.log(chalk.gray('\n  Press any key to continue...\n'));
}

function printSuccess(msg) {
  console.log(chalk.green('  ✓ ' + msg));
}

function printError(msg) {
  console.log(chalk.red('  ✗ ' + msg));
}

module.exports = {
  welcome,
  renderTaskTable,
  renderTaskDetail,
  renderStats,
  renderHelp,
  printSuccess,
  printError,
  CATEGORIES: ['General', 'Work', 'Personal', 'Shopping', 'Health', 'Learning', 'Finance', 'Projects'],
  PRIORITY_EMOJI,
  COLORS
};

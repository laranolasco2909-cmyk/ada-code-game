const boardEl = document.getElementById('board');
const commandListEl = document.getElementById('commandList');
const statusTextEl = document.getElementById('statusText');
const counterEl = document.getElementById('counter');
const executeBtn = document.getElementById('executeBtn');
const clearBtn = document.getElementById('clearBtn');

const BOARD_SIZE = 5;
const MAX_COMMANDS = 7;

const START = { x: 0, y: 4, dir: 0 };
const GOAL = { x: 2, y: 1 };

// Tabuleiro exato solicitado no enunciado:
// Linha 1: ■ · · ■ ·
// Linha 2: · ■ ⭐ ■ ·
// Linha 3: · · · · ■
// Linha 4: · ■ · ■ ·
// Linha 5: 🤖 · · · ·
const OBSTACLES = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 1, y: 1 },
  { x: 3, y: 1 },
  { x: 4, y: 2 },
  { x: 1, y: 3 },
  { x: 3, y: 3 }
];

const DIRS = [
  { x: 0, y: -1, name: 'up' },
  { x: 1, y: 0, name: 'right' },
  { x: 0, y: 1, name: 'down' },
  { x: -1, y: 0, name: 'left' }
];

const state = {
  commands: [],
  robot: { x: START.x, y: START.y, dir: START.dir },
  executing: false
};

const commandLabels = {
  avancar: 'Avançar',
  direita: 'Direita',
  esquerda: 'Esquerda',
  voltar: 'Voltar'
};

function setStatus(message, type = '') {
  statusTextEl.textContent = message;
  statusTextEl.classList.remove('success', 'error');
  if (type) statusTextEl.classList.add(type);
}

function resetRobot() {
  state.robot = { x: START.x, y: START.y, dir: START.dir };
  renderBoard();
}

function isObstacle(x, y) {
  return OBSTACLES.some((cell) => cell.x === x && cell.y === y);
}

function isInsideBoard(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

function renderBoard() {
  boardEl.innerHTML = '';

  for (let y = 0; y < BOARD_SIZE; y += 1) {
    for (let x = 0; x < BOARD_SIZE; x += 1) {
      const cell = document.createElement('div');
      cell.className = 'cell';

      if (x === GOAL.x && y === GOAL.y) {
        cell.classList.add('goal');
        cell.textContent = '★';
      }

      if (isObstacle(x, y)) {
        cell.classList.add('obstacle');
        cell.textContent = '■';
      }

      if (state.robot.x === x && state.robot.y === y) {
        const robot = document.createElement('div');
        robot.className = 'robot';
        robot.style.transform = `rotate(${state.robot.dir * 90}deg)`;
        cell.appendChild(robot);
      }

      boardEl.appendChild(cell);
    }
  }
}

function renderCommands() {
  counterEl.textContent = `${state.commands.length}/${MAX_COMMANDS}`;

  if (state.commands.length === 0) {
    commandListEl.innerHTML = '<p class="empty-state">Sua máquina aguarda as instruções.</p>';
    return;
  }

  commandListEl.innerHTML = state.commands
    .map((cmd) => `<span class="command-chip">${commandLabels[cmd]}</span>`)
    .join('');
}

function addCommand(command) {
  if (state.executing) return;
  if (state.commands.length >= MAX_COMMANDS) {
    setStatus('A sequência já chegou ao limite de 7 comandos. Execute ou limpe para tentar outra rota.', 'error');
    return;
  }

  state.commands.push(command);
  renderCommands();
  setStatus('Comando adicionado. Continue montando a rota da máquina.');
}

function clearSequence() {
  if (state.executing) return;
  state.commands = [];
  resetRobot();
  renderCommands();
  setStatus('A sequência foi apagada. Crie uma nova rota para a máquina.');
}

function tryMove(directionIndex) {
  const dir = DIRS[directionIndex];
  const nextX = state.robot.x + dir.x;
  const nextY = state.robot.y + dir.y;

  if (!isInsideBoard(nextX, nextY) || isObstacle(nextX, nextY)) {
    return false;
  }

  state.robot.x = nextX;
  state.robot.y = nextY;
  renderBoard();
  return true;
}

function executeAction(action) {
  if (action === 'avancar') {
    return tryMove(state.robot.dir);
  }

  if (action === 'direita') {
    state.robot.dir = (state.robot.dir + 1) % 4;
    renderBoard();
    return true;
  }

  if (action === 'esquerda') {
    state.robot.dir = (state.robot.dir + 3) % 4;
    renderBoard();
    return true;
  }

  if (action === 'voltar') {
    const backDir = (state.robot.dir + 2) % 4;
    return tryMove(backDir);
  }

  return true;
}

async function executeProgram() {
  if (state.executing) return;
  if (state.commands.length === 0) {
    setStatus('Escolha pelo menos um comando antes de executar a máquina.', 'error');
    return;
  }

  state.executing = true;
  executeBtn.disabled = true;
  clearBtn.disabled = true;
  document.querySelectorAll('.command-btn').forEach((btn) => (btn.disabled = true));
  resetRobot();
  setStatus('Executando instruções...');

  for (const action of state.commands) {
    if (!state.executing) break;

    const ok = executeAction(action);
    renderBoard();

    if (!ok) {
      state.executing = false;
      executeBtn.disabled = false;
      clearBtn.disabled = false;
      document.querySelectorAll('.command-btn').forEach((btn) => (btn.disabled = false));
      setStatus('Ops! A máquina encontrou um obstáculo. Ajuste os comandos e tente novamente.', 'error');
      return;
    }

    if (state.robot.x === GOAL.x && state.robot.y === GOAL.y) {
      state.executing = false;
      executeBtn.disabled = false;
      clearBtn.disabled = false;
      document.querySelectorAll('.command-btn').forEach((btn) => (btn.disabled = false));
      setStatus('Parabéns! Você conseguiu! Uma sequência organizada de instruções pode orientar uma máquina a realizar uma tarefa.', 'success');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 380));
  }

  state.executing = false;
  executeBtn.disabled = false;
  clearBtn.disabled = false;
  document.querySelectorAll('.command-btn').forEach((btn) => (btn.disabled = false));
  setStatus('Ainda não chegou à estrela! Você pode modificar sua sequência e tentar outra vez.', 'error');
}

document.querySelectorAll('.command-btn').forEach((button) => {
  button.addEventListener('click', () => addCommand(button.dataset.action));
});

executeBtn.addEventListener('click', executeProgram);
clearBtn.addEventListener('click', clearSequence);

renderBoard();
renderCommands();
setStatus('Sua missão é levar a máquina até a estrela! Organize os comandos e aperte Executar.');

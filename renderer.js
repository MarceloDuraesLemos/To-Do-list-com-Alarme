const { ipcRenderer } = require('electron');
const tasks = [];
const canvas = document.getElementById("clock");
const ctx = canvas.getContext("2d");
canvas.width = 350; 
canvas.height = 350;

// Notificação nativa
function notify(msg) {
  new Notification("Agenda", { body: msg, silent: false });
}

// Adicionar tarefa
function addTask() {
  const tarefa = document.getElementById("task").value;
  const inicio = document.getElementById("start").value;
  const fim = document.getElementById("end").value;
  const cor = document.getElementById("color").value;

  if (!tarefa || !inicio || !fim) return;

  tasks.push({ tarefa, inicio, fim, cor, disparado: false });
  renderList();
  drawClock();
}

// Renderizar lista com botão de remover
function renderList() {
  const ul = document.getElementById("list");
  ul.innerHTML = "";
  tasks.forEach((t, index) => {
    const li = document.createElement("li");
    li.textContent = `${t.tarefa} (${t.inicio} - ${t.fim})`;

    const btn = document.createElement("button");
    btn.textContent = "Remover";
    btn.style.marginLeft = "10px";
    btn.onclick = () => removeTask(index);

    li.appendChild(btn);
    ul.appendChild(li);
  });
}

// Remover tarefa
function removeTask(index) {
  tasks.splice(index, 1);
  renderList();
  drawClock();
}

// Converter hora para ângulo
function timeToAngle(time) {
  const [h, m] = time.split(":").map(Number);
  return ((h % 12) + m/60) * 30 * Math.PI/180;
}

// Desenhar relógio
function drawClock() {
  ctx.clearRect(0,0,350,350);

  // fundo
  ctx.fillStyle = "#1e1e1e";
  ctx.beginPath();
  ctx.arc(175,175,175,0,2*Math.PI);
  ctx.fill();

  // círculo externo
  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(175,175,160,0,2*Math.PI);
  ctx.stroke();

  // números
  ctx.fillStyle = "#ccc";
  ctx.font = "16px Segoe UI";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let num = 1; num <= 12; num++) {
    const angle = (num * 30) * Math.PI/180;
    const x = 175 + Math.cos(angle - Math.PI/2) * 140;
    const y = 175 + Math.sin(angle - Math.PI/2) * 140;
    ctx.fillText(num, x, y);
  }

  // tarefas como arcos
  tasks.forEach(t => {
    const startAngle = timeToAngle(t.inicio) - Math.PI/2;
    const endAngle = timeToAngle(t.fim) - Math.PI/2;
    ctx.beginPath();
    ctx.arc(175,175,120,startAngle,endAngle);
    ctx.strokeStyle = t.cor;
    ctx.lineWidth = 15;
    ctx.stroke();
  });

  // ponteiros
  const now = new Date();
  const hr = now.getHours() % 12;
  const min = now.getMinutes();
  const sec = now.getSeconds();

  let hourAngle = ((hr + min/60) * 30) * Math.PI/180;
  drawHand(hourAngle, 80, "#fff", 6);

  let minAngle = ((min + sec/60) * 6) * Math.PI/180;
  drawHand(minAngle, 120, "#fff", 4);

  let secAngle = (sec * 6) * Math.PI/180;
  drawHand(secAngle, 140, "red", 2);
}

function drawHand(angle, length, color, width) {
  ctx.beginPath();
  ctx.moveTo(175,175);
  ctx.lineTo(175 + Math.cos(angle - Math.PI/2) * length,
             175 + Math.sin(angle - Math.PI/2) * length);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.stroke();
}

// tocar alarme (sempre o mesmo som)
function tocarAlarme(tarefa, taskObj) {
  const audio = document.getElementById("alarmSound");
  audio.play();

  setTimeout(() => {
    notify(`Hora de: ${tarefa}`);
    audio.pause();
    audio.currentTime = 0;
    taskObj.disparado = true;
  }, 100);
}

// checar alarmes
setInterval(() => {
  const now = new Date();
  const horaAtual = now.toTimeString().slice(0,5);

  tasks.forEach(t => {
    if (t.inicio === horaAtual && !t.disparado) {
      tocarAlarme(t.tarefa, t);
    }
  });

  drawClock();
}, 1000);

// escolher som único para todos os alarmes
document.getElementById("alarmFile").addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) {
    const url = URL.createObjectURL(file);
    document.getElementById("alarmSound").src = url;
    notify("Som atualizado para os alarmes!");
  }
});

// Exportar agenda
async function exportTasks() {
  const ok = await ipcRenderer.invoke('save-tasks', tasks);
  if (ok) {
    notify("Agenda exportada com sucesso!");
  }
}

// Importar agenda
async function loadTasks() {
  const loaded = await ipcRenderer.invoke('load-tasks');
  if (loaded) {
    tasks.length = 0;
    loaded.forEach(t => tasks.push(t));
    renderList();
    drawClock();
    notify("Agenda importada!");
  }
}

// Limpar tudo
function clearTasks() {
  tasks.length = 0;
  renderList();
  drawClock();
  notify("Agenda limpa!");
}

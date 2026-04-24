import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';

const PORT = process.env.PORT || 8420;
const MAX_ITERATIONS = parseInt(process.env.MAX_ITERATIONS || '5');
const ACK_TIMEOUT_MS = 60000;
const pendingAcks = new Map();
const pendingMessages = new Map();
const connections = new Set();

let phase = 'scoping'; // scoping → building → deploying → verifying → demo
let subtasks = [];
let currentSubtask = 0;
let iteration = 0;

const wss = new WebSocketServer({ port: PORT });
console.log(`[orchestrator] ws://0.0.0.0:${PORT} ready (max ${MAX_ITERATIONS} iterations per subtask)`);

wss.on('connection', (ws) => {
  let meta = null;

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    const label = subtasks.length > 0 ? `subtask ${currentSubtask + 1}/${subtasks.length}` : phase;
    console.log(`[${label} iter ${iteration}] ${msg.from} → ${msg.type}: ${msg.detail || msg.challenge || ''}`);

    if (msg.type === 'register') {
      meta = { ws, id: msg.from, role: msg.role };
      connections.add(meta);
      const role = msg.role;
      setTimeout(() => {
        const queue = pendingMessages.get(role) || [];
        if (queue.length > 0) {
          console.log(`[orchestrator] Delivering ${queue.length} queued msg(s) to all ${role} connections`);
          for (const c of connections) {
            if (c.role === role) {
              try { queue.forEach(m => c.ws.send(JSON.stringify(m))); } catch(e) {}
            }
          }
          pendingMessages.delete(role);
        }
      }, 500);
      return;
    }

    // All task:status goes to challenger (scoper, builder, verifier, demo-coach)
    if (msg.type === 'task:status') {
      routeToRole('challenger', msg);
      setAckTimeout(msg.from);
    }

    if (msg.type === 'verdict') {
      clearAckTimeout(msg.target);
      if (msg.approved) sendToAgent(msg.target, { type: 'ack', detail: msg.detail || 'Approved' });
      else sendToAgent(msg.target, { type: 'reject', challenge: msg.challenge, suggestion: msg.suggestion });
    }

    if (msg.type === 'fix:complete') {
      routeToRole('challenger', msg);
      setAckTimeout(msg.from);
    }

    // Scoper done → load subtasks, start first one
    if (msg.type === 'task:complete' && phase === 'scoping') {
      try {
        const data = JSON.parse(readFileSync('/shared-repo/scoped-tasks.json', 'utf-8'));
        subtasks = data.subtasks || [];
      } catch (e) {
        console.log(`[orchestrator] Could not read scoped-tasks.json: ${e.message}`);
        console.log(`[orchestrator] Builder will read it directly from /shared-repo/`);
        // Set a placeholder — builder will read the file itself
        subtasks = [{ title: 'Read scoped-tasks.json', description: 'Read /shared-repo/scoped-tasks.json for full task details' }];
      }
      console.log(`\n[orchestrator] Scoping complete — ${subtasks.length} subtask(s)`);
      phase = 'building';
      currentSubtask = 0;
      iteration = 0;
      startNextSubtask();
    }

    // Builder done with current subtask → deploy
    if (msg.type === 'task:complete' && phase === 'building') {
      console.log(`[orchestrator] Build complete for subtask ${currentSubtask + 1} → deploying`);
      phase = 'deploying';
      routeToRole('deployer', { type: 'deploy:request', from: 'orchestrator', detail: msg.detail });
    }

    // Deploy done → verify
    if (msg.type === 'deploy:complete') {
      console.log(`[orchestrator] Deploy complete → verifying`);
      phase = 'verifying';
      routeToRole('verifier', { type: 'verify:request', from: 'orchestrator', detail: msg.detail, outputs: msg.outputs });
    }

    // Deploy failed → back to builder
    if (msg.type === 'deploy:failed') {
      console.log(`[orchestrator] Deploy FAILED → back to builder`);
      phase = 'building';
      routeToRole('builder', { type: 'fix:needed', from: 'orchestrator', detail: `Deploy failed: ${msg.detail}` });
    }

    // Verify complete
    if (msg.type === 'verify:complete') {
      if (msg.passed) {
        console.log(`\n[orchestrator] ✅ Subtask ${currentSubtask + 1} PASSED`);
        currentSubtask++;
        iteration = 0;
        if (currentSubtask >= subtasks.length) {
          // All subtasks done → demo coach
          console.log(`\n[orchestrator] ✅ ALL SUBTASKS PASSED → triggering demo coach`);
          phase = 'demo';
          routeToRole('demo-coach', {
            type: 'demo:request', from: 'orchestrator',
            detail: `All ${subtasks.length} subtasks verified. Generate the demo guide.`,
          });
        } else {
          // Next subtask
          phase = 'building';
          startNextSubtask();
        }
      } else {
        iteration++;
        if (iteration >= MAX_ITERATIONS) {
          console.log(`\n[orchestrator] ❌ MAX ITERATIONS (${MAX_ITERATIONS}) for subtask ${currentSubtask + 1}`);
          setTimeout(() => process.exit(1), 2000);
          return;
        }
        console.log(`\n[orchestrator] ❌ Verify failed → fix iteration ${iteration} for subtask ${currentSubtask + 1}`);
        phase = 'building';
        routeToRole('builder', {
          type: 'fix:needed', from: 'orchestrator',
          detail: `Verification failed for subtask ${currentSubtask + 1}: ${msg.detail}. Read /shared-repo/verification-report.md and fix the issues.`,
        });
      }
    }

    // Demo done → pipeline complete
    if (msg.type === 'demo:complete' && phase === 'demo') {
      console.log(`\n[orchestrator] ✅ PIPELINE COMPLETE — ${subtasks.length} subtasks built, deployed, verified. Demo guide ready.`);
      setTimeout(() => process.exit(0), 2000);
    }
  });

  ws.on('close', () => { if (meta) connections.delete(meta); });
});

function startNextSubtask() {
  const task = subtasks[currentSubtask];
  const detail = task
    ? `Subtask ${currentSubtask + 1}/${subtasks.length}: ${task.title}. ${task.description}. Verification: ${(task.verificationCriteria || []).join(', ')}`
    : `Subtask ${currentSubtask + 1}. Read /shared-repo/scoped-tasks.json for details.`;
  console.log(`\n[orchestrator] Starting subtask ${currentSubtask + 1}/${subtasks.length || '?'}`);
  routeToRole('builder', { type: 'subtask:start', from: 'orchestrator', detail, subtaskIndex: currentSubtask });
}

function setAckTimeout(agentId) {
  const timeout = setTimeout(() => {
    sendToAgent(agentId, { type: 'ack', detail: 'Auto-approved (timeout)', auto: true });
    pendingAcks.delete(agentId);
  }, ACK_TIMEOUT_MS);
  pendingAcks.set(agentId, timeout);
}

function clearAckTimeout(agentId) {
  const t = pendingAcks.get(agentId);
  if (t) { clearTimeout(t); pendingAcks.delete(agentId); }
}

function sendToAgent(id, msg) {
  const payload = JSON.stringify({ ...msg, from: 'orchestrator' });
  for (const c of connections) {
    if (c.id === id) { try { c.ws.send(payload); } catch(e) {} }
  }
}

function routeToRole(role, msg) {
  let sent = false;
  const payload = JSON.stringify(msg);
  for (const c of connections) {
    if (c.role === role) { try { c.ws.send(payload); sent = true; } catch(e) {} }
  }
  if (!sent) {
    console.log(`[orchestrator] No ${role} connected — queuing message`);
    const queue = pendingMessages.get(role) || [];
    queue.push(msg);
    pendingMessages.set(role, queue);
  }
}

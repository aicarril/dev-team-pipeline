#!/usr/bin/env node
import WebSocket from 'ws';

const WS_URL = process.env.WS_URL || 'ws://orchestrator:8420';
const args = process.argv.slice(2);
const cmd = args[0];

function getArg(name) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? args[i + 1] : null;
}

const id = getArg('id') || 'unknown';
const role = getArg('role') || id.replace(/-\d+$/, '');
const ws = new WebSocket(WS_URL);

ws.on('error', (e) => { console.error(`ERROR: ${e.message}`); process.exit(1); });

ws.on('open', () => {
  // Always register so orchestrator knows this connection
  ws.send(JSON.stringify({ type: 'register', from: id, role }));

  if (cmd === 'register') {
    console.log(`REGISTERED ${id}`);
    process.exit(0);
  }

  // report: send status and block for ack/reject
  if (cmd === 'report') {
    ws.send(JSON.stringify({
      type: 'task:status', from: id,
      step: getArg('step'), detail: getArg('detail'), file: getArg('file'),
    }));
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.type === 'ack') { console.log(`APPROVED: ${msg.detail}`); process.exit(0); }
      if (msg.type === 'reject') { console.log(`REJECTED: ${msg.challenge}\nSUGGESTION: ${msg.suggestion}`); process.exit(0); }
    });
    return;
  }

  // fix: resubmit after rejection, block for ack/reject
  if (cmd === 'fix') {
    ws.send(JSON.stringify({
      type: 'fix:complete', from: id,
      step: getArg('step'), detail: getArg('detail'), file: getArg('file'),
    }));
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.type === 'ack') { console.log(`APPROVED: ${msg.detail}`); process.exit(0); }
      if (msg.type === 'reject') { console.log(`REJECTED: ${msg.challenge}\nSUGGESTION: ${msg.suggestion}`); process.exit(0); }
    });
    return;
  }

  // challenge: reject a step
  if (cmd === 'challenge') {
    ws.send(JSON.stringify({
      type: 'verdict', from: id, target: getArg('target'),
      approved: false, step: getArg('step'),
      challenge: getArg('challenge'), suggestion: getArg('suggestion'),
    }));
    console.log('CHALLENGE SENT');
    process.exit(0);
  }

  // approve: approve a step
  if (cmd === 'approve') {
    ws.send(JSON.stringify({
      type: 'verdict', from: id, target: getArg('target'),
      approved: true, step: getArg('step'), detail: `Step ${getArg('step')} approved`,
    }));
    console.log('APPROVED');
    process.exit(0);
  }

  // complete: builder signals all build steps done → triggers deployer
  if (cmd === 'complete') {
    ws.send(JSON.stringify({ type: 'task:complete', from: id, detail: getArg('detail') }));
    console.log('BUILD COMPLETE — deployer will be triggered');
    process.exit(0);
  }

  // deploy-complete: deployer signals deploy done → triggers verifier
  if (cmd === 'deploy-complete') {
    ws.send(JSON.stringify({
      type: 'deploy:complete', from: id,
      detail: getArg('detail'), outputs: getArg('outputs'),
    }));
    console.log('DEPLOY COMPLETE — verifier will be triggered');
    process.exit(0);
  }

  // deploy-failed: deployer signals deploy failed
  if (cmd === 'deploy-failed') {
    ws.send(JSON.stringify({ type: 'deploy:failed', from: id, detail: getArg('detail') }));
    console.log('DEPLOY FAILED — builder will be notified');
    process.exit(0);
  }

  // verify-complete: verifier signals verification done
  if (cmd === 'verify-complete') {
    const passed = getArg('passed') === 'true';
    ws.send(JSON.stringify({
      type: 'verify:complete', from: id,
      passed, detail: getArg('detail'),
    }));
    console.log(`VERIFY ${passed ? 'PASSED' : 'FAILED'}`);
    process.exit(0);
  }

  // demo-complete: demo coach finished generating the guide
  if (cmd === 'demo-complete') {
    ws.send(JSON.stringify({ type: 'demo:complete', from: id, detail: getArg('detail') }));
    console.log('DEMO GUIDE COMPLETE');
    process.exit(0);
  }

  // wait: block until a specific message type arrives
  if (cmd === 'wait') {
    const waitFor = (getArg('for') || '').split(',');
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (waitFor.includes(msg.type)) {
        console.log(JSON.stringify(msg));
        process.exit(0);
      }
    });
    setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 120000);
    return;
  }

  console.error(`Unknown command: ${cmd}`);
  process.exit(1);
});

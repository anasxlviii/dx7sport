import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getAgentFiles() {
  const vpsState = '/var/dx7sport/auto-fb/state.json';
  const vpsLog = '/var/dx7sport/auto-fb/log.txt';
  
  if (existsSync(vpsState)) {
    return { statePath: vpsState, logPath: vpsLog };
  }
  
  // Local fallback
  const localState = join(process.cwd(), 'scripts', 'auto-fb', 'state.json');
  const localLog = join(process.cwd(), 'scripts', 'auto-fb', 'log.txt');
  return { statePath: localState, logPath: localLog };
}

export async function GET() {
  try {
    const { statePath, logPath } = getAgentFiles();
    
    let state = { enabled: true, today: '', count: 0, reelCount: 0 };
    if (existsSync(statePath)) {
      try {
        state = JSON.parse(readFileSync(statePath, 'utf-8'));
      } catch (e) {
        console.error('Failed to parse state file', e);
      }
    }
    
    // Read last 25 lines of log.txt
    let logs: string[] = [];
    if (existsSync(logPath)) {
      try {
        const content = readFileSync(logPath, 'utf-8');
        const lines = content.split('\n');
        logs = lines.slice(-25).filter(line => line.trim().length > 0);
      } catch (e) {
        console.error('Failed to read logs', e);
      }
    }
    
    return NextResponse.json({
      enabled: state.enabled !== false, // default to true
      today: state.today || '',
      count: state.count || 0,
      reelCount: state.reelCount || 0,
      logs
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const { statePath, logPath } = getAgentFiles();

    // 1. Manual Trigger Action
    if (action === 'trigger') {
      const vpsScript = '/var/dx7sport/auto-fb/index.mjs';
      const localScript = join(process.cwd(), 'scripts', 'auto-fb', 'index.mjs');
      const scriptPath = existsSync(vpsScript) ? vpsScript : localScript;
      
      const vpsEnv = '/var/dx7sport/auto-fb/.env';
      const localEnv = join(process.cwd(), 'scripts', 'auto-fb', '.env');
      const envPath = existsSync(vpsEnv) ? vpsEnv : localEnv;

      if (!existsSync(scriptPath)) {
        return NextResponse.json({ error: 'Curation script not found.' }, { status: 404 });
      }

      // Log manual trigger audit entry
      try {
        const auditLine = `[${new Date().toISOString()}] [ADMIN] Manually triggered curation cycle via dashboard.\n`;
        const { appendFileSync } = await import('fs');
        appendFileSync(logPath, auditLine);
      } catch {}

      // Spawn process in background
      const args = [`--env-file=${envPath}`, scriptPath];
      const child = spawn('node', args, {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();

      return NextResponse.json({ success: true, message: 'Agent triggered successfully in background.' });
    }

    // 2. Toggle Enabled State Action
    const body = await req.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid enabled parameter.' }, { status: 400 });
    }

    let state = { enabled: true, posted: [], count: 0, today: '', reelCount: 0 };
    if (existsSync(statePath)) {
      try {
        state = JSON.parse(readFileSync(statePath, 'utf-8'));
      } catch {}
    }

    state.enabled = enabled;
    writeFileSync(statePath, JSON.stringify(state, null, 2));

    // Log the change
    try {
      const auditLine = `[${new Date().toISOString()}] [ADMIN] Curation agent status toggled to: ${enabled ? 'ENABLED' : 'DISABLED'}\n`;
      const { appendFileSync } = await import('fs');
      appendFileSync(logPath, auditLine);
    } catch {}

    return NextResponse.json({ success: true, enabled: state.enabled });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

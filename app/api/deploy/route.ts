import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== process.env.PIPELINE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cwd = process.cwd();
    const commands = [
      { cmd: 'git pull origin master', label: 'git pull' },
      { cmd: 'npm install', label: 'npm install' },
      { cmd: 'npm run build', label: 'npm run build' },
      { cmd: 'pm2 restart dx7sport', label: 'pm2 restart' },
    ];

    const results: { command: string; output?: string; error?: string }[] = [];
    for (const { cmd, label } of commands) {
      try {
        const { stdout } = await execAsync(cmd, { cwd, timeout: 300_000, maxBuffer: 10 * 1024 * 1024 });
        results.push({ command: label, output: stdout.trim() });
      } catch (e: any) {
        results.push({ command: label, output: e.stdout?.trim() || '', error: e.stderr?.trim() || e.message });
        break;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

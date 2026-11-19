// Isolated preview: never let a verification server overwrite the live .next.
const { spawn } = require('node:child_process');
const args = process.argv.slice(2);
const hasPort = args.includes('--port') || args.includes('-p');
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', ...(hasPort ? [] : ['--port', '3100']), ...args], {
  stdio: 'inherit',
  env: { ...process.env, NEXT_DIST_DIR: '.next-check' },
});
child.on('error', error => { console.error(error); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));

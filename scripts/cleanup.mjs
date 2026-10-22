import { rmSync, existsSync, statSync } from 'fs';

const nmPath = '/vercel/share/v0-project/node_modules';

if (existsSync(nmPath)) {
  const stat = statSync(nmPath);
  console.log('node_modules exists, isDirectory:', stat.isDirectory());
  if (!stat.isDirectory()) {
    console.log('Removing file at node_modules path...');
    rmSync(nmPath, { force: true });
    console.log('Removed.');
  }
} else {
  console.log('node_modules does not exist');
}

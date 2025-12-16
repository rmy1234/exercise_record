const { exec } = require('child_process');
const port = process.argv[2] || '3000';

exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
  if (error || !stdout.trim()) {
    console.log(`포트 ${port}는 사용 중이 아닙니다.`);
    process.exit(0);
  }

  const lines = stdout.trim().split('\n');
  const pids = new Set();

  lines.forEach(line => {
    const match = line.match(/LISTENING\s+(\d+)/);
    if (match) {
      pids.add(match[1]);
    }
  });

  if (pids.size === 0) {
    console.log(`포트 ${port}를 사용하는 프로세스를 찾을 수 없습니다.`);
    process.exit(0);
  }

  console.log(`포트 ${port}를 사용하는 프로세스 종료 중...`);
  let killedCount = 0;

  pids.forEach(pid => {
    exec(`taskkill /PID ${pid} /F`, (killError) => {
      if (!killError) {
        killedCount++;
        console.log(`프로세스 ${pid} 종료 완료`);
      }
      
      if (killedCount === pids.size) {
        console.log(`모든 프로세스 종료 완료.`);
        process.exit(0);
      }
    });
  });
});





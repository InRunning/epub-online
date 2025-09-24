import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get('file');

  if (!file) {
    return NextResponse.json({ error: 'File path is required' }, { status: 400 });
  }

  // 确保文件路径是绝对路径且安全
  const projectDir = process.cwd();
  const absolutePath = path.resolve(projectDir, file);

  // 防止目录遍历攻击
  if (!absolutePath.startsWith(projectDir)) {
    return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
  }

  const command = `cursor ${absolutePath}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error}`);
      // 即使有错也返回成功，因为命令可能已经发出
    }
  });

  return NextResponse.json({ message: 'Editor launch command issued' });
}
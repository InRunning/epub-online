import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { spawnSync } from 'child_process'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getLaunchEditor() {
  // CJS module interop for Next ESM route
  const mod: any = await import('react-dev-utils/launchEditor')
  return (mod?.default ?? mod) as (file: string, line?: number, col?: number) => void
}

function ensureEditorEnv() {
  if (!process.env.REACT_EDITOR) {
    try {
      const which = spawnSync('which', ['cursor'])
      process.env.REACT_EDITOR = which.status === 0 ? 'cursor' : 'code'
    } catch {
      process.env.REACT_EDITOR = 'code'
    }
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const fileName = url.searchParams.get('fileName')
  const lineNumber = parseInt(url.searchParams.get('lineNumber') || '1', 10)
  const colNumber = parseInt(url.searchParams.get('colNumber') || '1', 10)

  if (!fileName) {
    return NextResponse.json({ error: 'Missing fileName' }, { status: 400 })
  }

  // Accept both absolute and relative paths here just in case
  const resolved = path.isAbsolute(fileName)
    ? fileName
    : path.join(process.cwd(), fileName)

  ensureEditorEnv()
  const launchEditor = await getLaunchEditor()
  launchEditor(resolved, lineNumber, colNumber)

  return new NextResponse(null, { status: 200 })
}


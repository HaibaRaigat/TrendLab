import { NextRequest, NextResponse } from 'next/server'

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateSimpleToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ success: false, message: 'Invalid input' }, { status: 400 })
    }

    // Compute hash of submitted code
    const submittedHash = await hashString(code.trim())
    
    // The expected hash (stored server-side via env var)
    const expectedHash = process.env.ADMIN_CODE_HASH || 'aa13d3834a4d5f4dda27a937972d9917bebc39e1e368df9279084e69ec9b6018'

    if (submittedHash !== expectedHash) {
      // Add a small delay to prevent brute force
      await new Promise(resolve => setTimeout(resolve, 500))
      return NextResponse.json({ success: false, message: 'Invalid code' }, { status: 401 })
    }

    // Generate a session token
    const token = generateSimpleToken()
    const expires = Date.now() + 8 * 60 * 60 * 1000 // 8 hours

    const response = NextResponse.json({ success: true })
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/',
    })
    
    // Store token hash for validation
    response.cookies.set('admin_exp', expires.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get('admin_session')
  const expCookie = request.cookies.get('admin_exp')
  
  if (!session?.value || !expCookie?.value) {
    return NextResponse.json({ authenticated: false })
  }

  const expires = parseInt(expCookie.value)
  if (Date.now() > expires) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({ authenticated: true })
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ success: true })
  response.cookies.delete('admin_session')
  response.cookies.delete('admin_exp')
  return response
}

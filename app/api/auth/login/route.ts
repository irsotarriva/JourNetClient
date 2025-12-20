import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Server-side Supabase client with secret key
const supabase = createClient(
  'https://wxbgmeovyxqrcecjcitb.supabase.co',
  'sb_secret_uYn5zuxS0aQyS2TmE92wGw_1aArhRAv'
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Fetch user with password hash - same as FastAPI
    const { data, error } = await supabase
      .from('Users')
      .select('id, name, email, password_hash')
      .eq('email', email)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password using bcrypt - same as FastAPI's verify_password()
    const isValid = bcrypt.compareSync(password, data.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Return user data (without password)
    return NextResponse.json({
      user: {
        id: String(data.id),
        email: data.email,
        username: data.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

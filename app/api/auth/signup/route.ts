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
    const { email, username, password } = await request.json();

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: 'Email, username, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists - same as FastAPI
    const { data: existingUser } = await supabase
      .from('Users')
      .select('id')
      .or(`email.eq.${email},name.eq.${username}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    // Hash password using bcrypt - same as FastAPI's hash_password()
    const password_hash = bcrypt.hashSync(password, 10);

    // Insert new user
    const { data, error } = await supabase
      .from('Users')
      .insert({
        name: username,
        email: email,
        password_hash: password_hash,
      })
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Return user data
    return NextResponse.json({
      user: {
        id: String(data.id),
        email: data.email,
        username: data.name,
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

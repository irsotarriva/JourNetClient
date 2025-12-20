import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with secret key
const supabase = createClient(
  'https://wxbgmeovyxqrcecjcitb.supabase.co',
  'sb_secret_uYn5zuxS0aQyS2TmE92wGw_1aArhRAv'
);

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user - same as FastAPI
    const { data, error } = await supabase
      .from('Users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: String(data.id),
        email: data.email,
        username: data.name,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

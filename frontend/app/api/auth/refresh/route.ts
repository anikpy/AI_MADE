import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json({ detail: 'No refresh token provided.' }, { status: 401 });
  }

  try {
    const response = await axios.post(`${BACKEND_URL}/auth/token/refresh/`, { refresh: refreshToken });
    const { access } = response.data;

    const nextResponse = NextResponse.json({ access }, { status: 200 });

    nextResponse.cookies.set('access_token', access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return nextResponse;
  } catch (error: any) {
    const nextResponse = NextResponse.json({ detail: 'Token refresh failed.' }, { status: 401 });
    nextResponse.cookies.delete('access_token');
    nextResponse.cookies.delete('refresh_token');
    return nextResponse;
  }
}

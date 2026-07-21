import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await axios.post(`${BACKEND_URL}/auth/login/`, body);

    const { access, refresh } = response.data;

    // Create response returning tokens & data
    const nextResponse = NextResponse.json(response.data, { status: 200 });

    // Set httpOnly secure cookies for access & refresh tokens
    nextResponse.cookies.set('access_token', access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    });

    nextResponse.cookies.set('refresh_token', refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return nextResponse;
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { detail: 'Internal Server Error' };
    return NextResponse.json(data, { status });
  }
}

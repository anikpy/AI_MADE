import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value;
  const accessToken = req.cookies.get('access_token')?.value;

  if (refreshToken) {
    try {
      await axios.post(
        `${BACKEND_URL}/auth/logout/`,
        { refresh: refreshToken },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch {
      // Ignore logout errors on backend
    }
  }

  const response = NextResponse.json({ detail: 'Successfully logged out.' });

  // Clear cookies
  response.cookies.delete('access_token');
  response.cookies.delete('refresh_token');

  return response;
}

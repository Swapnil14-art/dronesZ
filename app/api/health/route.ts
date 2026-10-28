import { NextResponse } from 'next/server';

/**
 * Lightweight health check endpoint for uptime monitors and keep-alive cron jobs.
 * Performs zero database queries, zero image loading, and returns a minimal 200 OK response.
 */
export async function GET() {
  return NextResponse.json(
    { status: 'UP', service: 'frontend' },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    }
  );
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { createJob } from '@/lib/workiz';

function isWorkizConfigured() {
  const mode = (process.env.WORKIZ_MODE || '').toLowerCase();
  if (mode === 'mock') return false;
  return !!process.env.WORKIZ_API_TOKEN;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!isWorkizConfigured()) {
      return NextResponse.json({
        success: true,
        mode: 'mock',
        message: 'Workiz is not configured. Returning a mock job creation response.',
        job: {
          id: `mock-workiz-${Date.now()}`,
          ...body,
        },
      });
    }

    const result = await createJob(body);
    return NextResponse.json({ success: true, mode: 'live', job: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

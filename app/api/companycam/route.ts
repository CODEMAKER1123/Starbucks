import { NextRequest, NextResponse } from 'next/server';
import { searchProjects, getProjectPhotos } from '@/lib/companycam';

/**
 * GET /api/companycam?query=00806 — search projects
 * GET /api/companycam?projectId=123 — get photos for a project
 */
export async function GET(req: NextRequest) {
  try {
    const query = req.nextUrl.searchParams.get('query');
    const projectId = req.nextUrl.searchParams.get('projectId');

    if (projectId) {
      const photos = await getProjectPhotos(projectId);
      return NextResponse.json({ success: true, photos });
    }

    if (query) {
      const projects = await searchProjects(query);
      return NextResponse.json({ success: true, projects });
    }

    return NextResponse.json({ error: 'Provide ?query= or ?projectId=' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

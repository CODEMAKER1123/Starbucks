import { NextRequest, NextResponse } from 'next/server';
import {
  searchProjects,
  findStarbucksProject,
  getProjectPhotos,
  isCompanyCamConfigured,
  buildMockPhotos,
  buildMockProject,
} from '@/lib/companycam';

/**
 * GET /api/companycam?storeNumber=00806&woNumber=1963606 — find exact project + photos
 * GET /api/companycam?query=00806 — generic search
 * GET /api/companycam?projectId=123 — get photos for a specific project
 */
export async function GET(req: NextRequest) {
  try {
    const storeNumber = req.nextUrl.searchParams.get('storeNumber');
    const woNumber = req.nextUrl.searchParams.get('woNumber');
    const query = req.nextUrl.searchParams.get('query');
    const projectId = req.nextUrl.searchParams.get('projectId');

    const configured = isCompanyCamConfigured();

    if (!configured) {
      if (projectId?.startsWith('mock:')) {
        const [, mockStoreNumber = '00000', mockWoNumber = 'pending'] = projectId.split(':');
        return NextResponse.json({
          success: true,
          configured: false,
          mode: 'mock',
          photos: buildMockPhotos(mockStoreNumber, mockWoNumber === 'pending' ? undefined : mockWoNumber),
          message: 'CompanyCam is not configured. Showing mock placeholder photos.',
        });
      }

      if (storeNumber) {
        const mockProject = buildMockProject(storeNumber, woNumber || undefined);
        return NextResponse.json({
          success: true,
          configured: false,
          mode: 'mock',
          matched: false,
          project: null,
          photos: [],
          searchResults: [mockProject],
          message: 'CompanyCam is not configured. Select the mock project to preview placeholder photos or set COMPANYCAM_API_TOKEN for live matching.',
        });
      }

      if (query) {
        return NextResponse.json({
          success: true,
          configured: false,
          mode: 'mock',
          projects: [buildMockProject(query.replace(/\D/g, '').padStart(5, '0').slice(-5) || '00000')],
          message: 'CompanyCam is not configured. Returning mock results only.',
        });
      }
    }

    if (projectId) {
      const photos = await getProjectPhotos(projectId);
      return NextResponse.json({ success: true, configured: true, mode: 'live', photos });
    }

    if (storeNumber) {
      const project = await findStarbucksProject(storeNumber, woNumber || undefined);

      if (!project) {
        const fallbackResults = await searchProjects(`Starbucks #${storeNumber}`);
        return NextResponse.json({
          success: true,
          configured: true,
          mode: 'live',
          matched: false,
          project: null,
          photos: [],
          searchResults: fallbackResults,
          message: `No exact match for Starbucks #${storeNumber}${woNumber ? ` WO# ${woNumber}` : ''}. ${fallbackResults.length} similar project(s) found.`,
        });
      }

      const photos = await getProjectPhotos(project.id);
      return NextResponse.json({
        success: true,
        configured: true,
        mode: 'live',
        matched: true,
        project: { id: project.id, name: project.name },
        photos,
        message: `Found "${project.name}" with ${photos.length} photo(s).`,
      });
    }

    if (query) {
      const projects = await searchProjects(query);
      return NextResponse.json({ success: true, configured: true, mode: 'live', projects });
    }

    return NextResponse.json(
      { error: 'Provide ?storeNumber= (and optionally &woNumber=), ?query=, or ?projectId=' },
      { status: 400 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

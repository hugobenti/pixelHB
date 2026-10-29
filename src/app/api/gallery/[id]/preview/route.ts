/**
 * Purpose:
 * `GET /api/gallery/[id]/preview`: the PNG preview of one Drive artwork. Cached privately and
 * revalidated with a strong ETag on every use, so a stale or signed-out copy is never shown; a match
 * answers 304 without downloading from Drive.
 */
import { previewResponse, withGalleryAccess } from "@/features/shared/drive/server/galleryRouteHelpers";

export const maxDuration = 30;

export async function GET(request: Request, ctx: RouteContext<"/api/gallery/[id]/preview">): Promise<Response> {
  const { id } = await ctx.params;
  return withGalleryAccess(request, id, async (store) => previewResponse(request, id, await store.getPreview(id)));
}

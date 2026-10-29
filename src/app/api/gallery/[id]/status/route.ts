/**
 * Purpose:
 * `GET /api/gallery/[id]/status`: whether one artwork is live, trashed (with its last `updatedAt`) or
 * nowhere in Drive. The sync engine asks it before it removes a local copy, so a deletion is never
 * inferred from a missing list entry alone.
 */
import { withGalleryAccess } from "@/features/shared/drive/server/galleryRouteHelpers";

export const maxDuration = 30;

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/gallery/[id]/status">,
): Promise<Response> {
  const { id } = await ctx.params;
  return withGalleryAccess(request, id, async (store) =>
    Response.json(await store.status(id), { headers: { "Cache-Control": "private, no-store" } }),
  );
}

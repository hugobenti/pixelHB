/**
 * Purpose:
 * `GET /api/gallery`: the signed-in user's artworks stored in Google Drive.
 */
import type { IGalleryListResponse } from "@/features/shared/drive/galleryApi.type";
import { withGalleryAccess } from "@/features/shared/drive/server/galleryRouteHelpers";

export async function GET(request: Request): Promise<Response> {
  return withGalleryAccess(request, null, async (store) =>
    Response.json((await store.list()) satisfies IGalleryListResponse, {
      headers: { "Cache-Control": "private, no-store" },
    }),
  );
}

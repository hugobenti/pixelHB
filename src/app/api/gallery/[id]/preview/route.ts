/**
 * Purpose:
 * `GET /api/gallery/[id]/preview`: the PNG preview of one Drive artwork. The list's `previewUrl`
 * carries `?v=<updatedAt>`, so the response can be cached for a year per version.
 */
import { withGalleryAccess } from "@/features/shared/drive/server/galleryRouteHelpers";

export async function GET(request: Request, ctx: RouteContext<"/api/gallery/[id]/preview">): Promise<Response> {
  const { id } = await ctx.params;
  return withGalleryAccess(request, id, async (store) => {
    const stream = await store.getPreview(id);
    return stream === null
      ? new Response(null, { status: 404 })
      : new Response(stream, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "private, max-age=31536000, immutable",
          },
        });
  });
}

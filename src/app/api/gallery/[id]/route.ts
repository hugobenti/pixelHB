/**
 * Purpose:
 * `/api/gallery/[id]`: read (GET), save (POST, gzip body) and delete (DELETE) one artwork in Drive.
 */
import {
  galleryErrorResponse,
  galleryNotFoundResponse,
  gallerySavedResponse,
  galleryTrashedResponse,
  readDeleteRequest,
  readSaveRequest,
  withGalleryAccess,
} from "@/features/shared/drive/server/galleryRouteHelpers";

export const maxDuration = 30;

export async function GET(request: Request, ctx: RouteContext<"/api/gallery/[id]">): Promise<Response> {
  const { id } = await ctx.params;
  return withGalleryAccess(request, id, async (store) => {
    const stream = await store.get(id);
    return stream === null
      ? galleryNotFoundResponse()
      : new Response(stream, {
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "private, no-store",
          },
        });
  });
}

export async function POST(request: Request, ctx: RouteContext<"/api/gallery/[id]">): Promise<Response> {
  const { id } = await ctx.params;
  return withGalleryAccess(request, id, async (store) => {
    const save = await readSaveRequest(request, id);
    if (!save.ok) {
      return galleryErrorResponse(save.status, { code: save.code });
    }
    const result = await store.upsert(save.upsert);
    return result.kind === "saved"
      ? gallerySavedResponse(result.updatedAt)
      : galleryErrorResponse(409, { code: "conflict", updatedAt: result.updatedAt });
  });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/gallery/[id]">): Promise<Response> {
  const { id } = await ctx.params;
  return withGalleryAccess(request, id, async (store) => {
    const removal = await readDeleteRequest(request);
    if (!removal.ok) {
      return galleryErrorResponse(removal.status, { code: removal.code });
    }
    const result = await store.trash(id, removal.deletedAt);
    return result.kind === "trashed"
      ? galleryTrashedResponse()
      : galleryErrorResponse(409, { code: "conflict", updatedAt: result.updatedAt });
  });
}

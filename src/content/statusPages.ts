import type { IStatusPagesContent } from "./content.type";

export const statusPages: IStatusPagesContent = {
  metaTitle: "Page not found",
  notFound: {
    title: "This page doesn’t exist.",
    text: "The link may be broken, or the page was moved.",
  },
  error: {
    title: "Something went wrong.",
    text: "Your saved artworks aren’t affected. Try again, or go back to your gallery.",
    retry: "Try again",
  },
  gallery: "Go to your gallery",
  home: "Back to the home page",
};

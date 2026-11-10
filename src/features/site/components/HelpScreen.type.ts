/** A table-of-contents link; a section's subsections are listed under it as `children`. */
export interface IHelpTocEntry {
  href: string;
  title: string;
  children: { href: string; title: string }[];
}

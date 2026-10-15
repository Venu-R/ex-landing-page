export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "page"
  );
}

/** "Open Sans" -> "open-sans" (the @fontsource package slug). */
export function fontPackageSlug(family: string): string {
  return slugify(family);
}

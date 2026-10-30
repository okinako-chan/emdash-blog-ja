import type { PortableTextBlock } from "emdash";
import { portableTextToMarkdown } from "emdash/client";

const MD_SUFFIX = /\.md$/;
const ROOT_RELATIVE_LINK = /\]\(\//g;

/**
 * Markdown for agents: a page is served as Markdown when the URL ends in
 * `.md` (`/posts/foo.md`) or the request prefers it (`Accept: text/markdown`).
 */
export function parseMarkdownSlug(slug: string): { slug: string; byUrl: boolean } {
	return MD_SUFFIX.test(slug)
		? { slug: slug.replace(MD_SUFFIX, ""), byUrl: true }
		: { slug, byUrl: false };
}

export function wantsMarkdown(request: Request): boolean {
	return (request.headers.get("accept") ?? "").includes("text/markdown");
}

interface MarkdownPage {
	title: string;
	url: string;
	origin: string;
	description?: string | null;
	published?: Date | null;
	updated?: Date | null;
	content: unknown;
}

export function markdownResponse(page: MarkdownPage): Response {
	const blocks = Array.isArray(page.content) ? (page.content as PortableTextBlock[]) : [];
	// Agents read the file out of context, so make image and link URLs absolute
	const body = portableTextToMarkdown(blocks).replace(ROOT_RELATIVE_LINK, `](${page.origin}/`);
	const meta = [
		`title: ${JSON.stringify(page.title)}`,
		`url: ${page.url}`,
		page.published && `published: ${page.published.toISOString()}`,
		page.updated && `updated: ${page.updated.toISOString()}`,
		page.description && `description: ${JSON.stringify(page.description)}`,
	].filter(Boolean);
	const markdown = `---\n${meta.join("\n")}\n---\n\n# ${page.title}\n\n${body}`;
	return new Response(markdown, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			Vary: "Accept",
		},
	});
}

interface MarkdownIndex {
	title: string;
	tagline?: string | null;
	origin: string;
	posts: { title: string; slug: string; excerpt?: string | null; published?: Date | null }[];
}

/** Home page for agents: what the site is and where the posts are. */
export function markdownIndexResponse(site: MarkdownIndex): Response {
	const posts = site.posts.map((p) => {
		const date = p.published ? ` (${p.published.toISOString().slice(0, 10)})` : "";
		const excerpt = p.excerpt ? `: ${p.excerpt}` : "";
		return `- [${p.title}](${site.origin}/posts/${p.slug}.md)${date}${excerpt}`;
	});
	const markdown = [
		`# ${site.title}`,
		site.tagline ?? "",
		[
			`- About: ${site.origin}/pages/about.md`,
			`- RSS: ${site.origin}/rss.xml`,
			`- Sitemap: ${site.origin}/sitemap.xml`,
		].join("\n"),
		"## Latest posts",
		posts.length ? posts.join("\n") : "(no posts yet)",
	]
		.filter(Boolean)
		.join("\n\n");
	return new Response(`${markdown}\n`, {
		headers: {
			"Content-Type": "text/markdown; charset=utf-8",
			Vary: "Accept",
		},
	});
}

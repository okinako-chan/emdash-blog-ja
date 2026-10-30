/**
 * Optional support link shown in the footer and at the end of each post.
 * Leave as null to hide it.
 *
 * Example:
 * export const SUPPORT: SupportLink | null = {
 * 	url: "https://example.com/support",
 * 	label: "応援する",
 * 	message: "この記事が役に立ったら、応援してもらえると嬉しいです。",
 * };
 */
export interface SupportLink {
	url: string;
	label: string;
	message: string;
	/** Button image in public/. Falls back to a text link when omitted. */
	image?: { src: string; width: number; height: number };
}

export const SUPPORT: SupportLink | null = null;

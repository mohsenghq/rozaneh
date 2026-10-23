import { browser, type Browser } from "wxt/browser";

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

function toNode(n: Browser.bookmarks.BookmarkTreeNode): BookmarkNode {
  return {
    id: n.id,
    title: n.title,
    url: n.url,
    children: n.children?.map(toNode),
  };
}

export async function hasBookmarksPermission(): Promise<boolean> {
  return browser.permissions.contains({ permissions: ["bookmarks"] });
}

export async function requestBookmarksPermission(): Promise<boolean> {
  return browser.permissions.request({ permissions: ["bookmarks"] });
}

export async function getBookmarkTree(): Promise<BookmarkNode[]> {
  const tree = await browser.bookmarks.getTree();
  const roots = tree[0]?.children ?? [];
  return roots.map(toNode);
}

export function flattenBookmarks(nodes: BookmarkNode[]): BookmarkNode[] {
  const out: BookmarkNode[] = [];
  const walk = (list: BookmarkNode[]) => {
    for (const n of list) {
      if (n.url) out.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

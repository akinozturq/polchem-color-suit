// Helper functions for filtering
export const defaultMatcher = (substring, node) => {
  return node.name.toLowerCase().indexOf(substring.toLowerCase()) !== -1;
};

/** Find and return node for which predicate function returns true.
 * Return undefined if not found.
 */
export const findNode = (node, predicate) => {
  if (predicate(node)) {
    return node;
  }
  if (node.children) {
    for (let child of node.children) {
      const found = findNode(child, predicate);
      if (found) {
        return found;
      }
    }
  }
};

export const filterTree = (node, substring, matcher = defaultMatcher) =>
  _filterTree(node, substring, matcher) || { name: '', children: [] };

export const _filterTree = (node, substring, matcher) => {
  // If i'm a match then all my children get to stay
  if (matcher(substring, node)) {
    return node;
  }
  // If not then only keep the ones that match or have matching descendants
  const filtered = node.children
    ?.map((child) => _filterTree(child, substring, matcher))
    .filter(Boolean);

  if (filtered?.length) {
    return { ...node, children: filtered };
  }
  return null;
};

export const expandFilteredNodes = (
  node,
  substring,
  matcher = defaultMatcher
) => {
  // Expand children that have matching descendants
  const children = node.children?.map((child) =>
    expandFilteredNodes(child, substring, matcher)
  );

  // Expand this node if any children expand or match
  const toggled = children
    ? children.some((child) => child.toggled || matcher(substring, child))
    : false;
  return { ...node, children, toggled };
};

export function uncheck(node) {
  node.active = false;
  node.children?.forEach((x) => uncheck(x));
}

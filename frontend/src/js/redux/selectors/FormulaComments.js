/**
 * Expand abbreviations in formula comments.
 *
 * @param {string} comment For example state.order.formula.fcomment
 * @param {object} commentTexts state.cache.commentTexts
 * @returns {string} Expanded comment
 */
export function expandComments(comment, commentTexts) {
  const split = (comment || '').split(',').map((x) => x.trim());
  const expanded = split.map((code) => {
    const text = commentTexts[code.toLowerCase()];
    return text != null ? text : code;
  });
  return expanded.join(', ').trim();
}

/**
 * Expand abbreviations in formula comments.
 *
 * @param {string} comment For example state.order.formula.fcomment
 * @param {object} commentTexts state.cache.commentTexts
 * @param {object} commentImages state.cache.commentImages
 * @returns {Array} Array of objects { text, imageId, hash }
 */
export function expandCommentsAndImages(comment, commentTexts, commentImages) {
  const split = (comment || '').split(',').map((x) => x.trim());
  return split.map((code) => {
    const text = commentTexts[code.toLowerCase()] || code;
    const image = commentImages[code.toLowerCase()];
    return { text, imageId: image?.id, hash: image?.hash };
  });
}

/**
 * Expand current formula comment from state.
 *
 * @param {object} state Redux state
 * @returns {string} Expanded comment
 */
export function commentnotes({ order, cache }) {
  const { formula } = order;
  const { commentTexts } = cache;
  return expandComments(formula?.fcomment, commentTexts);
}

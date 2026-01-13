interface ParseTagOptions {
  onMessage?: (message: string) => void;
  onFinish?: (message: string) => void;
  onChunk?: (message: string) => void;
}
export const clearTag = (content: string, tagName: string, options?: ParseTagOptions) => {
  let buffer = '';
  let startTagName = '<' + tagName + '>';
  let endTagName = '</' + tagName + '>';
  if (content.startsWith(startTagName)) {
    // 去除开头的<tagName>
    buffer = content.substring(startTagName.length).replace(/<\/?\s*\/>%/g, '');

    // 如果以完整的结束标签结尾，调用 onFinish 并返回
    if (buffer.endsWith(endTagName)) {
      const finalContent = buffer.substring(0, buffer.length - endTagName.length);
      options?.onFinish?.(finalContent);
    }

    // 去除结尾不完整的tagName
    // 查找最后一个 '<' 的位置（可能是 '</' 或单独的 '<'）
    const lastTagIndex = buffer.lastIndexOf('<');
    if (lastTagIndex !== -1) {
      const potentialTag = buffer.substring(lastTagIndex);
      // 检查 potentialTag 是否可能是完整的结束标签
      // 如果 potentialTag 的长度小于完整结束标签的长度，说明不完整
      // 如果 potentialTag 的前 endTagName.length 个字符不等于 endTagName，说明不完整
      // 如果 potentialTag 正好等于 endTagName，说明是完整的（但应该被上面的检查捕获）
      const isIncomplete = potentialTag.length < endTagName.length ||
        (potentialTag.length >= endTagName.length &&
          potentialTag.substring(0, endTagName.length) !== endTagName);
      if (isIncomplete) {
        // 去除不完整的标签部分
        buffer = buffer.substring(0, lastTagIndex);
      }
    }

    options?.onMessage?.(buffer);
  }

  return content.replace(startTagName, '').replace(endTagName, '');

}



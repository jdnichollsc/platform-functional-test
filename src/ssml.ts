/**
 * SSML (Speech Synthesis Markup Language) is a subset of XML specifically
 * designed for controlling synthesis. You can see examples of how the SSML
 * should be parsed in `ssml.test.ts`.
 *
 * DO NOT USE CHATGPT, COPILOT, OR ANY AI CODING ASSISTANTS.
 * Conventional auto-complete and Intellisense are allowed.
 *
 * DO NOT USE ANY PRE-EXISTING XML PARSERS FOR THIS TASK.
 * You may use online references to understand the SSML specification, but DO NOT read
 * online references for implementing an XML/SSML parser.
 */

/** Parses attribute string into array of SSMLAttributes */
function parseAttributes(attributeString: string): SSMLAttribute[] {
  const attributes: SSMLAttribute[] = [];
  let remaining = attributeString.trim();
  
  while (remaining.length > 0) {
    // Skip whitespace
    remaining = remaining.trimStart();
    if (!remaining || remaining === '/') break;

    // Match attribute name
    const nameMatch = remaining.match(/^([\w:]+)/);
    if (!nameMatch) {
      if (remaining.trim() === '') break;
      throw new Error('Invalid attribute format');
    }
    const name = nameMatch[1];
    remaining = remaining.substring(name.length).trimStart();

    // Must have equals sign
    if (!remaining.startsWith('=')) {
      throw new Error('Invalid attribute format');
    }
    remaining = remaining.substring(1).trimStart();

    // Must have opening quote
    if (!remaining.startsWith('"')) {
      throw new Error('Invalid attribute format');
    }
    remaining = remaining.substring(1);

    // Find closing quote
    const quoteEnd = remaining.indexOf('"');
    if (quoteEnd === -1) {
      throw new Error('Invalid attribute format');
    }

    const value = remaining.substring(0, quoteEnd);
    attributes.push({ name, value });
    remaining = remaining.substring(quoteEnd + 1);
  }

  return attributes;
}

/** Parses a single node and returns the node and remaining text */
function parseNode(input: string, parentTag?: string): { node: SSMLNode; remainingText: string } {
  const trimmedStart = input.trimStart();
  const leadingSpace = input.length - trimmedStart.length;

  if (!trimmedStart.startsWith('<')) {
    const nextTagIndex = trimmedStart.indexOf('<');
    if (nextTagIndex === -1) {
      return { node: input, remainingText: '' };
    }
    return {
      node: input.substring(0, nextTagIndex + leadingSpace),
      remainingText: input.substring(nextTagIndex + leadingSpace)
    };
  }

  // Handle closing tag of parent
  if (parentTag && trimmedStart.match(new RegExp(`^</\\s*${parentTag}\\s*>`))) {
    const match = trimmedStart.match(new RegExp(`^</\\s*${parentTag}\\s*>`))!;
    return { node: '', remainingText: input.substring(leadingSpace + match[0].length) };
  }

  const openTagMatch = trimmedStart.match(/^<\s*([\w:]+)\s*([^>]*?)(\s*\/?\s*)>/);
  if (!openTagMatch) {
    throw new Error('Invalid tag format');
  }

  const [fullMatch, tagName, attributeString, selfClosing] = openTagMatch;

  const attributes = parseAttributes(attributeString);

  // Handle self-closing tags
  if (selfClosing.includes('/')) {
    return {
      node: {
        name: tagName,
        attributes,
        children: []
      },
      remainingText: input.substring(leadingSpace + fullMatch.length)
    };
  }

  const children: SSMLNode[] = [];
  let remainingText = input.substring(leadingSpace + fullMatch.length);
  
  while (remainingText.length > 0) {
    // Look for closing tag
    const closingTagMatch = remainingText.match(new RegExp(`^\\s*</\\s*${tagName}\\s*>`));
    if (closingTagMatch) {
      remainingText = remainingText.substring(closingTagMatch[0].length);
      break;
    }

    const result = parseNode(remainingText, tagName);
    if (typeof result.node === 'string') {
      children.push(result.node);
    } else {
      children.push(result.node);
    }
    remainingText = result.remainingText;

    // If we've run out of text without finding closing tag
    if (!remainingText && !remainingText.includes(`</${tagName}>`)) {
      throw new Error('Unclosed tag');
    }
  }

  return {
    node: {
      name: tagName,
      attributes,
      children
    },
    remainingText
  };
}

/** Recursively unescapes XML entities in text nodes */
function unescapeTextNodes(node: SSMLNode): SSMLNode {
  if (typeof node === 'string') {
    return unescapeXMLChars(node);
  }
  return {
    ...node,
    children: node.children.map(unescapeTextNodes)
  };
}

/** Validates the root node and ensures no remaining content */
function validateRoot(result: { node: SSMLNode; remainingText: string }): SSMLNode {
  // Validate root node is <speak>
  if (typeof result.node === 'string' || result.node.name !== 'speak') {
    throw new Error('Root node must be <speak>');
  }

  // Ensure no remaining content after root node
  if (result.remainingText.trim()) {
    throw new Error('Multiple root nodes are not allowed');
  }

  return result.node;
}

/** Parses SSML to a SSMLNode, throwing on invalid SSML */
export function parseSSML(ssml: string): SSMLNode {
  // Step 1: Clean input
  const cleanInput = ssml.trim();

  // Step 2: Parse the XML structure
  const parseResult = parseNode(cleanInput);

  // Step 3: Validate it's a proper <speak> root
  const validatedNode = validateRoot(parseResult);

  // Step 4: Process XML entities in text nodes
  return unescapeTextNodes(validatedNode);
}

/** Recursively converts SSML node to string and unescapes XML chars */
export function ssmlNodeToText(node: SSMLNode): string {
  if (typeof node === 'string') {
    return unescapeXMLChars(node);
  } else if (node.children) {
    return node.children.reduce<string>((result, child) => {
      return result + ssmlNodeToText(child);
    }, '');
  }
  return '';
}

// Already done for you
const unescapeXMLChars = (text: string) =>
  text.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&')

type SSMLNode = SSMLTag | SSMLText
type SSMLTag = {
  name: string
  attributes: SSMLAttribute[]
  children: SSMLNode[]
}
type SSMLText = string
type SSMLAttribute = { name: string; value: string }

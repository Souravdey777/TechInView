export type ExecutionLanguage = "python" | "javascript";

type PythonCallTarget =
  | { kind: "solution_method"; name: string }
  | { kind: "top_level_function"; name: string }
  | { kind: "class_api"; name: string }
  | { kind: "unknown" };

type JavascriptCallTarget =
  | { kind: "function"; name: string }
  | { kind: "class_api"; name: string }
  | { kind: "unknown" };

type ComparisonMode =
  | "default"
  | "sort-flat"
  | "sort-outer"
  | "sort-inner-and-outer"
  | "peak-index"
  | "longest-palindrome"
  | "reorganize-string";

const LINKED_LIST_RETURN_SLUGS = new Set([
  "merge-k-sorted-lists",
  "merge-two-sorted-lists",
  "remove-nth-node-from-end",
  "reverse-linked-list",
]);

const TREE_INPUT_SLUGS = new Set([
  "binary-tree-level-order-traversal",
  "binary-tree-right-side-view",
  "kth-smallest-element-in-bst",
  "lowest-common-ancestor-bst",
  "maximum-depth-of-binary-tree",
  "serialize-and-deserialize-binary-tree",
  "validate-binary-search-tree",
]);

const LINKED_LIST_INPUT_SLUGS = new Set([
  "linked-list-cycle",
  ...LINKED_LIST_RETURN_SLUGS,
]);

const GRAPH_INPUT_SLUGS = new Set(["clone-graph"]);

const CLASS_OPERATION_SLUGS = new Set([
  "find-median-from-data-stream",
  "implement-trie",
  "lru-cache",
  "min-stack",
]);

const CODEC_SLUGS = new Set(["serialize-and-deserialize-binary-tree"]);

const COMPARISON_MODES: Record<string, ComparisonMode> = {
  "two-sum": "sort-flat",
  "top-k-frequent-elements": "sort-flat",
  "letter-combinations-of-phone-number": "sort-flat",
  permutations: "sort-outer",
  "n-queens": "sort-outer",
  "combination-sum": "sort-inner-and-outer",
  "group-anagrams": "sort-inner-and-outer",
  subsets: "sort-inner-and-outer",
  "three-sum": "sort-inner-and-outer",
  "find-peak-element": "peak-index",
  "longest-palindromic-substring": "longest-palindrome",
  "reorganize-string": "reorganize-string",
};

export function getProblemExecutionSupport(problemSlug?: string) {
  return {
    handlesStructuredData:
      !!problemSlug &&
      (LINKED_LIST_INPUT_SLUGS.has(problemSlug) ||
        TREE_INPUT_SLUGS.has(problemSlug) ||
        GRAPH_INPUT_SLUGS.has(problemSlug)),
    handlesClassApi: !!problemSlug && (CLASS_OPERATION_SLUGS.has(problemSlug) || CODEC_SLUGS.has(problemSlug)),
    handlesFlexibleOutput: !!problemSlug && problemSlug in COMPARISON_MODES,
  };
}

export function parseTestInput(input: string): { name: string; value: string }[] {
  const params: { name: string; value: string }[] = [];
  let rest = input.trim();

  while (rest.length > 0) {
    const eqIdx = rest.indexOf("=");
    if (eqIdx === -1) break;

    const name = rest.slice(0, eqIdx).trim();
    rest = rest.slice(eqIdx + 1).trimStart();

    let depth = 0;
    let inStr: string | null = null;
    let i = 0;

    for (; i < rest.length; i++) {
      const ch = rest[i];
      if (inStr) {
        if (ch === inStr && rest[i - 1] !== "\\") inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inStr = ch;
        continue;
      }
      if (ch === "[" || ch === "{" || ch === "(") {
        depth++;
        continue;
      }
      if (ch === "]" || ch === "}" || ch === ")") {
        depth--;
        continue;
      }
      if (ch === "," && depth === 0) break;
    }

    params.push({ name, value: rest.slice(0, i).trim() });
    rest = rest.slice(i + 1).trimStart();
  }

  return params;
}

function splitTopLevelValues(input: string): string[] {
  const text = input.trim();
  const values: string[] = [];
  let depth = 0;
  let inStr: string | null = null;
  let start = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inStr) {
      if (ch === inStr && text[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      continue;
    }
    if (ch === "[" || ch === "{" || ch === "(") {
      depth += 1;
      continue;
    }
    if (ch === "]" || ch === "}" || ch === ")") {
      depth -= 1;
      continue;
    }
    if (ch === "," && depth === 0) {
      values.push(text.slice(start, i).trim());
      start = i + 1;
    }
  }

  const tail = text.slice(start).trim();
  if (tail) values.push(tail);
  return values;
}

function ensurePythonDeferredAnnotations(code: string): string {
  if (/^\s*from __future__ import annotations\s*$/m.test(code)) {
    return code;
  }

  return `from __future__ import annotations\n\n${code}`;
}

function stripPythonCommentsForSignatureSearch(code: string): string {
  return code.replace(/^\s*#.*$/gm, "");
}

function stripJavascriptCommentsForSignatureSearch(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

function toPythonLiteral(value: unknown): string {
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "True" : "False";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => toPythonLiteral(item)).join(", ")}]`;
  }
  if (typeof value === "object") {
    return `{${Object.entries(value)
      .map(([key, item]) => `${JSON.stringify(key)}: ${toPythonLiteral(item)}`)
      .join(", ")}}`;
  }

  return String(value);
}

function normalizePythonArgument(value: string): string {
  try {
    return toPythonLiteral(JSON.parse(value));
  } catch {
    return value
      .replace(/\btrue\b/g, "True")
      .replace(/\bfalse\b/g, "False")
      .replace(/\bnull\b/g, "None");
  }
}

function parseClassOperationInput(
  input: string
): { operations: string[]; args: unknown[][] } | null {
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length >= 2 && lines.every((line) => line.includes("="))) {
    const lineParams = lines.map((line) => {
      const eqIndex = line.indexOf("=");
      return {
        name: line.slice(0, eqIndex).trim(),
        value: line.slice(eqIndex + 1).trim(),
      };
    });
    const operationsLine = lineParams.find((param) => param.name === "operations");
    const argsLine = lineParams.find(
      (param) => param.name === "args" || param.name === "arguments"
    );
    if (operationsLine && argsLine) {
      return {
        operations: JSON.parse(operationsLine.value) as string[],
        args: JSON.parse(argsLine.value) as unknown[][],
      };
    }
  }

  const params = parseTestInput(input);
  const operationsParam = params.find((param) => param.name === "operations");
  const argsParam = params.find(
    (param) => param.name === "args" || param.name === "arguments"
  );

  if (operationsParam && argsParam) {
    return {
      operations: JSON.parse(operationsParam.value) as string[],
      args: JSON.parse(argsParam.value) as unknown[][],
    };
  }

  if (lines.length >= 2) {
    return {
      operations: JSON.parse(lines[0]) as string[],
      args: JSON.parse(lines.slice(1).join("")) as unknown[][],
    };
  }

  const values = splitTopLevelValues(input);
  if (values.length === 2) {
    return {
      operations: JSON.parse(values[0]) as string[],
      args: JSON.parse(values[1]) as unknown[][],
    };
  }

  return null;
}

function analyzePythonStarter(code: string): PythonCallTarget {
  const stripped = stripPythonCommentsForSignatureSearch(code);
  const hasSolutionClass = /^\s*class\s+Solution\b/m.test(stripped);

  if (hasSolutionClass) {
    const solutionSource = stripped.slice(stripped.search(/^\s*class\s+Solution\b/m));
    const methodMatch = solutionSource.match(/^\s+def\s+(\w+)\s*\(/m);
    if (methodMatch) {
      return { kind: "solution_method", name: methodMatch[1] };
    }
  }

  const topLevelFunctionMatch = stripped.match(/^def\s+(\w+)\s*\(/m);
  if (topLevelFunctionMatch) {
    return { kind: "top_level_function", name: topLevelFunctionMatch[1] };
  }

  const classMatch = stripped.match(/^\s*class\s+(\w+)\b/m);
  if (classMatch) {
    return { kind: "class_api", name: classMatch[1] };
  }

  return { kind: "unknown" };
}

function analyzeJavascriptStarter(code: string): JavascriptCallTarget {
  const stripped = stripJavascriptCommentsForSignatureSearch(code);
  const classMatch = stripped.match(/(?:^|\n)\s*class\s+(\w+)\b/);
  if (classMatch) {
    return { kind: "class_api", name: classMatch[1] };
  }

  const fnMatch =
    stripped.match(/(?:^|\n)\s*function\s+(\w+)\s*\(/) ??
    stripped.match(/(?:^|\n)\s*(?:const|let|var)\s+(\w+)\s*=/);
  if (fnMatch) {
    return { kind: "function", name: fnMatch[1] };
  }

  return { kind: "unknown" };
}

function buildPythonCallExpression(
  target: PythonCallTarget,
  args: string[]
): string | null {
  const callArgs = args.join(", ");

  if (target.kind === "solution_method") {
    return `Solution().${target.name}(${callArgs})`;
  }
  if (target.kind === "top_level_function") {
    return `${target.name}(${callArgs})`;
  }

  return null;
}

function buildJavascriptCallExpression(
  target: JavascriptCallTarget,
  args: string[]
): string | null {
  if (target.kind !== "function") {
    return null;
  }

  return `${target.name}(${args.join(", ")})`;
}

function getPythonHelpers(): string {
  return [
    "import json",
    "from collections import deque",
    "",
    "class ListNode:",
    "    def __init__(self, val=0, next=None):",
    "        self.val = val",
    "        self.next = next",
    "",
    "class TreeNode:",
    "    def __init__(self, val=0, left=None, right=None):",
    "        self.val = val",
    "        self.left = left",
    "        self.right = right",
    "",
    "class Node:",
    "    def __init__(self, val=0, neighbors=None):",
    "        self.val = val",
    "        self.neighbors = neighbors if neighbors is not None else []",
    "",
    "def _build_linked_list(values):",
    "    dummy = ListNode(0)",
    "    current = dummy",
    "    for value in values:",
    "        current.next = ListNode(value)",
    "        current = current.next",
    "    return dummy.next",
    "",
    "def _build_cycle_linked_list(values, pos):",
    "    if not values:",
    "        return None",
    "    nodes = [ListNode(value) for value in values]",
    "    for index in range(len(nodes) - 1):",
    "        nodes[index].next = nodes[index + 1]",
    "    if pos >= 0:",
    "        nodes[-1].next = nodes[pos]",
    "    return nodes[0]",
    "",
    "def _linked_list_to_array(head, limit=10000):",
    "    result = []",
    "    current = head",
    "    steps = 0",
    "    while current is not None and steps < limit:",
    "        result.append(current.val)",
    "        current = current.next",
    "        steps += 1",
    "    return result",
    "",
    "def _build_tree(values):",
    "    if not values:",
    "        return None",
    "    nodes = [None if value is None else TreeNode(value) for value in values]",
    "    child_index = 1",
    "    for node in nodes:",
    "        if node is None:",
    "            continue",
    "        if child_index < len(nodes):",
    "            node.left = nodes[child_index]",
    "            child_index += 1",
    "        if child_index < len(nodes):",
    "            node.right = nodes[child_index]",
    "            child_index += 1",
    "    return nodes[0]",
    "",
    "def _tree_to_array(root):",
    "    if root is None:",
    "        return []",
    "    result = []",
    "    queue = deque([root])",
    "    while queue:",
    "        node = queue.popleft()",
    "        if node is None:",
    "            result.append(None)",
    "            continue",
    "        result.append(node.val)",
    "        queue.append(node.left)",
    "        queue.append(node.right)",
    "    while result and result[-1] is None:",
    "        result.pop()",
    "    return result",
    "",
    "def _find_tree_node(root, target):",
    "    if root is None:",
    "        return None",
    "    stack = [root]",
    "    while stack:",
    "        node = stack.pop()",
    "        if node.val == target:",
    "            return node",
    "        if node.right is not None:",
    "            stack.append(node.right)",
    "        if node.left is not None:",
    "            stack.append(node.left)",
    "    return None",
    "",
    "def _build_graph(adj_list):",
    "    if not adj_list:",
    "        return None",
    "    nodes = [Node(index + 1) for index in range(len(adj_list))]",
    "    for index, neighbors in enumerate(adj_list):",
    "        nodes[index].neighbors = [nodes[value - 1] for value in neighbors]",
    "    return nodes[0]",
    "",
    "def _graph_to_adj_list(node):",
    "    if node is None:",
    "        return []",
    "    queue = deque([node])",
    "    seen = {node.val: node}",
    "    while queue:",
    "        current = queue.popleft()",
    "        for neighbor in current.neighbors:",
    "            if neighbor.val not in seen:",
    "                seen[neighbor.val] = neighbor",
    "                queue.append(neighbor)",
    "    result = [[] for _ in range(max(seen) if seen else 0)]",
    "    for value, current in seen.items():",
    "        result[value - 1] = sorted(neighbor.val for neighbor in current.neighbors)",
    "    return result",
  ].join("\n");
}

function getJavascriptHelpers(): string {
  return [
    "function ListNode(val, next) {",
    "  this.val = val === undefined ? 0 : val;",
    "  this.next = next === undefined ? null : next;",
    "}",
    "",
    "function TreeNode(val, left, right) {",
    "  this.val = val === undefined ? 0 : val;",
    "  this.left = left === undefined ? null : left;",
    "  this.right = right === undefined ? null : right;",
    "}",
    "",
    "function Node(val, neighbors) {",
    "  this.val = val === undefined ? 0 : val;",
    "  this.neighbors = neighbors === undefined ? [] : neighbors;",
    "}",
    "",
    "function buildLinkedList(values) {",
    "  const dummy = new ListNode(0);",
    "  let current = dummy;",
    "  for (const value of values) {",
    "    current.next = new ListNode(value);",
    "    current = current.next;",
    "  }",
    "  return dummy.next;",
    "}",
    "",
    "function buildCycleLinkedList(values, pos) {",
    "  if (!values.length) return null;",
    "  const nodes = values.map((value) => new ListNode(value));",
    "  for (let index = 0; index < nodes.length - 1; index += 1) {",
    "    nodes[index].next = nodes[index + 1];",
    "  }",
    "  if (pos >= 0) {",
    "    nodes[nodes.length - 1].next = nodes[pos];",
    "  }",
    "  return nodes[0];",
    "}",
    "",
    "function linkedListToArray(head, limit = 10000) {",
    "  const result = [];",
    "  let current = head;",
    "  let steps = 0;",
    "  while (current != null && steps < limit) {",
    "    result.push(current.val);",
    "    current = current.next;",
    "    steps += 1;",
    "  }",
    "  return result;",
    "}",
    "",
    "function buildTree(values) {",
    "  if (!values.length) return null;",
    "  const nodes = values.map((value) => (value === null ? null : new TreeNode(value)));",
    "  let childIndex = 1;",
    "  for (const node of nodes) {",
    "    if (node === null) continue;",
    "    if (childIndex < nodes.length) {",
    "      node.left = nodes[childIndex];",
    "      childIndex += 1;",
    "    }",
    "    if (childIndex < nodes.length) {",
    "      node.right = nodes[childIndex];",
    "      childIndex += 1;",
    "    }",
    "  }",
    "  return nodes[0];",
    "}",
    "",
    "function treeToArray(root) {",
    "  if (root == null) return [];",
    "  const result = [];",
    "  const queue = [root];",
    "  while (queue.length > 0) {",
    "    const node = queue.shift();",
    "    if (node == null) {",
      "      result.push(null);",
      "      continue;",
      "    }",
    "    result.push(node.val);",
    "    queue.push(node.left);",
    "    queue.push(node.right);",
    "  }",
    "  while (result.length > 0 && result[result.length - 1] === null) {",
    "    result.pop();",
    "  }",
    "  return result;",
    "}",
    "",
    "function findTreeNode(root, target) {",
    "  if (root == null) return null;",
    "  const stack = [root];",
    "  while (stack.length > 0) {",
    "    const node = stack.pop();",
    "    if (node.val === target) return node;",
    "    if (node.right !== null) stack.push(node.right);",
    "    if (node.left !== null) stack.push(node.left);",
    "  }",
    "  return null;",
    "}",
    "",
    "function buildGraph(adjList) {",
    "  if (!adjList.length) return null;",
    "  const nodes = adjList.map((_, index) => new Node(index + 1));",
    "  for (let index = 0; index < adjList.length; index += 1) {",
    "    nodes[index].neighbors = adjList[index].map((value) => nodes[value - 1]);",
    "  }",
    "  return nodes[0];",
    "}",
    "",
    "function graphToAdjList(node) {",
    "  if (node == null) return [];",
    "  const queue = [node];",
    "  const seen = new Map([[node.val, node]]);",
    "  while (queue.length > 0) {",
    "    const current = queue.shift();",
    "    for (const neighbor of current.neighbors) {",
    "      if (!seen.has(neighbor.val)) {",
    "        seen.set(neighbor.val, neighbor);",
    "        queue.push(neighbor);",
    "      }",
    "    }",
    "  }",
    "  const size = Math.max(...seen.keys());",
    "  const result = Array.from({ length: size }, () => []);",
    "  for (const [value, current] of seen.entries()) {",
    "    result[value - 1] = [...current.neighbors].map((neighbor) => neighbor.val).sort((left, right) => left - right);",
    "  }",
    "  return result;",
    "}",
  ].join("\n");
}

function buildPythonDriver(problemSlug: string | undefined, userCode: string, stdin: string): string | null {
  const target = analyzePythonStarter(userCode);
  const params = parseTestInput(stdin);
  const paramMap = new Map(params.map((param) => [param.name, normalizePythonArgument(param.value)]));

  if (problemSlug && CLASS_OPERATION_SLUGS.has(problemSlug)) {
    if (target.kind === "unknown") return null;
    const parsed = parseClassOperationInput(stdin);
    if (!parsed) return null;

    return [
      `__operations = ${toPythonLiteral(parsed.operations)}`,
      `__arguments = ${toPythonLiteral(parsed.args)}`,
      "__results = []",
      "__instance = None",
      "for __op, __args in zip(__operations, __arguments):",
      `    if __op == ${JSON.stringify(target.name)}:`,
      `        __instance = ${target.name}(*__args)`,
      "        __results.append(None)",
      "    else:",
      "        __value = getattr(__instance, __op)(*__args)",
      "        __results.append(__value)",
      "print(json.dumps(__results))",
    ].join("\n");
  }

  if (problemSlug && CODEC_SLUGS.has(problemSlug)) {
    if (target.kind !== "class_api") return null;
    const root = paramMap.get("root");
    if (!root) return null;

    return [
      `__root = _build_tree(${root})`,
      `__codec = ${target.name}()`,
      "__serialized = __codec.serialize(__root)",
      "__deserialized = __codec.deserialize(__serialized)",
      "print(json.dumps(_tree_to_array(__deserialized)))",
    ].join("\n");
  }

  if (problemSlug === "linked-list-cycle") {
    const callExpression = buildPythonCallExpression(target, [
      `_build_cycle_linked_list(${paramMap.get("head") ?? "[]" }, ${paramMap.get("pos") ?? "-1"})`,
    ]);
    if (!callExpression) return null;
    return [`__result = ${callExpression}`, "print(json.dumps(__result))"].join("\n");
  }

  if (problemSlug === "merge-k-sorted-lists") {
    const callExpression = buildPythonCallExpression(target, [
      `[ _build_linked_list(__values) for __values in ${paramMap.get("lists") ?? "[]"} ]`,
    ]);
    if (!callExpression) return null;
    return [`__result = ${callExpression}`, "print(json.dumps(_linked_list_to_array(__result)))"].join("\n");
  }

  if (problemSlug && LINKED_LIST_RETURN_SLUGS.has(problemSlug)) {
    const rawArgs = params.map((param) => {
      if (param.name === "head" || param.name === "list1" || param.name === "list2") {
        return `_build_linked_list(${normalizePythonArgument(param.value)})`;
      }
      return normalizePythonArgument(param.value);
    });
    const callExpression = buildPythonCallExpression(target, rawArgs);
    if (!callExpression) return null;
    return [`__result = ${callExpression}`, "print(json.dumps(_linked_list_to_array(__result)))"].join("\n");
  }

  if (problemSlug === "clone-graph") {
    const callExpression = buildPythonCallExpression(target, [
      `_build_graph(${paramMap.get("adjList") ?? "[]"})`,
    ]);
    if (!callExpression) return null;
    return [`__result = ${callExpression}`, "print(json.dumps(_graph_to_adj_list(__result)))"].join("\n");
  }

  if (problemSlug === "lowest-common-ancestor-bst") {
    const root = paramMap.get("root");
    const p = paramMap.get("p");
    const q = paramMap.get("q");
    if (!root || !p || !q) return null;
    const callExpression = buildPythonCallExpression(target, [
      "__root",
      `_find_tree_node(__root, ${p})`,
      `_find_tree_node(__root, ${q})`,
    ]);
    if (!callExpression) return null;
    return [
      `__root = _build_tree(${root})`,
      `__result = ${callExpression}`,
      "print(json.dumps(None if __result is None else __result.val))",
    ].join("\n");
  }

  if (problemSlug && TREE_INPUT_SLUGS.has(problemSlug)) {
    const rawArgs = params.map((param) =>
      param.name === "root"
        ? `_build_tree(${normalizePythonArgument(param.value)})`
        : normalizePythonArgument(param.value)
    );
    const callExpression = buildPythonCallExpression(target, rawArgs);
    if (!callExpression) return null;
    return [`__result = ${callExpression}`, "print(json.dumps(__result))"].join("\n");
  }

  const rawArgs = params.map((param) => normalizePythonArgument(param.value));
  const callExpression = buildPythonCallExpression(target, rawArgs);
  if (!callExpression) return null;
  return [`__result = ${callExpression}`, "print(json.dumps(__result))"].join("\n");
}

function buildJavascriptDriver(
  problemSlug: string | undefined,
  userCode: string,
  stdin: string
): string | null {
  const target = analyzeJavascriptStarter(userCode);
  const params = parseTestInput(stdin);
  const paramMap = new Map(params.map((param) => [param.name, param.value]));

  if (problemSlug && CLASS_OPERATION_SLUGS.has(problemSlug)) {
    if (target.kind === "unknown") return null;
    const parsed = parseClassOperationInput(stdin);
    if (!parsed) return null;

    return [
      `const __operations = ${JSON.stringify(parsed.operations)};`,
      `const __arguments = ${JSON.stringify(parsed.args)};`,
      "const __results = [];",
      "let __instance = null;",
      "for (let __index = 0; __index < __operations.length; __index += 1) {",
      "  const __op = __operations[__index];",
      "  const __args = __arguments[__index];",
      `  if (__op === ${JSON.stringify(target.name)}) {`,
      `    __instance = new ${target.name}(...__args);`,
      "    __results.push(null);",
      "  } else {",
      "    const __value = __instance[__op](...__args);",
      "    __results.push(__value ?? null);",
      "  }",
      "}",
      "console.log(JSON.stringify(__results));",
    ].join("\n");
  }

  if (problemSlug && CODEC_SLUGS.has(problemSlug)) {
    const root = paramMap.get("root");
    if (!root) return null;

    return [
      `const __root = buildTree(${root});`,
      "const __serialized = serialize(__root);",
      "const __deserialized = deserialize(__serialized);",
      "console.log(JSON.stringify(treeToArray(__deserialized)));",
    ].join("\n");
  }

  if (problemSlug === "linked-list-cycle") {
    const callExpression = buildJavascriptCallExpression(target, [
      `buildCycleLinkedList(${paramMap.get("head") ?? "[]"}, ${paramMap.get("pos") ?? "-1"})`,
    ]);
    if (!callExpression) return null;
    return [`const __result = ${callExpression};`, "console.log(JSON.stringify(__result));"].join("\n");
  }

  if (problemSlug === "merge-k-sorted-lists") {
    const callExpression = buildJavascriptCallExpression(target, [
      `(${paramMap.get("lists") ?? "[]"}).map((__values) => buildLinkedList(__values))`,
    ]);
    if (!callExpression) return null;
    return [
      `const __result = ${callExpression};`,
      "console.log(JSON.stringify(linkedListToArray(__result)));",
    ].join("\n");
  }

  if (problemSlug && LINKED_LIST_RETURN_SLUGS.has(problemSlug)) {
    const rawArgs = params.map((param) => {
      if (param.name === "head" || param.name === "list1" || param.name === "list2") {
        return `buildLinkedList(${param.value})`;
      }
      return param.value;
    });
    const callExpression = buildJavascriptCallExpression(target, rawArgs);
    if (!callExpression) return null;
    return [
      `const __result = ${callExpression};`,
      "console.log(JSON.stringify(linkedListToArray(__result)));",
    ].join("\n");
  }

  if (problemSlug === "clone-graph") {
    const callExpression = buildJavascriptCallExpression(target, [
      `buildGraph(${paramMap.get("adjList") ?? "[]"})`,
    ]);
    if (!callExpression) return null;
    return [`const __result = ${callExpression};`, "console.log(JSON.stringify(graphToAdjList(__result)));"].join("\n");
  }

  if (problemSlug === "lowest-common-ancestor-bst") {
    const root = paramMap.get("root");
    const p = paramMap.get("p");
    const q = paramMap.get("q");
    if (!root || !p || !q) return null;
    const callExpression = buildJavascriptCallExpression(target, [
      "__root",
      `findTreeNode(__root, ${p})`,
      `findTreeNode(__root, ${q})`,
    ]);
    if (!callExpression) return null;
    return [
      `const __root = buildTree(${root});`,
      `const __result = ${callExpression};`,
      "console.log(JSON.stringify(__result ? __result.val : null));",
    ].join("\n");
  }

  if (problemSlug && TREE_INPUT_SLUGS.has(problemSlug)) {
    const rawArgs = params.map((param) =>
      param.name === "root" ? `buildTree(${param.value})` : param.value
    );
    const callExpression = buildJavascriptCallExpression(target, rawArgs);
    if (!callExpression) return null;
    return [`const __result = ${callExpression};`, "console.log(JSON.stringify(__result));"].join("\n");
  }

  const rawArgs = params.map((param) => param.value);
  const callExpression = buildJavascriptCallExpression(target, rawArgs);
  if (!callExpression) return null;
  return [`const __result = ${callExpression};`, "console.log(JSON.stringify(__result));"].join("\n");
}

export function wrapCodeForExecution(options: {
  language: string;
  userCode: string;
  stdin: string;
  problemSlug?: string;
}): { code: string; stdin: string } {
  const { language, problemSlug, stdin } = options;
  let { userCode } = options;

  if (language === "python") {
    userCode = ensurePythonDeferredAnnotations(userCode);
    const driver = buildPythonDriver(problemSlug, userCode, stdin);
    if (!driver) {
      return { code: userCode, stdin: "" };
    }

    return {
      code: `${userCode}\n\n${getPythonHelpers()}\n\n${driver}`,
      stdin: "",
    };
  }

  if (language === "javascript") {
    const driver = buildJavascriptDriver(problemSlug, userCode, stdin);
    if (!driver) {
      return { code: userCode, stdin: "" };
    }

    return {
      code: `${userCode}\n\n${getJavascriptHelpers()}\n\n${driver}`,
      stdin: "",
    };
  }

  return { code: userCode, stdin: "" };
}

function normalizeOutputString(value: string): string {
  return value.trim().replace(/\s+/g, " ").replace(/,\s*/g, ", ");
}

function tryParseJson(value: string): unknown | undefined {
  try {
    return JSON.parse(value.trim());
  } catch {
    return undefined;
  }
}

function compareScalars(left: unknown, right: unknown): number {
  const leftText = JSON.stringify(left);
  const rightText = JSON.stringify(right);
  return leftText.localeCompare(rightText);
}

function sortByJson<T>(values: T[]): T[] {
  return [...values].sort(compareScalars);
}

function canonicalizeValue(value: unknown, mode: ComparisonMode): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  if (mode === "sort-flat" || mode === "sort-outer") {
    return sortByJson(value);
  }

  if (mode === "sort-inner-and-outer") {
    return sortByJson(
      value.map((item) => (Array.isArray(item) ? sortByJson(item) : item))
    );
  }

  return value;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getInputParamValue(input: string, name: string): unknown | undefined {
  const params = parseTestInput(input);
  const param = params.find((item) => item.name === name);
  if (!param) return undefined;
  return tryParseJson(param.value);
}

function isPalindrome(value: string): boolean {
  return value === value.split("").reverse().join("");
}

function isPeakIndex(nums: number[], index: number): boolean {
  if (!Number.isInteger(index) || index < 0 || index >= nums.length) {
    return false;
  }

  const left = index === 0 ? Number.NEGATIVE_INFINITY : nums[index - 1];
  const right = index === nums.length - 1 ? Number.NEGATIVE_INFINITY : nums[index + 1];
  return nums[index] > left && nums[index] > right;
}

function isValidReorganizedString(input: string, candidate: string): boolean {
  if (candidate.length !== input.length) return false;

  const counts = new Map<string, number>();
  for (const char of input) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }

  for (let index = 0; index < candidate.length; index += 1) {
    const char = candidate[index];
    const next = index + 1 < candidate.length ? candidate[index + 1] : null;
    const currentCount = counts.get(char) ?? 0;
    if (currentCount <= 0) return false;
    counts.set(char, currentCount - 1);
    if (next !== null && char === next) return false;
  }

  return [...counts.values()].every((count) => count === 0);
}

function compareFlexibleOutput(
  mode: ComparisonMode,
  actual: string,
  expected: string,
  input?: string
): { passed: boolean; actualDisplay: string; expectedDisplay: string } | null {
  if (mode === "peak-index") {
    const actualValue = tryParseJson(actual);
    const expectedValue = normalizeOutputString(expected);
    const nums = getInputParamValue(input ?? "", "nums");
    if (!Array.isArray(nums) || typeof actualValue !== "number") {
      return null;
    }
    return {
      passed: isPeakIndex(nums as number[], actualValue),
      actualDisplay: JSON.stringify(actualValue),
      expectedDisplay: expectedValue,
    };
  }

  if (mode === "longest-palindrome") {
    const actualValue = tryParseJson(actual);
    const expectedValue = tryParseJson(expected);
    const inputValue = getInputParamValue(input ?? "", "s");
    if (
      typeof actualValue !== "string" ||
      typeof expectedValue !== "string" ||
      typeof inputValue !== "string"
    ) {
      return null;
    }
    const passed =
      actualValue.length === expectedValue.length &&
      isPalindrome(actualValue) &&
      inputValue.includes(actualValue);
    return {
      passed,
      actualDisplay: JSON.stringify(actualValue),
      expectedDisplay: JSON.stringify(expectedValue),
    };
  }

  if (mode === "reorganize-string") {
    const actualValue = tryParseJson(actual);
    const expectedValue = tryParseJson(expected);
    const inputValue = getInputParamValue(input ?? "", "s");
    if (
      typeof actualValue !== "string" ||
      typeof expectedValue !== "string" ||
      typeof inputValue !== "string"
    ) {
      return null;
    }
    const passed =
      expectedValue === ""
        ? actualValue === ""
        : actualValue !== "" && isValidReorganizedString(inputValue, actualValue);
    return {
      passed,
      actualDisplay: JSON.stringify(actualValue),
      expectedDisplay: JSON.stringify(expectedValue),
    };
  }

  return null;
}

export function compareProblemOutputs(options: {
  actual: string;
  expected: string;
  input?: string;
  problemSlug?: string;
}): { passed: boolean; actualDisplay: string; expectedDisplay: string } {
  const { actual, expected, input, problemSlug } = options;
  const trimmedActual = actual.trim();
  const trimmedExpected = expected.trim();
  const mode = problemSlug ? COMPARISON_MODES[problemSlug] ?? "default" : "default";

  const flexibleResult = compareFlexibleOutput(mode, trimmedActual, trimmedExpected, input);
  if (flexibleResult) {
    return flexibleResult;
  }

  const actualJson = tryParseJson(trimmedActual);
  const expectedJson = tryParseJson(trimmedExpected);
  if (actualJson !== undefined && expectedJson !== undefined) {
    const canonicalActual = canonicalizeValue(actualJson, mode);
    const canonicalExpected = canonicalizeValue(expectedJson, mode);
    return {
      passed: deepEqual(canonicalActual, canonicalExpected),
      actualDisplay: JSON.stringify(canonicalActual),
      expectedDisplay: JSON.stringify(canonicalExpected),
    };
  }

  const actualDisplay = normalizeOutputString(trimmedActual);
  const expectedDisplay = normalizeOutputString(trimmedExpected);
  return {
    passed: actualDisplay === expectedDisplay,
    actualDisplay,
    expectedDisplay,
  };
}

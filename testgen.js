const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { ChatOllama } = require("@langchain/ollama");
const { StateGraph, END, Annotation } = require("@langchain/langgraph");

// ✅ LLM connection (Ollama)
const model = new ChatOllama({
  baseUrl: "http://localhost:11434",
  model: "codellama:7b-instruct-q4_K_M",
});

// ✅ StateGraph schema
const StateAnnotation = Annotation.Root({
  files: Annotation(),
  index: Annotation(),
  code: Annotation(),
  filename: Annotation(),
  functions: Annotation(),
  tests: Annotation(),
});

// ----------------------------
// 🔹 Utility: recursively find .js files
// ----------------------------
function findAllJsFiles(dir, allFiles = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "__tests__") continue; // skip test folders
      findAllJsFiles(fullPath, allFiles);
    } else if (
      entry.isFile() &&
      entry.name.endsWith(".js") &&
      !entry.name.endsWith(".test.js") &&
      !entry.name.endsWith(".spec.js") &&
      entry.name !== "testgen.js"
    ) {
      allFiles.push(fullPath);
    }
  }
  return allFiles;
}

// ----------------------------
// 🔹 Step 0: Detect target files
// ----------------------------
async function getAllFiles(state) {
  const projectRoot = process.cwd();
  const files = findAllJsFiles(projectRoot);

  if (files.length === 0) {
    console.log("⚠️ No source .js files found.");
    return { files: [], index: 0, filename: null };
  }

  console.log("📂 Files detected:", files);
  return { files, index: 0, filename: files[0] };
}

// ----------------------------
// 🔹 Step 1: Extract Code
// ----------------------------
async function extractCode(state) {
  const filename = state.filename;
  if (!filename) return { code: null, filename: null };

  const code = fs.readFileSync(filename, "utf-8");
  return { code, filename };
}

// ----------------------------
// 🔹 Step 2: Extract Functions (JS only for now)
// ----------------------------
// async function extractFunctions(state) {
//   const { filename, code } = state;
//   if (!code || !filename) return { functions: [] };

//   const functionRegex =
//     /function\s+([a-zA-Z0-9_]+)|const\s+([a-zA-Z0-9_]+)\s*=\s*\(/g;

//   const functions = [];
//   let match;
//   while ((match = functionRegex.exec(code)) !== null) {
//     const name = match[1] || match[2];
//     if (name) functions.push(name);
//   }

//   const unique = [...new Set(functions)];
//   console.log("🔍 Functions extracted from", filename, ":", unique);
//   return { functions: unique };
// }

// ----------------------------
// 🔹 Step 3: Generate Tests
// ----------------------------
async function generateTests(state) {
  if (!state.code || !state.functions.length) return { tests: "" };

  const filename = path.basename(state.filename).replace(".js", "");
  const functions = state.functions;

  const prompt = `
You are a professional test case generator.
Generate comprehensive Jest unit tests ONLY for these functions in ${filename}:
${functions}

Code:
${state.code}

Rules:
- Output runnable Jest code only.
- No explanation markdown.
- Overwrite previous tests (do NOT keep tests for deleted functions).
- Import from "../${filename}".
- Cover edge cases and input variations.
`;

  const result = await model.invoke(prompt);
  return { tests: result.content };
}

// ----------------------------
// 🔹 Step 4: Save Tests
// ----------------------------
async function saveTests(state) {
  if (!state.tests || !state.filename) return {};

  const filename = path.basename(state.filename).replace(".js", "");
  const testsDir = path.join(path.dirname(state.filename), "__tests__");
  fs.mkdirSync(testsDir, { recursive: true });

  const filepath = path.join(testsDir, `${filename}.test.js`);
  fs.writeFileSync(filepath, state.tests, "utf-8");

  console.log(`✅ Tests saved (clean overwrite) at ${filepath}`);
  return {};
}

// ----------------------------
// 🔹 Step 5: Next file
// ----------------------------
async function nextFile(state) {
  const index = state.index + 1;
  if (index < state.files.length) {
    const filename = state.files[index];
    console.log(`➡️ Next file: ${filename}`);
    return { index, filename };
  } else {
    console.log("🏁 All files processed, stopping graph.");
    return { filename: null, index };
  }
}

// ----------------------------
// 🔹 LangGraph wiring
// ----------------------------
const graph = new StateGraph(StateAnnotation);
graph.addNode("getAllFiles", getAllFiles);
graph.addNode("extract", extractCode);
// graph.addNode("extractFunctions", extractFunctions);
graph.addNode("generate", generateTests);
graph.addNode("save", saveTests);
graph.addNode("next", nextFile);

graph.setEntryPoint("getAllFiles");
graph.addEdge("getAllFiles", "generate");
// graph.addEdge("extract", "extractFunctions");
// graph.addEdge("extractFunctions", "generate");
graph.addEdge("generate", "save");
graph.addEdge("save", "next");
graph.addConditionalEdges("next", (state) => {
  return state.filename ? "extract" : END;
});

const app = graph.compile();

// 🚀 Run
(async () => {
  await app.invoke({});
})();

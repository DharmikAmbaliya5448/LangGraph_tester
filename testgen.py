from langgraph.graph import StateGraph, END
from langchain_ollama import ChatOllama
import os
import subprocess

# ✅ LLM connection
model = ChatOllama(base_url="http://localhost:11434", model="codellama:7b-instruct-q4_K_M")

# ✅ State structure
class State(dict):
    code: str
    filename: str
    tests: str

# Node 0: Detect changed JS files using git diff
def git_diff_files(state: State):
    try:
        # Detect changed files (last commit vs working tree)
        result = subprocess.check_output(
            ["git", "diff", "--name-only", "HEAD"],
            universal_newlines=True
        )
        files = [f.strip() for f in result.splitlines() if f.strip().endswith(".js")]

        if not files:
            print("⚠️ No JS file changes detected.")
            return {"filename": None}

        # Pick first changed file (or extend to loop later)
        filename = files[0]
        print(f"📂 Changed file detected: {filename}")
        return {"filename": filename}

    except subprocess.CalledProcessError as e:
        print("❌ Error detecting git diff:", e)
        return {"filename": None}

# Node 1: Extract Code
def extract_code(state: State):
    filename = state["filename"]
    if not filename:
        return {"code": None, "filename": None}

    with open(filename, "r") as f:
        code = f.read()
    return {"code": code, "filename": filename}

# Node 2: Generate Unit Tests
def generate_tests(state: State):
    if not state["code"]:
        return {"tests": ""}

    code = state["code"]
    filename = os.path.basename(state["filename"]).replace(".js", "")
    prompt = f"""
    You are a professional test case generator.
    Write comprehensive Jest unit tests for the following JavaScript function:

    {code}

    Constraints:
    - Only output runnable Jest code (no explanations).
    - Cover all the edge cases and Cover all posibility of inputs.
    - Import from "../{filename}".
    """
    result = model.invoke(prompt)
    return {"tests": result.content}

# Node 3: Save to file
def save_tests(state: State):
    if not state["tests"] or not state["filename"]:
        return {}

    filename = os.path.basename(state["filename"]).replace(".js", "")
    tests_dir = os.path.join(os.path.dirname(state["filename"]), "__tests__")
    os.makedirs(tests_dir, exist_ok=True)
    filepath = os.path.join(tests_dir, f"{filename}.test.js")

    with open(filepath, "w") as f:
        f.write(state["tests"])

    print(f"✅ Tests saved at {filepath}")
    return {}

# ✅ Define graph
graph = StateGraph(State)
graph.add_node("gitdiff", git_diff_files)
graph.add_node("extract", extract_code)
graph.add_node("generate", generate_tests)
graph.add_node("save", save_tests)

graph.set_entry_point("gitdiff")
graph.add_edge("gitdiff", "extract")
graph.add_edge("extract", "generate")
graph.add_edge("generate", "save")
graph.add_edge("save", END)

app = graph.compile()

# 🚀 Run
app.invoke({})

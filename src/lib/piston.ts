type ExecutionResult = {
  stdout: string;
  stderr: string;
  exit_code: number;
  runtime_ms: number;
};

const WANDBOX_COMPILERS: Record<string, string> = {
  python: "cpython-3.10.15",
  javascript: "nodejs-18.20.4",
};

export async function executeCode(
  language: string,
  _version: string,
  code: string,
  stdin?: string
): Promise<ExecutionResult> {
  // Primary: Wandbox API (free, no auth required)
  const compiler = WANDBOX_COMPILERS[language];
  if (compiler) {
    const res = await fetch("https://wandbox.org/api/compile.json", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        compiler,
        code,
        stdin: stdin || "",
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`Wandbox error: ${res.statusText}`);
    }

    const data = await res.json();
    const exitCode = data.status === "0" || data.status === 0 ? 0 : 1;

    return {
      stdout: data.program_output || "",
      stderr: data.compiler_error || data.program_error || "",
      exit_code: exitCode,
      runtime_ms: 0,
    };
  }

  // Fallback: Piston API (for self-hosted or whitelisted instances)
  const pistonUrl = process.env.PISTON_API_URL;
  if (pistonUrl && pistonUrl !== "https://emkc.org/api/v2/piston") {
    const res = await fetch(`${pistonUrl}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        version: _version,
        files: [{ content: code }],
        stdin: stdin || "",
        run_timeout: 10000,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) throw new Error(`Piston error: ${res.statusText}`);

    const data = await res.json();
    return {
      stdout: data.run?.stdout || "",
      stderr: data.run?.stderr || data.compile?.stderr || "",
      exit_code: data.run?.code ?? 1,
      runtime_ms: 0,
    };
  }

  throw new Error(`No code execution backend available for language: ${language}`);
}

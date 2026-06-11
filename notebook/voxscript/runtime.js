/* =====================================================
   HUNA7-OS — VOXSCRIPT: RUNTIME
   Execution environment. Pipelines source → result.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.VoxScript = Huna7.VoxScript || {};

Huna7.VoxScript.Runtime = (() => {
  // Run VoxScript source code string
  const run = async (source, { pid = null, outputFn = null } = {}) => {
    const output = outputFn || ((s) => console.log('[VoxScript]', s));
    const result = { success: false, output: [], errors: [] };
    const lines = [];
    const captureOutput = (s) => { lines.push(s); output(s); };

    try {
      // Stage 1: Tokenize
      const tokens = Huna7.VoxScript.Alphabet.tokenize(source);

      // Stage 2: Parse
      const ast = Huna7.VoxScript.Grammar.parse(tokens);

      // Stage 3: Compile to bytecode
      const bytecode = Huna7.VoxScript.Translator.compile(ast);

      // Stage 4: Build API
      const api = Huna7.VoxScript.StandardBook.buildAPI(pid, captureOutput);

      // Stage 5: Execute in VM
      const vm = new Huna7.VoxScript.Machine.VM(api, captureOutput, 200000);
      await vm.run(bytecode);

      result.success = true;
    } catch (e) {
      if (e.message === '__EXIT__') {
        result.success = true;
        captureOutput('[exit]');
      } else {
        result.errors.push(e.message);
        captureOutput('[Error] ' + e.message);
      }
    }

    result.output = lines;
    return result;
  };

  // Run a .pencil file from the VFS
  const runFile = async (path, options = {}) => {
    try {
      const entry = await Huna7.VFS.readFile(path);
      return run(entry.content, options);
    } catch (e) {
      return { success: false, output: [], errors: [`File not found: ${path}`] };
    }
  };

  // Validate syntax without executing
  const validate = (source) => {
    try {
      const tokens = Huna7.VoxScript.Alphabet.tokenize(source);
      Huna7.VoxScript.Grammar.parse(tokens);
      return { valid: true, errors: [] };
    } catch (e) {
      return { valid: false, errors: [e.message] };
    }
  };

  // Get token stream (for syntax highlighting)
  const tokenize = (source) => {
    try { return Huna7.VoxScript.Alphabet.tokenize(source); }
    catch { return []; }
  };

  // Get AST (for debugging)
  const getAST = (source) => {
    try {
      const tokens = Huna7.VoxScript.Alphabet.tokenize(source);
      return Huna7.VoxScript.Grammar.parse(tokens);
    } catch (e) {
      return null;
    }
  };

  return { run, runFile, validate, tokenize, getAST };
})();

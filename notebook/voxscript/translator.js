/* =====================================================
   HUNA7-OS — VOXSCRIPT: TRANSLATOR
   Compiler. Walks AST and emits bytecode instructions.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.VoxScript = Huna7.VoxScript || {};

Huna7.VoxScript.Translator = (() => {
  // Bytecode opcodes
  const OP = {
    PUSH: 'PUSH', POP: 'POP', DUP: 'DUP',
    LOAD: 'LOAD', STORE: 'STORE', LOAD_GLOBAL: 'LOAD_GLOBAL',
    ADD: 'ADD', SUB: 'SUB', MUL: 'MUL', DIV: 'DIV', MOD: 'MOD',
    NEG: 'NEG', NOT: 'NOT',
    EQ: 'EQ', NEQ: 'NEQ', LT: 'LT', GT: 'GT', LTE: 'LTE', GTE: 'GTE',
    AND: 'AND', OR: 'OR',
    JUMP: 'JUMP', JUMP_IF_FALSE: 'JUMP_IF_FALSE', JUMP_IF_TRUE: 'JUMP_IF_TRUE',
    CALL: 'CALL', CALL_METHOD: 'CALL_METHOD', RETURN: 'RETURN',
    GET_PROP: 'GET_PROP', SET_PROP: 'SET_PROP', GET_INDEX: 'GET_INDEX',
    MAKE_ARRAY: 'MAKE_ARRAY', MAKE_OBJECT: 'MAKE_OBJECT',
    MAKE_FUNC: 'MAKE_FUNC', MAKE_ARROW: 'MAKE_ARROW',
    THROW: 'THROW', TRY_START: 'TRY_START', TRY_END: 'TRY_END', CATCH: 'CATCH',
    ITER_INIT: 'ITER_INIT', ITER_NEXT: 'ITER_NEXT', ITER_END: 'ITER_END',
    BACKGROUND: 'BACKGROUND', HALT: 'HALT', NOP: 'NOP',
    CONCAT: 'CONCAT', TYPEOF: 'TYPEOF',
  };

  class Compiler {
    constructor() {
      this.instructions = [];
      this.constants = [];
      this.labels = new Map();
      this._labelCounter = 0;
      this._loops = [];
    }

    emit(op, arg = null) {
      this.instructions.push({ op, arg, pos: this.instructions.length });
      return this.instructions.length - 1;
    }

    newLabel() { return `L${this._labelCounter++}`; }
    markLabel(label) { this.labels.set(label, this.instructions.length); }
    emitJump(op, label) { return this.emit(op, label); }

    addConstant(val) {
      const idx = this.constants.indexOf(val);
      if (idx >= 0) return idx;
      this.constants.push(val);
      return this.constants.length - 1;
    }

    compile(node) {
      if (!node) return;
      const method = `compile_${node.nodeType}`;
      if (typeof this[method] === 'function') return this[method](node);
      throw new Error(`[Translator] Unknown node type: ${node.nodeType}`);
    }

    compile_Program(node) { node.body.forEach(s => this.compile(s)); this.emit(OP.HALT); }
    compile_Block(node) { node.body.forEach(s => this.compile(s)); }

    compile_NumberLiteral(node) { this.emit(OP.PUSH, node.value); }
    compile_StringLiteral(node) { this.emit(OP.PUSH, node.value); }
    compile_BoolLiteral(node) { this.emit(OP.PUSH, node.value); }
    compile_NullLiteral()      { this.emit(OP.PUSH, null); }
    compile_Identifier(node)   { this.emit(OP.LOAD, node.name); }

    compile_VarDecl(node) {
      this.compile(node.value);
      this.emit(OP.STORE, node.name);
    }

    compile_Assignment(node) {
      this.compile(node.value);
      if (node.target.nodeType === 'Identifier') {
        this.emit(OP.DUP);
        this.emit(OP.STORE, node.target.name);
      } else if (node.target.nodeType === 'MemberAccess') {
        this.compile(node.target.object);
        this.emit(OP.SET_PROP, node.target.property);
      }
    }

    compile_BinaryOp(node) {
      if (node.op === '+') {
        this.compile(node.left);
        this.compile(node.right);
        this.emit(OP.CONCAT); // handles both string concat and addition
        return;
      }
      this.compile(node.left);
      this.compile(node.right);
      const opMap = { '-': OP.SUB, '*': OP.MUL, '/': OP.DIV, '%': OP.MOD,
        '==': OP.EQ, '!=': OP.NEQ, '<': OP.LT, '>': OP.GT, '<=': OP.LTE, '>=': OP.GTE };
      this.emit(opMap[node.op]);
    }

    compile_UnaryOp(node) {
      this.compile(node.operand);
      if (node.op === '-') this.emit(OP.NEG);
      if (node.op === '!') this.emit(OP.NOT);
    }

    compile_LogicalOp(node) {
      this.compile(node.left);
      this.compile(node.right);
      if (node.op === '&&') this.emit(OP.AND);
      if (node.op === '||') this.emit(OP.OR);
    }

    compile_MemberAccess(node) {
      this.compile(node.object);
      this.emit(OP.GET_PROP, node.property);
    }

    compile_IndexAccess(node) {
      this.compile(node.object);
      this.compile(node.index);
      this.emit(OP.GET_INDEX);
    }

    compile_ArrayLiteral(node) {
      node.elements.forEach(e => this.compile(e));
      this.emit(OP.MAKE_ARRAY, node.elements.length);
    }

    compile_ObjectLiteral(node) {
      node.properties.forEach(p => { this.emit(OP.PUSH, p.key); this.compile(p.value); });
      this.emit(OP.MAKE_OBJECT, node.properties.length);
    }

    compile_Call(node) {
      if (node.callee.nodeType === 'MemberAccess') {
        this.compile(node.callee.object);
        node.args.forEach(a => this.compile(a));
        this.emit(OP.CALL_METHOD, { method: node.callee.property, arity: node.args.length });
      } else {
        this.compile(node.callee);
        node.args.forEach(a => this.compile(a));
        this.emit(OP.CALL, node.args.length);
      }
    }

    compile_FnDecl(node) {
      const fnCompiler = new Compiler();
      node.body.body.forEach(s => fnCompiler.compile(s));
      fnCompiler.emit(OP.PUSH, null);
      fnCompiler.emit(OP.RETURN);
      this.emit(OP.MAKE_FUNC, { name: node.name, params: node.params, code: fnCompiler.instructions, constants: fnCompiler.constants });
      this.emit(OP.STORE, node.name);
    }

    compile_ArrowFn(node) {
      const fnCompiler = new Compiler();
      if (node.body.nodeType === 'Block') node.body.body.forEach(s => fnCompiler.compile(s));
      else { fnCompiler.compile(node.body); fnCompiler.emit(OP.RETURN); }
      fnCompiler.emit(OP.PUSH, null);
      fnCompiler.emit(OP.RETURN);
      this.emit(OP.MAKE_ARROW, { params: node.params, code: fnCompiler.instructions, constants: fnCompiler.constants });
    }

    compile_ReturnStatement(node) {
      this.compile(node.value);
      this.emit(OP.RETURN);
    }

    compile_IfStatement(node) {
      this.compile(node.condition);
      const elseLbl = this.newLabel();
      const endLbl = this.newLabel();
      this.emitJump(OP.JUMP_IF_FALSE, elseLbl);
      this.compile(node.consequent);
      if (node.alternate) {
        this.emitJump(OP.JUMP, endLbl);
        this.markLabel(elseLbl);
        this.compile(node.alternate);
        this.markLabel(endLbl);
      } else {
        this.markLabel(elseLbl);
      }
    }

    compile_WhileLoop(node) {
      const startLbl = this.newLabel();
      const endLbl = this.newLabel();
      this._loops.push({ startLbl, endLbl });
      this.markLabel(startLbl);
      this.compile(node.condition);
      this.emitJump(OP.JUMP_IF_FALSE, endLbl);
      this.compile(node.body);
      this.emitJump(OP.JUMP, startLbl);
      this.markLabel(endLbl);
      this._loops.pop();
    }

    compile_ForIn(node) {
      const endLbl = this.newLabel();
      this.compile(node.iterable);
      this.emit(OP.ITER_INIT);
      const loopLbl = this.newLabel();
      this._loops.push({ startLbl: loopLbl, endLbl });
      this.markLabel(loopLbl);
      this.emit(OP.ITER_NEXT, { varName: node.variable, endLabel: endLbl });
      this.compile(node.body);
      this.emitJump(OP.JUMP, loopLbl);
      this.markLabel(endLbl);
      this.emit(OP.ITER_END);
      this._loops.pop();
    }

    compile_BreakStatement() { if (this._loops.length) this.emitJump(OP.JUMP, this._loops[this._loops.length-1].endLbl); }
    compile_ContinueStatement() { if (this._loops.length) this.emitJump(OP.JUMP, this._loops[this._loops.length-1].startLbl); }

    compile_TryCatch(node) {
      const catchLbl = this.newLabel();
      const endLbl = this.newLabel();
      this.emit(OP.TRY_START, { catchLabel: catchLbl, catchVar: node.catchVar });
      this.compile(node.tryBody);
      this.emit(OP.TRY_END);
      this.emitJump(OP.JUMP, endLbl);
      this.markLabel(catchLbl);
      this.emit(OP.CATCH, node.catchVar);
      this.compile(node.catchBody);
      this.markLabel(endLbl);
    }

    compile_ThrowStatement(node) { this.compile(node.value); this.emit(OP.THROW); }

    compile_Background(node) {
      const fnCompiler = new Compiler();
      node.body.body.forEach(s => fnCompiler.compile(s));
      fnCompiler.emit(OP.HALT);
      this.emit(OP.BACKGROUND, { code: fnCompiler.instructions, constants: fnCompiler.constants });
    }

    compile_Comment() { this.emit(OP.NOP); }

    finalize() {
      // Resolve all label references
      for (const instr of this.instructions) {
        if (typeof instr.arg === 'string' && this.labels.has(instr.arg)) {
          instr.arg = this.labels.get(instr.arg);
        }
        if (instr.arg && typeof instr.arg === 'object') {
          if (instr.arg.catchLabel && this.labels.has(instr.arg.catchLabel))
            instr.arg.catchLabel = this.labels.get(instr.arg.catchLabel);
          if (instr.arg.endLabel && this.labels.has(instr.arg.endLabel))
            instr.arg.endLabel = this.labels.get(instr.arg.endLabel);
        }
      }
      return { instructions: this.instructions, constants: this.constants };
    }
  }

  const compile = (ast) => {
    const c = new Compiler();
    c.compile(ast);
    return c.finalize();
  };

  return { compile, OP };
})();

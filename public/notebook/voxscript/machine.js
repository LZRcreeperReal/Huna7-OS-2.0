/* =====================================================
   HUNA7-OS — VOXSCRIPT: MACHINE
   Virtual Machine. Executes VoxScript bytecode.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.VoxScript = Huna7.VoxScript || {};

Huna7.VoxScript.Machine = (() => {
  const OP = () => Huna7.VoxScript.Translator.OP;

  // VoxScript function object
  class VoxFn {
    constructor(name, params, code, constants, closure) {
      this.name = name; this.params = params;
      this.code = code; this.constants = constants;
      this.closure = closure;
    }
  }

  // VoxScript iterator wrapper
  class VoxIter {
    constructor(arr) { this.arr = Array.isArray(arr) ? arr : Object.values(arr || {}); this.i = 0; }
    hasNext() { return this.i < this.arr.length; }
    next() { return this.arr[this.i++]; }
  }

  // Execution frame
  class Frame {
    constructor(code, constants, closure = null) {
      this.code = code; this.constants = constants;
      this.locals = closure ? Object.create(closure) : {};
      this.ip = 0; this.stack = [];
    }
    push(v) { this.stack.push(v); }
    pop() { return this.stack.pop(); }
    peek(offset = 0) { return this.stack[this.stack.length - 1 - offset]; }
    instr() { return this.code[this.ip]; }
    advance() { return this.code[this.ip++]; }
  }

  class VM {
    constructor(api, output, maxOps = 100000) {
      this.api = api;
      this.output = output; // fn(str) for print/log
      this.maxOps = maxOps;
      this.ops = 0;
      this.callStack = [];
      this.tryStack = [];
      this.halted = false;
      this._iterators = [];
    }

    run(bytecode) {
      const frame = new Frame(bytecode.instructions, bytecode.constants, this.api._globals);
      this.callStack.push(frame);
      return this._execute();
    }

    async _execute() {
      while (this.callStack.length > 0 && !this.halted) {
        const frame = this.callStack[this.callStack.length - 1];
        if (frame.ip >= frame.code.length) { this.callStack.pop(); continue; }

        const instr = frame.advance();
        this.ops++;
        if (this.ops > this.maxOps) throw new Error('Runtime error: max operation limit exceeded');

        try { await this._step(frame, instr); }
        catch (e) {
          if (!this._handleError(frame, e)) throw e;
        }
      }
    }

    async _step(frame, instr) {
      const op = OP();
      switch (instr.op) {
        case op.PUSH: frame.push(instr.arg); break;
        case op.POP: frame.pop(); break;
        case op.DUP: frame.push(frame.peek()); break;
        case op.NOP: break;
        case op.HALT: this.halted = true; break;

        case op.LOAD: {
          let scope = frame.locals;
          if (scope[instr.arg] !== undefined) { frame.push(scope[instr.arg]); break; }
          const apiVal = this._lookupAPI(instr.arg);
          if (apiVal !== undefined) { frame.push(apiVal); break; }
          throw new ReferenceError(`Undefined variable: ${instr.arg}`);
        }

        case op.STORE: frame.locals[instr.arg] = frame.pop(); break;

        case op.CONCAT: {
          const b = frame.pop(), a = frame.pop();
          if (typeof a === 'number' && typeof b === 'number') frame.push(a + b);
          else frame.push(String(a ?? '') + String(b ?? ''));
          break;
        }

        case op.ADD: { const b=frame.pop(),a=frame.pop(); frame.push(a+b); break; }
        case op.SUB: { const b=frame.pop(),a=frame.pop(); frame.push(a-b); break; }
        case op.MUL: { const b=frame.pop(),a=frame.pop(); frame.push(a*b); break; }
        case op.DIV: { const b=frame.pop(),a=frame.pop(); if(b===0) throw new Error('Division by zero'); frame.push(a/b); break; }
        case op.MOD: { const b=frame.pop(),a=frame.pop(); frame.push(a%b); break; }
        case op.NEG: frame.push(-frame.pop()); break;
        case op.NOT: frame.push(!frame.pop()); break;

        case op.EQ:  { const b=frame.pop(),a=frame.pop(); frame.push(a===b); break; }
        case op.NEQ: { const b=frame.pop(),a=frame.pop(); frame.push(a!==b); break; }
        case op.LT:  { const b=frame.pop(),a=frame.pop(); frame.push(a<b); break; }
        case op.GT:  { const b=frame.pop(),a=frame.pop(); frame.push(a>b); break; }
        case op.LTE: { const b=frame.pop(),a=frame.pop(); frame.push(a<=b); break; }
        case op.GTE: { const b=frame.pop(),a=frame.pop(); frame.push(a>=b); break; }
        case op.AND: { const b=frame.pop(),a=frame.pop(); frame.push(a&&b); break; }
        case op.OR:  { const b=frame.pop(),a=frame.pop(); frame.push(a||b); break; }

        case op.JUMP: frame.ip = instr.arg; break;
        case op.JUMP_IF_FALSE: { if (!frame.pop()) frame.ip = instr.arg; break; }
        case op.JUMP_IF_TRUE:  { if (frame.pop()) frame.ip = instr.arg; break; }

        case op.GET_PROP: {
          const obj = frame.pop();
          if (obj === null || obj === undefined) throw new Error(`Cannot access '${instr.arg}' of null`);
          frame.push(obj[instr.arg] ?? null);
          break;
        }
        case op.SET_PROP: {
          const val = frame.pop(), obj = frame.pop();
          if (obj && typeof obj === 'object') obj[instr.arg] = val;
          frame.push(val);
          break;
        }
        case op.SET_INDEX: {
          const val = frame.pop(), idx = frame.pop(), obj = frame.pop();
          if (obj && typeof obj === 'object') obj[idx] = val;
          frame.push(val);
          break;
        }
        case op.GET_INDEX: {
          const idx = frame.pop(), obj = frame.pop();
          frame.push(Array.isArray(obj) ? obj[idx] : (obj?.[idx] ?? null));
          break;
        }

        case op.MAKE_ARRAY: {
          const items = [];
          for (let i = 0; i < instr.arg; i++) items.unshift(frame.pop());
          frame.push(items);
          break;
        }
        case op.MAKE_OBJECT: {
          const obj = {};
          for (let i = 0; i < instr.arg; i++) { const v=frame.pop(),k=frame.pop(); obj[k]=v; }
          frame.push(obj);
          break;
        }

        case op.MAKE_FUNC:
        case op.MAKE_ARROW: {
          const fn = new VoxFn(instr.arg.name||'anon', instr.arg.params, instr.arg.code, instr.arg.constants, frame.locals);
          frame.push(fn);
          break;
        }

        case op.CALL: {
          const args = []; for(let i=0;i<instr.arg;i++) args.unshift(frame.pop());
          const fn = frame.pop();
          await this._callFn(fn, args);
          break;
        }
        case op.CALL_METHOD: {
          const { method, arity } = instr.arg;
          const args = []; for(let i=0;i<arity;i++) args.unshift(frame.pop());
          const obj = frame.pop();
          if (typeof obj?.[method] === 'function') frame.push((await obj[method](...args)) ?? null);
          else if (obj instanceof VoxFn) { await this._callFn(obj, args); }
          else throw new Error(`Method not found: ${method}`);
          break;
        }

        case op.RETURN: {
          const retVal = frame.pop();
          this.callStack.pop();
          if (this.callStack.length > 0) this.callStack[this.callStack.length-1].push(retVal ?? null);
          break;
        }

        case op.ITER_INIT: {
          const iterable = frame.pop();
          this._iterators.push(new VoxIter(iterable));
          break;
        }
        case op.ITER_NEXT: {
          const iter = this._iterators[this._iterators.length-1];
          if (!iter || !iter.hasNext()) { frame.ip = instr.arg.endLabel; break; }
          frame.locals[instr.arg.varName] = iter.next();
          break;
        }
        case op.ITER_END: { this._iterators.pop(); break; }

        case op.TRY_START: {
          this.tryStack.push({ catchLabel: instr.arg.catchLabel, catchVar: instr.arg.catchVar, frameDepth: this.callStack.length });
          break;
        }
        case op.TRY_END: { this.tryStack.pop(); break; }
        case op.CATCH: { break; }
        case op.THROW: { throw new Error(String(frame.pop())); }

        case op.BACKGROUND: {
          const bgCode = instr.arg;
          Huna7.Schedule.delay(() => {
            try {
              const bgVM = new VM(this.api, this.output, 500000);
              bgVM.run(bgCode).catch(e => this.output('[BG Error] ' + e.message));
            } catch(e) { this.output('[BG Error] ' + e.message); }
          }, 0);
          break;
        }

        default: throw new Error(`Unknown opcode: ${instr.op}`);
      }
    }

    async _callFn(fn, args) {
      if (typeof fn === 'function') {
        // Native JS function
        const result = await fn(...args);
        this.callStack[this.callStack.length-1]?.push(result ?? null);
      } else if (fn instanceof VoxFn) {
        const newFrame = new Frame(fn.code, fn.constants, fn.closure);
        fn.params.forEach((p, i) => newFrame.locals[p] = args[i] ?? null);
        this.callStack.push(newFrame);
      } else {
        throw new Error(`Not callable: ${typeof fn}`);
      }
    }

    _lookupAPI(name) {
      if (this.api && this.api._globals && name in this.api._globals) return this.api._globals[name];
      if (this.api && name in this.api) return this.api[name];
      if (name === 'print') return (val) => { this.output(String(val ?? 'null')); };
      if (name === 'range') return (start, end) => { const a=[]; for(let i=start;i<end;i++) a.push(i); return a; };
      if (name === 'len') return (v) => Array.isArray(v) ? v.length : String(v).length;
      if (name === 'str') return (v) => String(v ?? '');
      if (name === 'num') return (v) => Number(v);
      if (name === 'type') return (v) => v === null ? 'null' : typeof v;
      if (name === 'keys') return (o) => Object.keys(o || {});
      if (name === 'values') return (o) => Object.values(o || {});
      if (name === 'split') return (s, d) => String(s).split(d);
      if (name === 'join') return (arr, d='') => arr.join(d);
      if (name === 'push') return (arr, v) => { arr.push(v); return arr; };
      if (name === 'pop') return (arr) => arr.pop();
      return undefined;
    }

    _handleError(frame, err) {
      if (!this.tryStack.length) return false;
      const tryEntry = this.tryStack.pop();
      // Unwind call stack to try depth
      while (this.callStack.length > tryEntry.frameDepth) this.callStack.pop();
      const currentFrame = this.callStack[this.callStack.length-1];
      if (currentFrame) {
        currentFrame.locals[tryEntry.catchVar] = err.message || String(err);
        currentFrame.ip = tryEntry.catchLabel;
      }
      return true;
    }
  }

  return { VM, VoxFn };
})();

/* =====================================================
   HUNA7-OS — VOXSCRIPT: GRAMMAR
   Parser. Converts token stream into AST.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.VoxScript = Huna7.VoxScript || {};

Huna7.VoxScript.Grammar = (() => {
  const TT = () => Huna7.VoxScript.Alphabet.TT;
  const N  = () => Huna7.VoxScript.Sentence;

  class Parser {
    constructor(tokens) {
      this.tokens = tokens.filter(t => t.type !== 'NEWLINE');
      this.pos = 0;
    }

    peek(offset = 0) { return this.tokens[this.pos + offset] || { type: 'EOF' }; }
    advance() { return this.tokens[this.pos++]; }
    check(type) { return this.peek().type === type; }
    match(...types) { if (types.includes(this.peek().type)) { return this.advance(); } return null; }
    expect(type) {
      if (!this.check(type)) throw new SyntaxError(`Expected ${type}, got ${this.peek().type} ('${this.peek().value}') at line ${this.peek().line}`);
      return this.advance();
    }
    at(type) { return this.peek().type === type; }

    parse() {
      const body = [];
      while (!this.at(TT().EOF)) body.push(this.statement());
      return N().Program(body);
    }

    statement() {
      const tt = TT();
      if (this.at(tt.LET))        return this.varDecl();
      if (this.at(tt.FN))         return this.fnDecl();
      if (this.at(tt.IF))         return this.ifStatement();
      if (this.at(tt.WHILE))      return this.whileLoop();
      if (this.at(tt.FOR))        return this.forIn();
      if (this.at(tt.RETURN))     return this.returnStatement();
      if (this.at(tt.BREAK))      { this.advance(); return N().BreakStatement(); }
      if (this.at(tt.CONTINUE))   { this.advance(); return N().ContinueStatement(); }
      if (this.at(tt.TRY))        return this.tryCatch();
      if (this.at(tt.THROW))      { this.advance(); return N().ThrowStatement(this.expression()); }
      if (this.at(tt.RUN))        return this.runBackground();
      if (this.at(tt.LBRACE))     return this.block();
      return this.expressionStatement();
    }

    varDecl() {
      const tt = TT();
      this.expect(tt.LET);
      const name = this.expect(tt.IDENT).value;
      this.expect(tt.ASSIGN);
      const value = this.expression();
      this.match(tt.SEMICOLON);
      return N().VarDecl(name, value);
    }

    fnDecl() {
      const tt = TT();
      this.expect(tt.FN);
      const name = this.expect(tt.IDENT).value;
      this.expect(tt.LPAREN);
      const params = [];
      while (!this.at(tt.RPAREN)) {
        params.push(this.expect(tt.IDENT).value);
        if (!this.match(tt.COMMA)) break;
      }
      this.expect(tt.RPAREN);
      const body = this.block();
      return N().FnDecl(name, params, body);
    }

    ifStatement() {
      const tt = TT();
      this.expect(tt.IF);
      this.expect(tt.LPAREN);
      const condition = this.expression();
      this.expect(tt.RPAREN);
      const consequent = this.block();
      let alternate = null;
      if (this.match(tt.ELSE)) {
        alternate = this.at(tt.IF) ? this.ifStatement() : this.block();
      }
      return N().IfStatement(condition, consequent, alternate);
    }

    whileLoop() {
      const tt = TT();
      this.expect(tt.WHILE);
      this.expect(tt.LPAREN);
      const condition = this.expression();
      this.expect(tt.RPAREN);
      const body = this.block();
      return N().WhileLoop(condition, body);
    }

    forIn() {
      const tt = TT();
      this.expect(tt.FOR);
      const varName = this.expect(tt.IDENT).value;
      this.expect(tt.IN);
      const iterable = this.expression();
      const body = this.block();
      return N().ForIn(varName, iterable, body);
    }

    returnStatement() {
      const tt = TT();
      this.expect(tt.RETURN);
      const value = this.at(tt.RBRACE) || this.at(tt.EOF) ? N().NullLiteral() : this.expression();
      this.match(tt.SEMICOLON);
      return N().ReturnStatement(value);
    }

    tryCatch() {
      const tt = TT();
      this.expect(tt.TRY);
      const tryBody = this.block();
      this.expect(tt.CATCH);
      this.expect(tt.LPAREN);
      const catchVar = this.expect(tt.IDENT).value;
      this.expect(tt.RPAREN);
      const catchBody = this.block();
      return N().TryCatch(tryBody, catchVar, catchBody);
    }

    runBackground() {
      const tt = TT();
      this.expect(tt.RUN);
      this.expect(tt.BACKGROUND);
      const body = this.block();
      return N().Background(body);
    }

    block() {
      const tt = TT();
      this.expect(tt.LBRACE);
      const body = [];
      while (!this.at(tt.RBRACE) && !this.at(tt.EOF)) body.push(this.statement());
      this.expect(tt.RBRACE);
      return N().Block(body);
    }

    expressionStatement() {
      const tt = TT();
      const expr = this.expression();
      this.match(tt.SEMICOLON);
      return expr;
    }

    expression() { return this.assignment(); }

    assignment() {
      const tt = TT();
      const left = this.logicalOr();
      if (this.match(tt.ASSIGN)) return N().Assignment(left, this.assignment());
      if (this.match(tt.PLUS_EQ)) return N().Assignment(left, N().BinaryOp('+', left, this.assignment()));
      if (this.match(tt.MINUS_EQ)) return N().Assignment(left, N().BinaryOp('-', left, this.assignment()));
      return left;
    }

    logicalOr() {
      let left = this.logicalAnd();
      while (this.match(TT().OR)) left = N().LogicalOp('||', left, this.logicalAnd());
      return left;
    }

    logicalAnd() {
      let left = this.equality();
      while (this.match(TT().AND)) left = N().LogicalOp('&&', left, this.equality());
      return left;
    }

    equality() {
      const tt = TT();
      let left = this.comparison();
      while (true) {
        if (this.match(tt.EQ)) left = N().BinaryOp('==', left, this.comparison());
        else if (this.match(tt.NEQ)) left = N().BinaryOp('!=', left, this.comparison());
        else break;
      }
      return left;
    }

    comparison() {
      const tt = TT();
      let left = this.addition();
      while (true) {
        if (this.match(tt.LT)) left = N().BinaryOp('<', left, this.addition());
        else if (this.match(tt.GT)) left = N().BinaryOp('>', left, this.addition());
        else if (this.match(tt.LTE)) left = N().BinaryOp('<=', left, this.addition());
        else if (this.match(tt.GTE)) left = N().BinaryOp('>=', left, this.addition());
        else break;
      }
      return left;
    }

    addition() {
      const tt = TT();
      let left = this.multiplication();
      while (true) {
        if (this.match(tt.PLUS)) left = N().BinaryOp('+', left, this.multiplication());
        else if (this.match(tt.MINUS)) left = N().BinaryOp('-', left, this.multiplication());
        else break;
      }
      return left;
    }

    multiplication() {
      const tt = TT();
      let left = this.unary();
      while (true) {
        if (this.match(tt.STAR)) left = N().BinaryOp('*', left, this.unary());
        else if (this.match(tt.SLASH)) left = N().BinaryOp('/', left, this.unary());
        else if (this.match(tt.PERCENT)) left = N().BinaryOp('%', left, this.unary());
        else break;
      }
      return left;
    }

    unary() {
      const tt = TT();
      if (this.match(tt.NOT)) return N().UnaryOp('!', this.unary());
      if (this.match(tt.MINUS)) return N().UnaryOp('-', this.unary());
      return this.callOrAccess();
    }

    callOrAccess() {
      const tt = TT();
      let expr = this.primary();
      while (true) {
        if (this.match(tt.DOT)) {
          const prop = this.expect(tt.IDENT).value;
          expr = N().MemberAccess(expr, prop);
        } else if (this.at(tt.LPAREN)) {
          this.advance();
          const args = [];
          while (!this.at(tt.RPAREN) && !this.at(tt.EOF)) {
            args.push(this.expression());
            if (!this.match(tt.COMMA)) break;
          }
          this.expect(tt.RPAREN);
          expr = N().Call(expr, args);
        } else if (this.match(tt.LBRACKET)) {
          const idx = this.expression();
          this.expect(tt.RBRACKET);
          expr = N().IndexAccess(expr, idx);
        } else break;
      }
      return expr;
    }

    primary() {
      const tt = TT();
      const tok = this.peek();
      if (this.match(tt.NUMBER)) return N().NumberLiteral(tok.value);
      if (this.match(tt.STRING)) return N().StringLiteral(tok.value);
      if (this.match(tt.BOOL))   return N().BoolLiteral(tok.value);
      if (this.match(tt.NULL))   return N().NullLiteral();
      if (this.match(tt.IDENT))  return N().Identifier(tok.value);
      if (this.match(tt.LPAREN)) {
        const expr = this.expression();
        this.expect(tt.RPAREN);
        return expr;
      }
      if (this.at(tt.LBRACKET)) {
        this.advance();
        const elements = [];
        while (!this.at(tt.RBRACKET) && !this.at(tt.EOF)) {
          elements.push(this.expression());
          if (!this.match(tt.COMMA)) break;
        }
        this.expect(tt.RBRACKET);
        return N().ArrayLiteral(elements);
      }
      if (this.at(tt.LBRACE)) {
        this.advance();
        const props = [];
        while (!this.at(tt.RBRACE) && !this.at(tt.EOF)) {
          const key = this.match(tt.IDENT)?.value || this.match(tt.STRING)?.value;
          this.expect(tt.COLON);
          props.push(N().Property(key, this.expression()));
          if (!this.match(tt.COMMA)) break;
        }
        this.expect(tt.RBRACE);
        return N().ObjectLiteral(props);
      }
      if (this.at(tt.FN)) {
        this.advance();
        const params = [];
        if (this.match(tt.LPAREN)) {
          while (!this.at(tt.RPAREN)) {
            params.push(this.expect(tt.IDENT).value);
            if (!this.match(tt.COMMA)) break;
          }
          this.expect(tt.RPAREN);
        }
        const body = this.block();
        return N().ArrowFn(params, body);
      }
      throw new SyntaxError(`Unexpected token: ${tok.type} ('${tok.value}') at line ${tok.line}`);
    }
  }

  const parse = (tokens) => new Parser(tokens).parse();

  return { parse };
})();

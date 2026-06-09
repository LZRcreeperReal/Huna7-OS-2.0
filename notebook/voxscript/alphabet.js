/* =====================================================
   HUNA7-OS — VOXSCRIPT: ALPHABET
   Lexer. Converts source code into tokens.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.VoxScript = Huna7.VoxScript || {};

Huna7.VoxScript.Alphabet = (() => {
  const TT = {
    // Literals
    NUMBER: 'NUMBER', STRING: 'STRING', BOOL: 'BOOL', NULL: 'NULL',
    // Identifiers / keywords
    IDENT: 'IDENT',
    // Keywords
    LET: 'LET', FN: 'FN', IF: 'IF', ELSE: 'ELSE',
    WHILE: 'WHILE', FOR: 'FOR', IN: 'IN', RETURN: 'RETURN',
    BREAK: 'BREAK', CONTINUE: 'CONTINUE', TRY: 'TRY', CATCH: 'CATCH',
    THROW: 'THROW', RUN: 'RUN', BACKGROUND: 'BACKGROUND', LOOP: 'LOOP',
    IMPORT: 'IMPORT', NEW: 'NEW',
    // Operators
    PLUS: 'PLUS', MINUS: 'MINUS', STAR: 'STAR', SLASH: 'SLASH', PERCENT: 'PERCENT',
    EQ: 'EQ', NEQ: 'NEQ', LT: 'LT', GT: 'GT', LTE: 'LTE', GTE: 'GTE',
    AND: 'AND', OR: 'OR', NOT: 'NOT',
    ASSIGN: 'ASSIGN', PLUS_EQ: 'PLUS_EQ', MINUS_EQ: 'MINUS_EQ',
    // Punctuation
    LPAREN: 'LPAREN', RPAREN: 'RPAREN', LBRACE: 'LBRACE', RBRACE: 'RBRACE',
    LBRACKET: 'LBRACKET', RBRACKET: 'RBRACKET',
    COMMA: 'COMMA', DOT: 'DOT', COLON: 'COLON', SEMICOLON: 'SEMICOLON',
    ARROW: 'ARROW',
    // Special
    EOF: 'EOF', NEWLINE: 'NEWLINE',
  };

  const KEYWORDS = {
    let: TT.LET, fn: TT.FN, if: TT.IF, else: TT.ELSE,
    while: TT.WHILE, for: TT.FOR, in: TT.IN, return: TT.RETURN,
    break: TT.BREAK, continue: TT.CONTINUE, try: TT.TRY, catch: TT.CATCH,
    throw: TT.THROW, run: TT.RUN, background: TT.BACKGROUND, loop: TT.LOOP,
    import: TT.IMPORT, new: TT.NEW,
    true: TT.BOOL, false: TT.BOOL, null: TT.NULL,
  };

  const tokenize = (src) => {
    const tokens = [];
    let i = 0, line = 1, col = 1;

    const advance = () => { const c = src[i++]; if (c === '\n') { line++; col = 1; } else col++; return c; };
    const peek = (offset = 0) => src[i + offset];
    const addToken = (type, value) => tokens.push({ type, value, line, col });
    const isDigit = c => c >= '0' && c <= '9';
    const isAlpha = c => /[a-zA-Z_$]/.test(c);
    const isAlNum = c => /[a-zA-Z0-9_$]/.test(c);

    while (i < src.length) {
      const ch = src[i];

      // Skip whitespace (not newlines)
      if (ch === ' ' || ch === '\t' || ch === '\r') { advance(); continue; }

      // Comments
      if (ch === '#') { while (i < src.length && src[i] !== '\n') advance(); continue; }
      if (ch === '/' && peek(1) === '/') { while (i < src.length && src[i] !== '\n') advance(); continue; }
      if (ch === '/' && peek(1) === '*') {
        advance(); advance();
        while (i < src.length - 1 && !(src[i] === '*' && src[i+1] === '/')) advance();
        advance(); advance(); continue;
      }

      // Newlines
      if (ch === '\n') { addToken(TT.NEWLINE, '\n'); advance(); continue; }

      // Numbers
      if (isDigit(ch) || (ch === '.' && isDigit(peek(1)))) {
        let num = '';
        while (i < src.length && (isDigit(src[i]) || src[i] === '.')) num += advance();
        addToken(TT.NUMBER, parseFloat(num)); continue;
      }

      // Strings
      if (ch === '"' || ch === "'") {
        const q = advance(); let str = '';
        while (i < src.length && src[i] !== q) {
          if (src[i] === '\\') { advance(); str += ({n:'\n',t:'\t',r:'\r'}[src[i]] || src[i]); advance(); }
          else str += advance();
        }
        advance();
        addToken(TT.STRING, str); continue;
      }

      // Identifiers and keywords
      if (isAlpha(ch)) {
        let id = '';
        while (i < src.length && isAlNum(src[i])) id += advance();
        const kw = KEYWORDS[id];
        if (kw === TT.BOOL) addToken(TT.BOOL, id === 'true');
        else if (kw === TT.NULL) addToken(TT.NULL, null);
        else addToken(kw || TT.IDENT, id);
        continue;
      }

      // Operators and punctuation
      advance();
      switch (ch) {
        case '+': if (src[i] === '=') { advance(); addToken(TT.PLUS_EQ, '+='); } else addToken(TT.PLUS, '+'); break;
        case '-': if (src[i] === '>') { advance(); addToken(TT.ARROW, '=>'); } else if (src[i] === '=') { advance(); addToken(TT.MINUS_EQ, '-='); } else addToken(TT.MINUS, '-'); break;
        case '*': addToken(TT.STAR, '*'); break;
        case '/': addToken(TT.SLASH, '/'); break;
        case '%': addToken(TT.PERCENT, '%'); break;
        case '(': addToken(TT.LPAREN, '('); break;
        case ')': addToken(TT.RPAREN, ')'); break;
        case '{': addToken(TT.LBRACE, '{'); break;
        case '}': addToken(TT.RBRACE, '}'); break;
        case '[': addToken(TT.LBRACKET, '['); break;
        case ']': addToken(TT.RBRACKET, ']'); break;
        case ',': addToken(TT.COMMA, ','); break;
        case '.': addToken(TT.DOT, '.'); break;
        case ':': addToken(TT.COLON, ':'); break;
        case ';': addToken(TT.SEMICOLON, ';'); break;
        case '=':
          if (src[i] === '=') { advance(); addToken(TT.EQ, '=='); }
          else if (src[i] === '>') { advance(); addToken(TT.ARROW, '=>'); }
          else addToken(TT.ASSIGN, '=');
          break;
        case '!': if (src[i] === '=') { advance(); addToken(TT.NEQ, '!='); } else addToken(TT.NOT, '!'); break;
        case '<': if (src[i] === '=') { advance(); addToken(TT.LTE, '<='); } else addToken(TT.LT, '<'); break;
        case '>': if (src[i] === '=') { advance(); addToken(TT.GTE, '>='); } else addToken(TT.GT, '>'); break;
        case '&': if (src[i] === '&') { advance(); addToken(TT.AND, '&&'); } break;
        case '|': if (src[i] === '|') { advance(); addToken(TT.OR, '||'); } break;
        default: break; // Skip unknown chars
      }
    }

    addToken(TT.EOF, null);
    return tokens;
  };

  return { tokenize, TT };
})();

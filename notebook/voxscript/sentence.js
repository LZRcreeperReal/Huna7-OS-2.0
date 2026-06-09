/* =====================================================
   HUNA7-OS — VOXSCRIPT: SENTENCE
   AST node type definitions. The syntax tree spec.
===================================================== */
window.Huna7 = window.Huna7 || {};
Huna7.VoxScript = Huna7.VoxScript || {};

Huna7.VoxScript.Sentence = (() => {
  // Node factory
  const node = (type, props = {}) => ({ nodeType: type, ...props });

  return {
    // Literals
    NumberLiteral: (value) => node('NumberLiteral', { value }),
    StringLiteral: (value) => node('StringLiteral', { value }),
    BoolLiteral: (value) => node('BoolLiteral', { value }),
    NullLiteral: () => node('NullLiteral'),

    // Identifiers & access
    Identifier: (name) => node('Identifier', { name }),
    MemberAccess: (object, property) => node('MemberAccess', { object, property }),
    IndexAccess: (object, index) => node('IndexAccess', { object, index }),

    // Collections
    ArrayLiteral: (elements) => node('ArrayLiteral', { elements }),
    ObjectLiteral: (properties) => node('ObjectLiteral', { properties }),
    Property: (key, value) => node('Property', { key, value }),

    // Operations
    BinaryOp: (op, left, right) => node('BinaryOp', { op, left, right }),
    UnaryOp: (op, operand) => node('UnaryOp', { op, operand }),
    LogicalOp: (op, left, right) => node('LogicalOp', { op, left, right }),
    Assignment: (target, value) => node('Assignment', { target, value }),

    // Control flow
    Program: (body) => node('Program', { body }),
    Block: (body) => node('Block', { body }),
    IfStatement: (condition, consequent, alternate) => node('IfStatement', { condition, consequent, alternate }),
    WhileLoop: (condition, body) => node('WhileLoop', { condition, body }),
    ForIn: (variable, iterable, body) => node('ForIn', { variable, iterable, body }),
    ReturnStatement: (value) => node('ReturnStatement', { value }),
    BreakStatement: () => node('BreakStatement'),
    ContinueStatement: () => node('ContinueStatement'),

    // Declarations
    VarDecl: (name, value) => node('VarDecl', { name, value }),
    FnDecl: (name, params, body) => node('FnDecl', { name, params, body }),
    ArrowFn: (params, body) => node('ArrowFn', { params, body }),
    Call: (callee, args) => node('Call', { callee, args }),

    // Error handling
    TryCatch: (tryBody, catchVar, catchBody) => node('TryCatch', { tryBody, catchVar, catchBody }),
    ThrowStatement: (value) => node('ThrowStatement', { value }),

    // OS-specific
    Background: (body) => node('Background', { body }),
    EventListen: (event, handler) => node('EventListen', { event, handler }),
    Import: (module) => node('Import', { module }),
    Comment: (text) => node('Comment', { text }),
  };
})();

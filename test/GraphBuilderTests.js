import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';
import * as GB from '../src/js/GraphBuilder.js';
import * as esgraph from 'esgraph';

let func = 'function foo(x){\n' +
    '    let a = x + 1;\n' +
    '    a = 5;\n' +
    '    if(x > a){\n' +
    '        a = 60;\n' +
    '    }\n' +
    '    return a;\n' +
    '}\n';
let parsedFunc1 = parseCode(func);
let cfg = esgraph(parsedFunc1['body'][0]['body']);
let dot = 'digraph{' + esgraph.dot(cfg, parsedFunc1) + '}';
let dotAfterLabelChange = GB.labelChange_correctShapes(dot, cfg);
let dotAfterDeleteNonRelevantTrans = GB.deleteNonRelevantTrans(dotAfterLabelChange, cfg[2].length - 1);
let dotAfterDeleteEntryExitNodes = GB.deleteEntryExitNodes(dotAfterDeleteNonRelevantTrans, cfg[2].length - 1);
let dotAfterTrueFalseToFT = GB.trueFalseToFT(dotAfterDeleteEntryExitNodes);
let dotAfterAddNodeToIfEnd = GB.addNodeToIfEnd(dotAfterTrueFalseToFT, 20);

describe('editDot check', () => {
    it('editDot', () => {
        assert.equal(GB.editDot(dot, cfg), 'digraph{n1 [label="-1-\na = x + 1", shape=box]\nn2 [label="-2-\na = 5", shape=box]\nn3 [label="-3-\nx > a", shape=diamond]\nn4 [label="-4-\na = 60", shape=box]\nn6 [label="-5-\n", shape=oval]\nn5 [label="-6-\nreturn a", shape=box]\nn1 -> n2 []\nn2 -> n3 []\nn3 -> n4 [label="T"]\nn6 -> n5 []\nn3 -> n6 [label="F"]\nn4 -> n6 []\n}');
    });
});

describe('labelChange_correctShapes check', () => {
    it('labelChange_correctShapes', () => {
        assert.equal(dotAfterLabelChange, 'digraph{n0 [label="entry", style="rounded"]\nn1 [label="a = x + 1", shape=box]\nn2 [label="a = 5", shape=box]\nn3 [label="x > a", shape=diamond]\nn4 [label="a = 60", shape=box]\nn5 [label="return a", shape=box]\nn6 [label="exit", style="rounded"]\nn0 -> n1 []\nn1 -> n2 []\nn1 -> n6 [color="red", label="exception"]\nn2 -> n3 []\nn2 -> n6 [color="red", label="exception"]\nn3 -> n4 [label="true"]\nn3 -> n5 [label="false"]\nn3 -> n6 [color="red", label="exception"]\nn4 -> n5 []\nn4 -> n6 [color="red", label="exception"]\nn5 -> n6 []\n}');
    });
});

describe('deleteNonRelevantTrans check', () => {
    it('deleteNonRelevantTrans', () => {
        assert.equal(dotAfterDeleteNonRelevantTrans, 'digraph{n0 [label="entry", style="rounded"]\nn1 [label="a = x + 1", shape=box]\nn2 [label="a = 5", shape=box]\nn3 [label="x > a", shape=diamond]\nn4 [label="a = 60", shape=box]\nn5 [label="return a", shape=box]\nn6 [label="exit", style="rounded"]\nn1 -> n2 []\nn2 -> n3 []\nn3 -> n4 [label="true"]\nn3 -> n5 [label="false"]\nn4 -> n5 []\n}');
    });
});

describe('deleteEntryExitNodes check', () => {
    it('deleteEntryExitNodes', () => {
        assert.equal(dotAfterDeleteEntryExitNodes, 'digraph{n1 [label="a = x + 1", shape=box]\nn2 [label="a = 5", shape=box]\nn3 [label="x > a", shape=diamond]\nn4 [label="a = 60", shape=box]\nn5 [label="return a", shape=box]\nn1 -> n2 []\nn2 -> n3 []\nn3 -> n4 [label="true"]\nn3 -> n5 [label="false"]\nn4 -> n5 []\n}');
    });
});

describe('trueFalseToFT check', () => {
    it('trueFalseToFT', () => {
        assert.equal(dotAfterTrueFalseToFT, 'digraph{n1 [label="a = x + 1", shape=box]\nn2 [label="a = 5", shape=box]\nn3 [label="x > a", shape=diamond]\nn4 [label="a = 60", shape=box]\nn5 [label="return a", shape=box]\nn1 -> n2 []\nn2 -> n3 []\nn3 -> n4 [label="T"]\nn3 -> n5 [label="F"]\nn4 -> n5 []\n}');
    });
});

describe('addNodeToIfEnd check', () => {
    it('addNodeToIfEnd', () => {
        assert.equal(dotAfterAddNodeToIfEnd, 'digraph{n1 [label="a = x + 1", shape=box]\nn2 [label="a = 5", shape=box]\nn3 [label="x > a", shape=diamond]\nn4 [label="a = 60", shape=box]\nn20 [label="", shape=oval]\nn5 [label="return a", shape=box]\nn1 -> n2 []\nn2 -> n3 []\nn3 -> n4 [label="T"]\nn20 -> n5 []\nn3 -> n20 [label="F"]\nn4 -> n20 []\n}');
    });
});

describe('getExpStmValue check', () => {
    let value;
    it('VariableDeclaration', () => {
        value = GB.getExpStmValue(parsedFunc1['body'][0]['body']['body'][0]);
        assert.equal(value[0], 'a = x + 1');
        assert.equal(value[1], '", shape=box');
    });
    it('AssignmentExpression', () => {
        value = GB.getExpStmValue(parsedFunc1['body'][0]['body']['body'][1]['expression']);
        assert.equal(value[0], 'a = 5');
        assert.equal(value[1], '", shape=box');
    });
    it('BinaryExpression', () => {
        value = GB.getExpStmValue(parsedFunc1['body'][0]['body']['body'][2]['test']);
        assert.equal(value[0], 'x > a');
        assert.equal(value[1], '", shape=diamond');
    });
    it('ReturnStatement', () => {
        value = GB.getExpStmValue(parsedFunc1['body'][0]['body']['body'][3]);
        assert.equal(value[0], 'return a');
        assert.equal(value[1], '", shape=box');
    });
});

describe('getBasicValue check', () => {
    let exp, value;
    it('literal', () => {
        exp = parseCode('5');
        value = GB.getBasicValue(exp['body'][0]['expression']);
        assert.equal(value, '5');
    });
    it('identifier', () => {
        exp = parseCode('x');
        value = GB.getBasicValue(exp['body'][0]['expression']);
        assert.equal(value, 'x');
    });
    it('UnaryExpression', () => {
        exp = parseCode('-x');
        value = GB.getBasicValue(exp['body'][0]['expression']);
        assert.equal(value, '-x');
    });
    it('MemberExpression', () => {
        exp = parseCode('x[5]');
        value = GB.getBasicValue(exp['body'][0]['expression']);
        assert.equal(value, 'x[5]');
    });
    it('BinaryExpression', () => {
        exp = parseCode('x + g[77]');
        value = GB.getBasicValue(exp['body'][0]['expression']);
        assert.equal(value, 'x + g[77]');
    });
});
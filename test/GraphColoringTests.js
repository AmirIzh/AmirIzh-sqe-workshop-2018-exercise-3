import assert from 'assert';
import * as GB from '../src/js/GraphBuilder.js';
import * as GC from '../src/js/GraphColoring.js';
import * as esgraph from 'esgraph';
import {parseCode} from '../src/js/code-analyzer';

let args = '6, [1, 2, 3]';
let func = 'function foo(x, y){\n' +
    '    let a = x + 1;\n' +
    '    a = 10;\n' +
    '    if(x > a){\n' +
    '        a = 60;\n' +
    '    } else if(x > y[2]){\n' +
    '        a = 70;\n' +
    '    }\n' +
    '    return a;\n' +
    '}\n';
let parsedCode = parseCode(func);
let cfg = esgraph(parsedCode['body'][0]['body']);
let dot = GB.editDot('digraph{' + esgraph.dot(cfg, parsedCode) + '}', cfg);

describe('initArgs check', () => {
    GC.initArgs(args, parsedCode);
    let symTable = GC.getData()[0];
    GC.resetData();
    it('initArgs', () => {
        assert.equal(JSON.stringify(symTable), '{"x":"6","y":"[1, 2, 3]","y[0]":"1","y[1]":"2","y[2]":"3"}');
    });

});

describe('initNodesTransitions check', () => {
    GC.initNodesTransitions(dot);
    let nodes = GC.getData()[1];
    let transitionsSet = GC.getData()[2];
    let transitionsArr = Array.from(transitionsSet);
    GC.resetData();
    it('nodes check', () => {
        assert.equal(JSON.stringify(nodes), '{"n1":["a = x + 1","box"],"n2":["a = 10","box"],"n3":["x > a","diamond"],"n4":["a = 60","box"],"n5":["return a","box"],"n6":["x > y[2]","diamond"],"n7":["a = 70","box"],"n8":["","oval"]}');
    });
    it('transitions check', () => {
        assert.equal(transitionsArr[4], 'n6 -> n7 [label="T"]');
        assert.equal(transitionsArr[5], 'n8 -> n5 []');
    });
});

describe('fillNodesToColor check', () => {
    GC.initArgs(args, parsedCode);
    GC.initNodesTransitions(dot);
    GC.fillNodesToColor('n1');
    let nodesToColorSet = GC.getData()[3];
    let nodesToColorArr = Array.from(nodesToColorSet);
    GC.resetData();
    it('fillNodesToColor', () => {
        assert.equal(nodesToColorArr[0], 'n1');
        assert.equal(nodesToColorArr[1], 'n2');
        assert.equal(nodesToColorArr[2], 'n3');
        assert.equal(nodesToColorArr[3], 'n6');
        assert.equal(nodesToColorArr[4], 'n7');
        assert.equal(nodesToColorArr[5], 'n8');

    });
});

describe('full color check', () => {
    let coloredGraph = GC.colorDot(args, parsedCode, dot);
    GC.resetData();
    it('color', () => {
        assert.equal(coloredGraph, 'digraph{n1 [label="-1-\na = x + 1", shape=box, fillcolor = green, style = "filled"]\nn2 [label="-2-\na = 10", shape=box, fillcolor = green, style = "filled"]\nn3 [label="-3-\nx > a", shape=diamond, fillcolor = green, style = "filled"]\nn4 [label="-4-\na = 60", shape=box]\nn5 [label="-5-\nreturn a", shape=box, fillcolor = green, style = "filled"]\nn6 [label="-6-\nx > y[2]", shape=diamond, fillcolor = green, style = "filled"]\nn7 [label="-7-\na = 70", shape=box, fillcolor = green, style = "filled"]\nn8 [label="-8-\n", shape=oval, fillcolor = green, style = "filled"]\nn1 -> n2 []\nn2 -> n3 []\nn3 -> n4 [label="T"]\nn3 -> n6 [label="F"]\nn6 -> n7 [label="T"]\nn8 -> n5 []\nn4 -> n8 []\nn6 -> n8 [label="F"]\nn7 -> n8 []\n}');
    });

});
import $ from 'jquery';
import {parseCode} from './code-analyzer';
import * as esgraph from 'esgraph';
import * as GB from './GraphBuilder.js';
import * as GC from './GraphColoring.js';
import Viz from 'viz.js';
import {Module, render} from 'viz.js/full.render.js';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let cfg = esgraph(parsedCode['body'][0]['body']);
        let graphElement = document.getElementById('graph');
        let viz = new Viz({ Module, render });
        let dot = 'digraph{' + esgraph.dot(cfg, parsedCode) + '}';
        dot = GB.editDot(dot, cfg);
        dot = GC.colorDot($('#argumentsHolder').val(), parsedCode, dot);
        viz.renderSVGElement(dot)
            .then(function(element) {
                graphElement.innerHTML = '';
                graphElement.append(element);
            });
    });
});

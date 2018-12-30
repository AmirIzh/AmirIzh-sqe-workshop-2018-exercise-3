import * as GB from './GraphBuilder.js';

let params = [];
let symTable = {};
let nodes = {};
let transitions = new Set();
let nodesToColor = new Set();

function colorDot(args, parsedCode, dot){
    initArgs(args, parsedCode);
    initNodesTransitions(dot);
    fillNodesToColor('n1');
    return color(dot);
}

function color(dot){
    let curNodeId, i = 8, getCurNodeIdVals, actuallyColorVals;
    while(dot[i] !== '}'){
        getCurNodeIdVals = getCurNodeId(dot, i);
        curNodeId = getCurNodeIdVals[0];
        i = getCurNodeIdVals[1];
        if(dot[i] !== '[') i = notNode(dot, i);
        else{
            if(nodesToColor.has(curNodeId)){
                actuallyColorVals = actuallyColor(dot, i);
                dot = actuallyColorVals[0];
                i = actuallyColorVals[1];
            }
        }
        curNodeId = '';
    }
    return dot;
}

function actuallyColor(dot, i){
    let prefixDot, suffixDot;
    while(dot.substring(i, i + 2) !== ' [') i++;
    while(dot[i] !== ']') i--;
    prefixDot = dot.substring(0, i);
    suffixDot = dot.substring(i, dot.length);
    dot = prefixDot + ', fillcolor = green, style = "filled"' + suffixDot;
    i += 39;
    return [dot, i];
}

function notNode(dot, i){
    while(dot[i] !== ']') i++;
    i += 2;
    return i;
}

function getCurNodeId(dot, i){
    let curNodeId = '';
    while(dot[i] !== ' '){
        curNodeId += dot[i];
        i++;
    }
    i++;
    return [curNodeId, i];
}

function fillNodesToColor(curNodeId){
    let curNodeVal = nodes[curNodeId];
    nodesToColor.add(curNodeId);
    if(curNodeVal[1] === 'oval') fillNodesToColor(getNextNodeId(curNodeId));
    else if(curNodeVal[1] === 'box') processBoxNode(curNodeId);
    else processDiamondNode(curNodeId);
}

function processDiamondNode(curNodeId){
    let curNodeVal = nodes[curNodeId], evalAns = eval(symTableTranslation(curNodeVal[0])), NextNodeId = '', NextPotentialNodeId;
    transitions.forEach(function(trans){
        if(trans.substring(0, 2) === curNodeId || trans.substring(0, 3) === curNodeId){
            NextPotentialNodeId = processDiamondNodeInCurNodeId(evalAns, trans);
            if(NextPotentialNodeId !== '') NextNodeId = NextPotentialNodeId;
        }
    });
    fillNodesToColor(NextNodeId);
}

function processDiamondNodeInCurNodeId(evalAns, trans){
    let NextNodeId = '';
    if(evalAns && trans.substring(trans.length - 3, trans.length) === 'T"]')
        NextNodeId = getNextNodeIdForDiamond(trans);
    else if(!evalAns && trans.substring(trans.length - 3, trans.length) === 'F"]')
        NextNodeId = getNextNodeIdForDiamond(trans);
    return NextNodeId;
}

function getNextNodeIdForDiamond(trans){
    let i = 0, NextNodeId = '';

    while(trans.substring(i, i + 2) !== '->') i++;
    i += 3;
    while(trans[i] !== ' '){
        NextNodeId += trans[i];
        i++;
    }

    return NextNodeId;
}

function processBoxNode(curNodeId){
    let curNodeVal = nodes[curNodeId], assigns, leftRight;

    if(curNodeVal[0].substring(0, 7) !== 'return '){
        assigns = getNodeAssigns(curNodeVal[0]);
        for(let i = 0; i < assigns.length; i++){
            leftRight = getAssignLeftRight(assigns[i]);
            symTable[leftRight[0]] = symTableTranslation(leftRight[1]);
        }
        fillNodesToColor(getNextNodeId(curNodeId));
    }
}

function symTableTranslation(exp){
    let curToken = '', i = 0, translation = '', translatedCurToken;
    while(i < exp.length){
        while(exp[i] !== ' ' && i < exp.length){
            curToken += exp[i];
            i++;
        }
        translatedCurToken = symTable[curToken];
        if(translatedCurToken !== undefined) translation += translatedCurToken + ' ';
        else translation += curToken + ' ';
        curToken = '';
        i++;
    }
    return translation.substring(0, translation.length - 1);
}

function getAssignLeftRight(assign){
    let i = 0, ans = ['', ''];
    while(assign[i] !== ' '){
        ans[0] += assign[i];
        i++;
    }
    i += 3;
    while(i < assign.length){
        ans[1] += assign[i];
        i++;
    }
    return ans;
}

function getNodeAssigns(label){
    let i = 0, assigns = [], curAssign = '';
    while(i < label.length){
        curAssign += label[i];
        i++;
    }
    assigns[assigns.length] = curAssign;
    return assigns;
}

function getNextNodeId(curNodeId){
    let i, nextNodeId = '', ans = '';
    transitions.forEach(function(trans){
        if(trans.substring(0, curNodeId.length) === curNodeId){
            i = 6 + curNodeId.length - 2;
            while(trans[i] !== ' '){
                nextNodeId += trans[i];
                i++;
            }
            ans = nextNodeId;
        }
    });

    return ans;
}

function initNodesTransitions(dot){
    let i = 8, curId = '';
    while(dot[i] !== '}'){
        while(dot[i] !== ' '){
            curId += dot[i];
            i++;
        }
        if(dot[i + 1] === '[')
            i = addNodeToNodes(dot, i, curId);
        else
            i = addTransToTransitions(dot, i, curId);
        curId = '';
    }
}

function addTransToTransitions(dot, i, curId){
    while(dot[i] !== '\n'){
        curId += dot[i];
        i++;
    }
    transitions.add(curId);
    i++;
    return i;
}

function addNodeToNodes(dot, i, curId){
    let curLabel = '', curShape = '';
    i += 10;
    while(dot[i] !== '\n') i++;
    i++;
    while(dot[i] !== '"'){
        curLabel += dot[i];
        i++;
    }
    i += 9;
    while(dot[i] !== ']'){
        curShape += dot[i];
        i++;
    }
    nodes[curId] = [curLabel, curShape];
    i += 2;
    return i;
}

function initArgs(args, parsedCode){
    args = argsToArray(args);
    for(let i = 0; i < parsedCode['body'][0]['params'].length; i++)
        params[i] = GB.getBasicValue(parsedCode['body'][0]['params'][i]);
    for(let i = 0; i < args.length; i++)
        symTable[params[i]] = args[i];
    for(let i = 0; i < args.length; i++)
        if(args[i][0] === '[')
            arrayExtract(args[i].substring(1, args[i].length - 1));
}

function argsToArray(args){
    let argsArr = [], curArg = '', argsCount = 0, arrayGatherAns;
    for(let i = 0; i < args.length; i++){
        while(i < args.length && args[i] !== ','){
            if(args[i] === ' '){
                i++; continue;
            }
            arrayGatherAns = arrayGather(args, i, curArg);
            curArg = arrayGatherAns[0];
            i = arrayGatherAns[1];
            curArg += args[i];
            i++;
        }
        argsArr[argsCount] = curArg;
        argsCount++;
        curArg = '';
    }
    return argsArr;
}

function arrayGather(args, i, curArg){
    let ans = [];

    if(args[i] === '['){
        while(args[i] !== ']'){
            curArg += args[i];
            i++;
        }
    }
    ans[0] = curArg;
    ans[1] = i;

    return ans;
}

function getKeyArr(strArr){
    for(let key in symTable)
        if(symTable[key] === '[' + strArr + ']')
            return key;
}

function arrayExtract(strArr){
    let arrKey = getKeyArr(strArr), curElement = '', curElementNum = 0;

    for(let i = 0; i < strArr.length; i++){
        while(i < strArr.length && strArr[i] !== ','){
            if(strArr[i] === ' '){
                i++; continue;
            }
            curElement += strArr[i];
            i++;
        }
        symTable[arrKey + '[' + curElementNum.toString() + ']'] = curElement;
        curElementNum++;
        curElement = '';
    }
}

function getData(){
    return [symTable, nodes, transitions, nodesToColor];
}

function resetData(){
    params = [];
    symTable = {};
    nodes = {};
    transitions = new Set();
    nodesToColor = new Set();
}

export{colorDot};
export{initArgs};
export{initNodesTransitions};
export{fillNodesToColor};
export{getData};
export{resetData};
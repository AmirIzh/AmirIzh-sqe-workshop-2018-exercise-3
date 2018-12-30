function editDot(dot, cfg){
    dot = labelChange_correctShapes(dot, cfg);
    dot = deleteNonRelevantTrans(dot, cfg[2].length - 1);
    dot = deleteEntryExitNodes(dot, cfg[2].length - 1);
    dot = trueFalseToFT(dot);
    dot = addNodeToIfEnd(dot, cfg[2].length - 1);
    //dot = combineVarDecls(dot);
    dot = addNodeIndexes(dot);
    return dot;
}

function labelChange_correctShapes(dot, cfg){
    let dotCurChar = 0, prefixDot, suffixDot, NodeValue_shape, curNodeId;
    for(let i = 1; i < cfg[2].length - 1; i++){
        NodeValue_shape = getExpStmValue(cfg[2][i]['astNode']);
        curNodeId = 'n' + i;
        while(dot.substring(dotCurChar, dotCurChar + curNodeId.length) !== curNodeId){
            dotCurChar++;
        }
        dotCurChar += 11 + curNodeId.length - 2;
        prefixDot = dot.substring(0, dotCurChar);
        while(dot[dotCurChar] !== '"'){
            dotCurChar++;
        }
        dotCurChar++;
        suffixDot = dot.substring(dotCurChar, dot.length);
        dotCurChar -= 20;
        dot = prefixDot + NodeValue_shape[0] + NodeValue_shape[1] + suffixDot;
    }
    return dot;
}

function deleteNonRelevantTrans(dot, exitNum){
    let entryId = 'n0', exitId = 'n' + exitNum, prefixDot, suffixDot, from, to, vals;
    for(let i = 0; i < dot.length; i++){
        if(dot.substring(i, i + 2) === '->'){
            vals = deleteNonRelevantTransCalcs(dot, i);
            i = vals[0];
            from = vals[1];
            to = vals[2];
            prefixDot = vals[3];
            suffixDot = vals[4];
            if(from === entryId || to === exitId){
                dot = prefixDot + suffixDot;
                i -= 45;
            }
        }
    }
    return dot;
}

function deleteNonRelevantTransCalcs(dot, i){
    let from = '', to = '', prefixDot, suffixDot;

    while(dot[i] !== 'n') i--;
    prefixDot = dot.substring(0, i);
    while(dot[i] !== ' '){
        from += dot[i];
        i++;
    }
    i += 4;
    while(dot[i] !== ' '){
        to += dot[i];
        i++;
    }
    while(dot[i] !== '\n') i++;
    i++;
    suffixDot = dot.substring(i, dot.length);

    return [i, from, to, prefixDot, suffixDot];
}

function deleteEntryExitNodes(dot, exitNum){
    let entryId = 'n0', exitId = 'n' + exitNum, prefixDot, suffixDot;

    for(let i = 0; i < dot.length; i++){
        if(dot.substring(i, i + 2) === entryId || dot.substring(i, i + exitId.length) === exitId){
            prefixDot = dot.substring(0, i);
            while(dot[i] !== '\n')
                i++;
            i++;
            suffixDot = dot.substring(i, dot.length);
            dot = prefixDot + suffixDot;
        }
    }
    return dot;
}

function trueFalseToFT(dot){
    let prefixDot, suffixDot;

    for(let i = 0; i < dot.length; i++){
        if(dot.substring(i, i + 12) === 'label="true"'){
            prefixDot = dot.substring(0, i);
            suffixDot = dot.substring(i + 12, dot.length);
            dot = prefixDot + 'label="T"' + suffixDot;
        }
        if(dot.substring(i, i + 13) === 'label="false"'){
            prefixDot = dot.substring(0, i);
            suffixDot = dot.substring(i + 13, dot.length);
            dot = prefixDot + 'label="F"' + suffixDot;
        }
    }

    return dot;
}

function addNodeIndexes(dot){
    let i = 8, prefixDot, suffixDot, indexCount = 1;
    while(dot[i] !== '}'){
        while (dot[i] !== ' ') i++;
        if (dot[i + 1] === '[') {
            i += 9;
            prefixDot = dot.substring(0, i);
            suffixDot = dot.substring(i, dot.length);
            dot = prefixDot + '-' + indexCount + '-\n' + suffixDot;
            indexCount++;
            i += 3 + indexCount.toString.length;
        }
        while (dot[i] !== ']') i++;
        i += 2;
    }
    return dot;
}

function addNodeToIfEnd(dot, newNodeNum){
    let ranks = getAllInRanks(dot), i = 0;
    for(let key in ranks){
        if(ranks[key].length > 1){
            i = forwardingI(dot, i, ranks, key);
            while(dot[i] !== ']') i++;
            i += 2;
            dot = dot.substring(0, i) + 'n' + newNodeNum + ' [label="", shape=oval]\n' + dot.substring(i, dot.length);
            dot = addTrans(dot, 'n' + newNodeNum, key, '');
            for(let i = 0; i < ranks[key].length; i++){
                dot = inForLoop(ranks, key, i, dot, newNodeNum);
            }
            newNodeNum++;
        }
    }
    return dot;
}

function forwardingI(dot, i, ranks, key){
    while(dot.substring(i, i + ranks[key][ranks[key].length - 1].length  + 1) !== ranks[key][ranks[key].length - 1] + ' ') i++;
    return i;
}

function inForLoop(ranks, key, i, dot, newNodeNum){
    let deleteTransVals = deleteTrans(dot, ranks[key][i], key);
    dot = deleteTransVals[0];
    dot = addTrans(dot, ranks[key][i], 'n' + newNodeNum, deleteTransVals[1]);
    return dot;
}

function getExpStmValue(astNode){
    if(astNode['type'] === 'VariableDeclaration')
        return [processVariableDeclaration(astNode), '", shape=box'];
    else if(astNode['type'] === 'AssignmentExpression')
        return [processAssignmentExpression(astNode), '", shape=box'];
    else if(astNode['type'] === 'BinaryExpression')
        return [getValueBinExp(astNode), '", shape=diamond'];
    else
        return [processReturnStatement(astNode), '", shape=box'];
}

function processVariableDeclaration(astNode){
    let declarations = astNode['declarations'], ans = '', init, name;
    for(let i = 0; i < declarations.length; i++){
        init = getBasicValue(declarations[i]['init']);
        name = declarations[i]['id']['name'];
        ans += name + ' = ' + init + '\n';
    }
    return ans.substring(0, ans.length - 1);
}

function processAssignmentExpression(astNode){
    let left, right;
    left = getBasicValue(astNode['left']);
    right = getBasicValue(astNode['right']);
    return left + ' ' + astNode['operator'] + ' ' + right;
}

function processReturnStatement(astNode){
    let argument = astNode['argument'];
    return 'return ' + getBasicValue(argument);
}

function getBasicValue(exp){
    if(exp['type'] === 'Literal') return JSON.stringify(exp['value'], null, 2);
    else if(exp['type'] === 'Identifier') return exp['name'];
    else if(exp['type'] === 'UnaryExpression') return getValueUnaryExp(exp);
    else if(exp['type'] === 'MemberExpression') return getValueMemExp(exp);
    else return getValueBinExp(exp);
}

function getValueUnaryExp(exp){
    let operator = exp['operator'];
    let val = getBasicValue(exp['argument']);

    return '' + operator + '' + val;
}

function getValueMemExp(exp){
    let object = exp['object']['name'];
    let prop = getBasicValue(exp['property']);

    return '' + object + '[' + prop + ']';
}

function getValueBinExp(exp){
    let operator = exp['operator'];
    let left = getBasicValue(exp['left']);
    let right = getBasicValue(exp['right']);

    return '' + left + ' ' + operator + ' ' + right;
}

function addTrans(dot, fromTrans, toTrans, extra){
    return dot.substring(0, dot.length - 1) + fromTrans + ' -> ' + toTrans + ' [' + extra + ']\n}';
}

function deleteTrans(dot, fromTrans, toTrans){
    let prefixDot, suffixDot, deletedTrans = '';
    for(let i = 0; i < dot.length; i++){
        if(dot.substring(i, i + fromTrans.length + 4 + toTrans.length) === fromTrans + ' -> ' + toTrans){
            prefixDot = dot.substring(0, i);
            while(dot[i] !== '[') i++;
            i++;
            while(dot[i] !== ']'){
                deletedTrans += dot[i];
                i++;
            }
            i += 2;
            suffixDot = dot.substring(i, dot.length);
            break;
        }
    }
    return [prefixDot + suffixDot, deletedTrans];
}

function getAllInRanks(dot){
    let ans = {}, curKey = '', from = '', curVal, vals;

    for(let i = 0; i < dot.length; i++){
        if(dot.substring(i, i + 2) === '->'){
            vals = getAllInRanksInIfCalcs(dot, i, ans);
            i = vals[0];
            curKey = vals[1];
            curVal = vals[2];
            from = vals[3];
            if(curVal === undefined) ans[curKey] = [from];
            else curVal[curVal.length] = from;
        }
    }

    return ans;
}

function getAllInRanksInIfCalcs(dot, i, ans){
    let curKey = '', from = '', curVal;

    while(dot[i] !== 'n') i--;
    while(dot[i] !== ' '){
        from += dot[i];
        i++;
    }
    i += 4;
    while(dot[i] !== ' '){
        curKey += dot[i];
        i++;
    }
    curVal = ans[curKey];

    return [i, curKey, curVal, from];
}

export{editDot};
export{getBasicValue};
export{getExpStmValue};
export{labelChange_correctShapes};
export{deleteNonRelevantTrans};
export{deleteEntryExitNodes};
export{trueFalseToFT};
export{addNodeToIfEnd};

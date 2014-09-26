var RequestException = require('./request-exception');

(function () {
    'use strict';
    var NAMESPACE = 'request.model';

    function getPath(stack) {
        return stack.join('');
    }

    function findTarget(model, path) {
        if (!path) {
            return model;
        }
        var m = /^(@|!|#|\.)(\w+)(.*)/g.exec(path);
        if (!m) {
            throw new Error("Invalid Path Part: " + path);
        }
        var directive = m[1];
        var name = m[2];
        var rest = m[3];
        switch (directive) {
            case '!':
                return findTarget(model[name], rest);
            case '@':
                return findTarget(model.actions[name], rest);
            case '#':
                return findTarget(model.structures[name], rest);
            case '.':
                if (model.type !== 'object') {
                    throw new Error("Invalid path on non-object: " + path);
                }
                return findTarget(model.members[name], rest);
            default :
                throw new Error("Unknown directive: " + directive);
        }
        throw new Error("Not Implemented");
    }

    function expandObject(obj, serviceModel, nameStack, objStack) {
        objStack = objStack.concat(obj);
        if (typeof obj === 'string') {
            return expandObject(findTarget(serviceModel, obj), serviceModel, nameStack, objStack);
        }
        switch (obj.type) {
            case 'object':
                if (obj.members) {
                    for (var key in obj.members) {
                        var member = obj.members[key];
                        obj.members[key] = expandObject(member, serviceModel, nameStack.concat('.' + key), objStack);
                    }
                }
                break;
            case 'map':
                obj.values = expandObject(obj.values, serviceModel, nameStack.concat('!values'), objStack);
                break;
            case 'set':
                obj.members = expandObject(obj.members, serviceModel, nameStack.concat('!members'), objStack);
                break;
            case 'boolean':
            case 'integer':
            case 'enum':
            case 'string':
                break;
            default:
                throw new Error("Invalid object type: " + obj.type + ' at ' + getPath(nameStack));
        }
        return obj;
    }

    function validateAndBuildModel(serviceName) {
        var m = require('../../models/' + serviceName + '.json');
        if (m.actions) {
            for (var actionName in m.actions) {
                var actionDef = m.actions[actionName];
                if (actionDef.input) {
                    actionDef.input = expandObject(actionDef.input, m, ['@' + actionName, '!input'], [m, actionDef]);
                }
            }
        }
        return m;
    }

    module.exports = {
        validateAndBuildModel: validateAndBuildModel,
        findTarget: findTarget
    };
})();

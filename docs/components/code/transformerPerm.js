"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var constant_1 = require("./constant");
var regexResolverList = [
    {
        regex: /\/\*\[!perm ([a-zA-Z0-9.,{}: "]+)\]\*\/$/,
        resolver: function (value) {
            var _a;
            var _b = value.split('.'), letter = _b[0], restProps = _b[1];
            return {
                value: letter,
                properties: (_a = {},
                    _a[constant_1.propsMergeSymbol] = function (props) {
                        return __assign(__assign({}, props), restProps ? JSON.parse(restProps) : {});
                    },
                    _a),
            };
        },
    },
    {
        regex: /\/\*\[!perm_double ([a-zA-Z0-9.,{}: "]+)\]\*\/$/,
        resolver: function (value) {
            var _a;
            var _b = value.split('.'), letterA = _b[0], letterB = _b[1], restProps = _b[2];
            return {
                value: 'DoubleLetter',
                properties: (_a = {},
                    _a[constant_1.propsMergeSymbol] = function (props) {
                        return __assign(__assign(__assign({}, props), { letterA: letterA, letterB: letterB }), restProps ? JSON.parse(restProps) : {});
                    },
                    _a),
            };
        },
    },
];
function matchPipe(str) {
    var l = regexResolverList.length;
    for (var i = 0; i < l; i++) {
        var _a = regexResolverList[i], regex = _a.regex, resolver = _a.resolver;
        var match = str.match(regex);
        if (match) {
            var _b = resolver(match[1]), value = _b.value, properties = _b.properties;
            return {
                value: value,
                properties: properties,
                replaceValue: str.replace(regex, ''),
                match: true,
            };
        }
    }
    return {
        match: false,
    };
}
var transformer = {
    line: function (line) {
        line.children = line.children.reduce(function (allEle, ele) {
            if (ele.type === 'comment' || ele.type === 'text') {
                return allEle;
            }
            var pushInfo;
            allEle.push(__assign(__assign({}, ele), { children: ele.children.reduce(function (subChildren, subEle) {
                    var _a = matchPipe(subEle.value), match = _a.match, value = _a.value, replaceValue = _a.replaceValue, properties = _a.properties;
                    if (match) {
                        subChildren.push(__assign(__assign({}, subEle), { value: replaceValue }));
                        pushInfo = {
                            value: value,
                            properties: properties,
                        };
                    }
                    else {
                        subChildren.push(subEle);
                    }
                    return subChildren;
                }, []) }));
            if (pushInfo) {
                allEle.push({
                    type: 'element',
                    tagName: pushInfo.value,
                    properties: pushInfo.properties,
                });
            }
            return allEle;
        }, []);
    },
};
exports.default = transformer;

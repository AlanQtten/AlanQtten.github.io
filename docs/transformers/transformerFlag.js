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
var classnames_1 = require("classnames");
var regexWithStyle = [
    {
        regex: /\/\*\[!flag ([a-zA-Z0-9]+)\]\*\/$/,
        className: '!text-aq border border-solid border-aq p-1 text-xs rounded mr-2',
    },
    {
        regex: /\/\*\[!flag_error ([a-zA-Z0-9]+)\]\*\/$/,
        className: '!text-aq border border-solid border-aq p-1 text-xs rounded mr-2 bg-aq.error-800',
    },
];
function matchPipe(str) {
    var l = regexWithStyle.length;
    for (var i = 0; i < l; i++) {
        var _a = regexWithStyle[i], regex = _a.regex, className = _a.className;
        var match = str.match(regex);
        if (match) {
            return {
                value: match[1],
                className: className,
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
            var _a;
            if (ele.type === 'comment' || ele.type === 'text') {
                return allEle;
            }
            var pushInfo;
            allEle.push(__assign(__assign({}, ele), { children: (_a = ele.children) === null || _a === void 0 ? void 0 : _a.reduce(function (subChildren, subEle) {
                    var _a = matchPipe(subEle.value), match = _a.match, value = _a.value, replaceValue = _a.replaceValue, className = _a.className;
                    if (match) {
                        subChildren.push(__assign(__assign({}, subEle), { value: replaceValue }));
                        pushInfo = {
                            value: value,
                            className: className,
                        };
                    }
                    else {
                        subChildren.push(subEle);
                    }
                    return subChildren;
                }, []) }));
            if (pushInfo) {
                line.properties = __assign(__assign({}, line.properties), { class: (0, classnames_1.default)(line.properties.class, 'leading-8') });
                allEle.push({
                    type: 'element',
                    tagName: 'span',
                    properties: {
                        class: pushInfo.className,
                    },
                    children: [{ type: 'text', value: pushInfo.value }],
                });
            }
            return allEle;
        }, []);
    },
};
exports.default = transformer;

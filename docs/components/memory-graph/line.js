"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LineType = void 0;
exports.line = line;
var LineType;
(function (LineType) {
    // both side in vertical
    LineType["right2right"] = "right2right";
    LineType["left2left"] = "left2left";
    // different side in vertical
    LineType["right2left"] = "right2left";
    LineType["right2bottom2left"] = "right2bottom2left";
    // some simple curve
    LineType["right2bottom"] = "right2bottom";
    // some complex curve
    LineType["bottom2right"] = "bottom2right";
})(LineType || (exports.LineType = LineType = {}));
var verticalBothSide = [LineType.right2right, LineType.left2left];
var PathType;
(function (PathType) {
    PathType["M"] = "M";
    PathType["Q"] = "Q";
    PathType["T"] = "T";
    PathType["C"] = "C";
})(PathType || (PathType = {}));
var defaultPointerModifier = function (p) { return p; };
var _px = function (n) { return "".concat(n, "px"); };
function d2Str(d) {
    return d.map(function (_d) {
        if (_d[0] === PathType.C) {
            return "C ".concat(_d[1], " ").concat(_d[2], ", ").concat(_d[3], " ").concat(_d[4], ", ").concat(_d[5], " ").concat(_d[6]);
        }
        return _d.join(' ');
    }).join(' ');
}
function pipeModifier(d, modifier, pkg) {
    if (!modifier)
        return d;
    if (modifier.D) {
        return modifier.D(d, pkg);
    }
    return d.map(function (_d) {
        switch (_d[0]) {
            case PathType.M: return modifier.M ? __spreadArray([PathType.M], modifier.M(_d.slice(1), pkg), true) : _d;
            case PathType.Q: return modifier.Q ? __spreadArray([PathType.Q], modifier.Q(_d.slice(1), pkg), true) : _d;
            case PathType.T: return modifier.T ? __spreadArray([PathType.T], modifier.T(_d.slice(1), pkg), true) : _d;
            case PathType.C: return modifier.C ? __spreadArray([PathType.C], modifier.C(_d.slice(1), pkg), true) : _d;
        }
        return _d;
    });
}
function line(start, end, _lineType, options) {
    var _a, _b, _c, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    var _r, _s, _t, _u, _v;
    if (options === void 0) { options = {}; }
    var reverse = options.reverse, customModifier = options.modifier, _w = options.startFrom, startFrom = _w === void 0 ? 'center' : _w, _x = options.pointTo, pointTo = _x === void 0 ? 'center' : _x, wrapper = options.wrapper;
    var lineType = typeof _lineType === 'string' ? _lineType : _lineType.lineType;
    var lineTypeOptions = typeof _lineType === 'object' ? _lineType.options : {};
    var offsetX = lineTypeOptions.offsetX;
    var offsetY = lineTypeOptions.offsetY;
    var _y = (wrapper !== null && wrapper !== void 0 ? wrapper : start.parentElement).getBoundingClientRect(), 
    // width: pw, height: ph,
    pt = _y.top, pl = _y.left;
    var _z = start.getBoundingClientRect(), sw = _z.width, sh = _z.height, st = _z.top, sl = _z.left;
    var _0 = end.getBoundingClientRect(), ew = _0.width, eh = _0.height, et = _0.top, el = _0.left;
    var psMd = (_r = customModifier === null || customModifier === void 0 ? void 0 : customModifier.pointStart) !== null && _r !== void 0 ? _r : defaultPointerModifier;
    var peMd = (_s = customModifier === null || customModifier === void 0 ? void 0 : customModifier.pointEnd) !== null && _s !== void 0 ? _s : defaultPointerModifier;
    var isVerticalBothSide = verticalBothSide.includes(lineType);
    var reverseStartAndEnd = st > et && isVerticalBothSide;
    if (reverseStartAndEnd) {
        _a = [ew, sw], sw = _a[0], ew = _a[1];
        _b = [eh, sh], sh = _b[0], eh = _b[1];
        _c = [et, st], st = _c[0], et = _c[1];
        _e = [el, sl], sl = _e[0], el = _e[1];
        reverse = !reverse;
    }
    var sl2p = sl - pl;
    var st2p = st - pt;
    var el2p = el - pl;
    var et2p = et - pt;
    var gapY = Math.abs(st - et) - (st > et ? eh : sh);
    var gapX = Math.abs(sl - el) - (sl > el ? ew : sw);
    var h = gapY + sh + eh;
    var l = Math.min(sl, el) - pl;
    var t = Math.min(st, et) - pt;
    var w = isVerticalBothSide ? Math.max(sw, ew) : Math.abs(sl - el) + ew;
    var d = [];
    var transform = '';
    var psl = sl2p - l + sw / 2; // pointer start left
    var pst = st2p - t + sh / 2; // pointer start top
    var pel = el2p - l + ew / 2; // pointer end left
    var pet = et2p - t + eh / 2; // pointer end top
    var pkg = {
        startWidth: sw,
        startHeight: sh,
        endWidth: ew,
        endHeight: eh,
        pointerStartLeft: psl,
        pointerStartTop: pst,
        pointerEndLeft: pel,
        pointerEndTop: pet,
    };
    switch (lineType) {
        case LineType.right2right:
            if (startFrom === 'edge') {
                reverseStartAndEnd ? (pel += ew / 2) : (psl += sw / 2);
            }
            if (pointTo === 'edge') {
                reverseStartAndEnd ? (psl += sw / 2) : (pel += ew / 2);
            }
            w += 100;
            _f = psMd([psl, pst], pkg), psl = _f[0], pst = _f[1];
            _g = peMd([pel, pet], pkg), pel = _g[0], pet = _g[1];
            d.push([PathType.M, psl, pst], [PathType.C, w, h * 0.1, w, h * 0.9, pel, pet]);
            transform = "translate(".concat(reverse ? "".concat(psl + 5, " ").concat(pst) : "".concat(pel + 5, " ").concat(pet), ") rotate(180)");
            break;
        case LineType.left2left:
            if (startFrom === 'edge') {
                reverseStartAndEnd ? (pel -= ew / 2) : (psl -= sw / 2);
            }
            if (pointTo === 'edge') {
                reverseStartAndEnd ? (psl -= sw / 2) : (pel -= ew / 2);
            }
            w += 100;
            l -= 100;
            _h = psMd([psl, pst], pkg), psl = _h[0], pst = _h[1];
            _j = peMd([pel, pet], pkg), pel = _j[0], pet = _j[1];
            d.push([PathType.M, psl + 100, pst], [PathType.C, 0, h * 0.1, 0, h * 0.9, pel + 100, pet]);
            transform = "translate(".concat(reverse ? "".concat(psl + 100 - 5, " ").concat(pst) : "".concat(pel + 100 - 5, " ").concat(pet), ")");
            break;
        case LineType.right2left:
            if (startFrom === 'edge') {
                psl += sw / 2;
            }
            if (pointTo === 'edge') {
                pel -= ew / 2;
            }
            _k = psMd([psl, pst], pkg), psl = _k[0], pst = _k[1];
            _l = peMd([pel, pet], pkg), pel = _l[0], pet = _l[1];
            d.push([PathType.M, psl, pst], st < et
                ? [PathType.Q, pel * 0.5, h * 0.75, pel * 0.5, h * 0.5]
                : [PathType.Q, pel * 0.5, h * 0.75, pel * 0.5, h * 0.5], [PathType.T, pel, pet]);
            transform = "translate(".concat(reverse ? "".concat(psl + 5, " ").concat(pst) : "".concat(pel - 5, " ").concat(pet), ") rotate(").concat(reverse ? 180 : 0, ")");
            break;
        case LineType.right2bottom2left:
            if (startFrom === 'edge') {
                psl += sw / 2;
            }
            if (pointTo === 'edge') {
                pel -= ew / 2;
            }
            h += 64;
            _m = psMd([psl, pst], pkg), psl = _m[0], pst = _m[1];
            _o = peMd([pel, pet], pkg), pel = _o[0], pet = _o[1];
            d.push([PathType.M, psl, pst], [PathType.C, sw + gapX * 0.7, pst - sh / 4, gapX * 0.1, h, sw + gapX / 2, h - 1], [PathType.C, sw + gapX * 1.3, h, sw + gapX * 0.5, pet - eh / 3, pel, pet]);
            transform = "translate(".concat(reverse ? "".concat(psl + 5, " ").concat(pst) : "".concat(pel - 5, " ").concat(pet), ") rotate(").concat(reverse ? 180 : 0, ")");
            break;
        case LineType.right2bottom:
            if (startFrom === 'edge') {
                psl += sw / 2;
            }
            if (pointTo === 'edge') {
                pet += eh / 2;
            }
            _p = psMd([psl, pst], pkg), psl = _p[0], pst = _p[1];
            _q = peMd([pel, pet], pkg), pel = _q[0], pet = _q[1];
            offsetX = (_t = lineTypeOptions.offsetX) !== null && _t !== void 0 ? _t : 0;
            w += offsetX;
            d.push([PathType.M, psl, pst], [PathType.Q, sw + gapX * 0.4, h * 0.9, sw + gapX * 0.75, h * 0.8], [PathType.T, pel, pet]);
            transform = "translate(".concat(pel, " ").concat(pet + 5, ") rotate(-90)");
            break;
        case LineType.bottom2right:
            if (startFrom === 'edge') {
                pst += sh / 2;
            }
            if (pointTo === 'edge') {
                pel += ew / 2;
            }
            offsetX = (_u = lineTypeOptions.offsetX) !== null && _u !== void 0 ? _u : 120;
            offsetY = (_v = lineTypeOptions.offsetY) !== null && _v !== void 0 ? _v : 120;
            h += offsetY;
            w += offsetX;
            d.push([PathType.M, psl, pst], [PathType.C, psl, pst + offsetY, pel + offsetX, pst + offsetY, pel + offsetX, pet + Math.max((pst + offsetY) / 3, gapY)], [PathType.Q, pel + offsetX, pet, pel, pet]);
            transform = "translate(".concat(pel + 5, " ").concat(pet, ") rotate(180)");
            break;
        default:
            break;
    }
    pkg.pointerStartLeft = psl;
    pkg.pointerStartTop = pst;
    pkg.pointerEndLeft = pel;
    pkg.pointerEndTop = pet;
    return [{
            key: 0,
            style: {
                // background: 'rgba(255, 0, 0, .1)',
                position: 'absolute',
                width: _px(w),
                height: _px(h),
                left: _px(l),
                top: _px(t),
            },
            path: { d: d2Str(pipeModifier(d, customModifier, pkg)) },
            polygon: {
                transform: transform,
            },
        }];
}

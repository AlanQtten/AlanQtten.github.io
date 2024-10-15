"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Vec = Vec;
function Vec(param) {
    var cap = param.cap, point2 = param.point2;
    return {
        title: 'Vec',
        body: [
            {
                name: 'buf',
                value: {
                    title: 'RawVec',
                    body: [
                        {
                            name: 'ptr',
                            value: {
                                title: 'Unique',
                                body: [
                                    {
                                        name: 'pointer',
                                        value: {
                                            title: 'NonNull',
                                            body: [{ name: 'pointer', point2: point2 }],
                                        },
                                    },
                                ],
                            },
                        },
                        { name: 'cap', value: cap },
                    ],
                },
            },
            { name: 'len', value: cap },
        ],
    };
}

(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/preview-pane.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>PreviewPane)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__ = __turbopack_context__.i("[project]/node_modules/react-markdown/lib/index.js [app-client] (ecmascript) <export Markdown as default>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$remark$2d$gfm$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/remark-gfm/lib/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$latex$2d$next$2f$dist$2f$index$2e$es$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-latex-next/dist/index.es.js [app-client] (ecmascript)");
'use client';
;
;
;
;
const renderers = {
    p: (paragraph)=>{
        const { node } = paragraph;
        // Check if the paragraph contains a single text node that is a latex block
        if (node.children.length === 1 && node.children[0].type === 'text' && /^\$\$[\s\S]*\$\$$/.test(node.children[0].value)) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$latex$2d$next$2f$dist$2f$index$2e$es$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                children: node.children[0].value
            }, void 0, false, {
                fileName: "[project]/src/components/preview-pane.tsx",
                lineNumber: 17,
                columnNumber: 14
            }, this);
        }
        // Check if the paragraph contains an inline code element that is a latex block
        if (node.children.length === 1 && node.children[0].tagName === 'code' && node.children[0].children.length > 0 && /^\$\$[\s\S]*\$\$$/.test(node.children[0].children[0].value)) {
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$latex$2d$next$2f$dist$2f$index$2e$es$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                children: node.children[0].children[0].value
            }, void 0, false, {
                fileName: "[project]/src/components/preview-pane.tsx",
                lineNumber: 25,
                columnNumber: 16
            }, this);
        }
        // This is to prevent <pre> being a descendant of <p>
        // which causes a hydration error.
        if (node.children.length === 1 && node.children[0].tagName === "code") {
            const child = node.children[0];
            const childString = child.children[0]?.value || '';
            // If it's a block code (not inline and not latex)
            if (child.tagName === 'code' && !/^\$[\s\S]*\$$/.test(childString)) {
                return paragraph.children;
            }
        }
        // Otherwise, render as a normal paragraph
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            children: paragraph.children
        }, void 0, false, {
            fileName: "[project]/src/components/preview-pane.tsx",
            lineNumber: 41,
            columnNumber: 12
        }, this);
    },
    code: (props)=>{
        const { inline, children, className } = props;
        const childString = String(children);
        if (inline) {
            // This is for inline latex like $...$
            if (childString.startsWith('$') && childString.endsWith('$')) {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$latex$2d$next$2f$dist$2f$index$2e$es$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                    children: childString
                }, void 0, false, {
                    fileName: "[project]/src/components/preview-pane.tsx",
                    lineNumber: 50,
                    columnNumber: 20
                }, this);
            }
            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                className: className,
                children: children
            }, void 0, false, {
                fileName: "[project]/src/components/preview-pane.tsx",
                lineNumber: 52,
                columnNumber: 16
            }, this);
        }
        // This is for block latex in code blocks like $$...$$
        if (/^\$\$[\s\S]*\$\$$/.test(childString)) {
            // We return null here because the 'p' renderer will handle it.
            return null;
        }
        // This handles code blocks from markdown that aren't latex
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                className: className,
                children: children
            }, void 0, false, {
                fileName: "[project]/src/components/preview-pane.tsx",
                lineNumber: 62,
                columnNumber: 17
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/preview-pane.tsx",
            lineNumber: 62,
            columnNumber: 12
        }, this);
    }
};
function PreviewPane({ content, type }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "preview-content h-full",
        children: [
            type === 'markdown' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$markdown$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__Markdown__as__default$3e$__["default"], {
                remarkPlugins: [
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$remark$2d$gfm$2f$lib$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"]
                ],
                components: renderers,
                children: content
            }, void 0, false, {
                fileName: "[project]/src/components/preview-pane.tsx",
                lineNumber: 71,
                columnNumber: 9
            }, this),
            type === 'html' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("iframe", {
                srcDoc: content,
                title: "HTML Preview",
                sandbox: "allow-scripts allow-modals",
                className: "w-full h-full border-0"
            }, void 0, false, {
                fileName: "[project]/src/components/preview-pane.tsx",
                lineNumber: 79,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/preview-pane.tsx",
        lineNumber: 69,
        columnNumber: 5
    }, this);
}
_c = PreviewPane;
var _c;
__turbopack_context__.k.register(_c, "PreviewPane");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_components_preview-pane_tsx_aa50bb87._.js.map
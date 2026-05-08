interface Internal {
    convertToString: (value: any) => string;
    convertUnsafeArrayToString: (value: any[]) => string;
}
const internal: Internal = {
    convertToString: (v) => v === null ? "null" : v === undefined ? "undefined" : typeof v == "string" ? v : JSON.stringify(v),
    convertUnsafeArrayToString: (v) => v.map(internal.convertToString).join("")
};
export { internal };
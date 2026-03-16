import { io } from  "../defs.js";

type Meta = {
    cv: string,
    gsv: string
};
function meta(path: string): Meta {
    const m: Meta = { cv: "", gsv: "" };
    const out = io.readuntil(path, (l) => l.startsWith("//"));
    const regex = (key: string): RegExp => new RegExp(`\\/\\/ ${key}=`);
    const val = (str?: string): string => (str && str.split("=")[1]) ?? "";
    m.cv = val(out.find((v) => regex("cv").test(v)));
    m.gsv = val(out.find((v) => regex("gsv").test(v)));
    return m;
}

export { meta };
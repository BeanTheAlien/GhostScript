function div(res, ...args) {
    const div = document.createElement("div");
    div.innerHTML = res(...args);
    return div;
}
function add(el) {
    document.body.appendChild(el);
}
function Type(name, desc, vals = null) {
    return `<div>
        <h3>${name}</h3>
        <p>${desc}</p>
        <p>${vals ?? ""}</p>
    </div>`;
}

add(div(Type, "Entity", "The core, object-like type.", "Represents any value that is not null or undefined."));
add(div(Type, "String", "Represents a string."));
add(div(Type, "Int", "Represents an integer value.", "Value limited to +-2,147,483,647."));
add(div(Type, "Double", "Represents a double-accuracy floating-point value.", "Value limited to +-1.7976931348623157E+308."));
add(div(Type, "Array", "Represents a list of values. Arrays are heterogeneous by default."));
add(div(Type, "Bool", "Represents a value that is true or false."));
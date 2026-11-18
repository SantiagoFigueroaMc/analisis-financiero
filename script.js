var daysInPeriod = 360;
var mathNamespace = "http://www.w3.org/1998/Math/MathML";
var storageKey = "indicadores-financieros-session-v1";

function m(tag, ...children){
    return [tag, ...children];
}

function text(value){
    return m("mtext", value);
}

function op(value){
    return m("mo", value);
}

function fraction(numerator, denominator){
    return m("mfrac", numerator, denominator);
}

function safeDivide(numerator, denominator){
    return denominator === 0 || !Number.isFinite(denominator) ? NaN : numerator / denominator;
}

var numberFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

function formatNumber(value){
    return Number.isFinite(value) ? numberFormatter.format(value) : "N/A";
}

var fields = [
    { key: "sales", label: "Ventas del período" },
    { key: "costOfSales", label: "Costo de ventas" },
    { key: "sellingAdmin", label: "Gastos de administración y ventas (GAV)" },
    { key: "depreciation", label: "Depreciación" },
    { key: "financialInterests", label: "Intereses financieros" },
    { key: "incomeTaxes", label: "Impuestos" },
    { key: "netIncome", label: "Resultado neto" },
    { key: "totalAssets", label: "Activo total" },
    { key: "currentAssets", label: "Activo corriente" },
    { key: "currentLiabilities", label: "Pasivo corriente" },
    { key: "endingInventory", label: "Existencias al cierre" },
    { key: "cash", label: "Caja" },
    { key: "totalLiabilities", label: "Pasivo total" },
    { key: "equity", label: "Patrimonio neto" },
    { key: "accountsReceivable", label: "Cuentas por cobrar" },
    { key: "suppliers", label: "Proveedores" },
    { key: "openingInventory", label: "Existencias iniciales (Year 1)", openingInventory: true }
];

var indicators = [
    {
        id: "gross-margin",
        label: "Margen bruto",
        description: "Muestra qué porcentaje de las ventas queda después de cubrir el costo directo de los productos o servicios vendidos. El saldo contribuye a cubrir los demás gastos y generar utilidad.",
        variables: ["sales", "costOfSales"],
        unit: "percent",
        calculateAmount: function(v){
            return v.sales - v.costOfSales;
        },
        formulaLabel: "Margen bruto es igual a ventas menos costo de ventas, dividido por ventas, multiplicado por cien",
        formula: m("mrow", text("Margen bruto"), op("="), fraction(
            m("mrow", text("Ventas"), op("−"), text("Costo de ventas")),
            text("Ventas")
        ), op("×"), text("100%")),
        calculate: function(v){
            return safeDivide(v.sales - v.costOfSales, v.sales) * 100;
        }
    },
    {
        id: "operating-margin",
        label: "Margen operativo",
        description: "Mide la rentabilidad de la operación antes de intereses e impuestos. Descuenta de las ventas el costo de ventas, los GAV y la depreciación.",
        variables: ["sales", "costOfSales", "sellingAdmin", "depreciation"],
        unit: "percent",
        calculateAmount: function(v){
            return v.sales - v.costOfSales - v.sellingAdmin - v.depreciation;
        },
        formulaLabel: "Margen operativo es igual a ventas menos costo de ventas, gastos de administración y ventas y depreciación, dividido por ventas, multiplicado por cien",
        formula: m("mrow", text("Margen operativo"), op("="), fraction(
            m("mrow", text("Ventas"), op("−"), text("Costo de ventas"), op("−"), text("GAV"), op("−"), text("Depreciación")),
            text("Ventas")
        ), op("×"), text("100%")),
        calculate: function(v){
            return safeDivide(v.sales - v.costOfSales - v.sellingAdmin - v.depreciation, v.sales) * 100;
        }
    },
    {
        id: "ebitda",
        label: "EBITDA",
        description: "Estima el resultado de la operación antes de intereses, impuestos, depreciación y amortización. Su porcentaje sobre ventas muestra el margen EBITDA. Es una aproximación al flujo de caja operativo, pero no equivale al efectivo disponible.",
        variables: ["sales", "costOfSales", "sellingAdmin"],
        unit: "amount",
        formulaLabel: "EBITDA es igual a ventas menos costo de ventas y gastos de administración y ventas. El margen EBITDA es EBITDA dividido por ventas, multiplicado por cien",
        formula: m("mtable",
            m("mtr", m("mtd", m("mrow", text("EBITDA"), op("="), text("Ventas"), op("−"), text("Costo de ventas"), op("−"), text("GAV")))),
            m("mtr", m("mtd", m("mrow", text("Margen EBITDA"), op("="), fraction(text("EBITDA"), text("Ventas")), op("×"), text("100%"))))
        ),
        calculate: function(v){
            return v.sales - v.costOfSales - v.sellingAdmin;
        },
        calculatePercentage: function(v, amount){
            return safeDivide(amount, v.sales) * 100;
        }
    },
    {
        id: "net-margin",
        label: "Margen neto",
        description: "Indica qué porcentaje de las ventas se convierte en resultado neto después de costos, gastos, intereses e impuestos.",
        variables: ["netIncome", "sales"],
        unit: "percent",
        calculateAmount: function(v){
            return v.netIncome;
        },
        formulaLabel: "Margen neto es igual al resultado neto dividido por ventas, multiplicado por cien",
        formula: m("mrow", text("Margen neto"), op("="), fraction(text("Resultado neto"), text("Ventas")), op("×"), text("100%")),
        calculate: function(v){
            return safeDivide(v.netIncome, v.sales) * 100;
        }
    },
    {
        id: "roa",
        label: "ROA (rentabilidad sobre activos)",
        description: "Mide cuánto resultado operativo generan los activos de la empresa, independientemente de si se financiaron con deuda o patrimonio. Se presenta antes de impuestos.",
        variables: ["sales", "costOfSales", "sellingAdmin", "depreciation", "totalAssets"],
        unit: "percent",
        formulaLabel: "ROA es igual al resultado operativo dividido por activo total, multiplicado por cien",
        formula: m("mrow", text("ROA"), op("="), fraction(
            m("mrow", text("Ventas"), op("−"), text("Costo de ventas"), op("−"), text("GAV"), op("−"), text("Depreciación")),
            text("Activo total")
        ), op("×"), text("100%")),
        calculate: function(v){
            var ebit = v.sales - v.costOfSales - v.sellingAdmin - v.depreciation;
            return safeDivide(ebit, v.totalAssets) * 100;
        }
    },
    {
        id: "roe",
        label: "ROE (rentabilidad sobre patrimonio)",
        description: "Mide el resultado neto generado por cada unidad de patrimonio neto; aproxima la rentabilidad para los accionistas.",
        variables: ["netIncome", "equity"],
        unit: "percent",
        formulaLabel: "ROE es igual al resultado neto dividido por patrimonio neto, multiplicado por cien",
        formula: m("mrow", text("ROE"), op("="), fraction(text("Resultado neto"), text("Patrimonio neto")), op("×"), text("100%")),
        calculate: function(v){
            return safeDivide(v.netIncome, v.equity) * 100;
        }
    },
    {
        id: "current-ratio",
        label: "Razón corriente",
        description: "Compara los activos corrientes con las obligaciones de corto plazo para mostrar cuántas veces podrían cubrirlas.",
        variables: ["currentAssets", "currentLiabilities"],
        unit: "multiple",
        formulaLabel: "Razón corriente es igual a activo corriente dividido por pasivo corriente",
        formula: m("mrow", text("Razón corriente"), op("="), fraction(text("Activo corriente"), text("Pasivo corriente"))),
        calculate: function(v){
            return safeDivide(v.currentAssets, v.currentLiabilities);
        }
    },
    {
        id: "acid-test",
        label: "Prueba ácida",
        description: "Evalúa la cobertura de las obligaciones de corto plazo excluyendo las existencias, que pueden ser menos líquidas que otros activos corrientes.",
        variables: ["currentAssets", "endingInventory", "currentLiabilities"],
        unit: "multiple",
        formulaLabel: "Prueba ácida es igual a activo corriente menos existencias, dividido por pasivo corriente",
        formula: m("mrow", text("Prueba ácida"), op("="), fraction(
            m("mrow", text("Activo corriente"), op("−"), text("Existencias al cierre")),
            text("Pasivo corriente")
        )),
        calculate: function(v){
            return safeDivide(v.currentAssets - v.endingInventory, v.currentLiabilities);
        }
    },
    {
        id: "cash-days",
        label: "Días de caja",
        description: "Estima cuántos días de gastos del período podría cubrir el saldo de caja disponible al cierre.",
        variables: ["cash", "costOfSales", "sellingAdmin", "depreciation", "financialInterests", "incomeTaxes"],
        unit: "days",
        formulaLabel: "Días de caja es igual a caja dividida por la suma del costo de ventas, gastos de administración y ventas, depreciación, intereses e impuestos, multiplicado por 360",
        formula: m("mrow", text("Días de caja"), op("="), fraction(
            text("Caja"),
            m("mrow", text("Costo de ventas"), op("+"), text("GAV"), op("+"), text("Depreciación"), op("+"), text("Intereses"), op("+"), text("Impuestos"))
        ), op("×"), text("360")),
        calculate: function(v){
            var expenses = v.costOfSales + v.sellingAdmin + v.depreciation + v.financialInterests + v.incomeTaxes;
            return safeDivide(v.cash * daysInPeriod, expenses);
        }
    },
    {
        id: "leverage",
        label: "Leverage",
        description: "Compara los recursos aportados por terceros (pasivo total) con los recursos aportados por la empresa (patrimonio neto).",
        variables: ["totalLiabilities", "equity"],
        unit: "multiple",
        formulaLabel: "Leverage es igual a pasivo total dividido por patrimonio neto",
        formula: m("mrow", text("Leverage"), op("="), fraction(text("Pasivo total"), text("Patrimonio neto"))),
        calculate: function(v){
            return safeDivide(v.totalLiabilities, v.equity);
        }
    },
    {
        id: "collection-days",
        label: "Días de cobro a clientes",
        description: "Estima el plazo promedio, en días, que tarda la empresa en cobrar las cuentas pendientes de sus clientes.",
        variables: ["accountsReceivable", "sales"],
        unit: "days",
        formulaLabel: "Días de cobro a clientes es igual a cuentas por cobrar dividido por ventas del período, multiplicado por 360",
        formula: m("mrow", text("Días de cobro a clientes"), op("="), fraction(text("Cuentas por cobrar"), text("Ventas del período")), op("×"), text("360")),
        calculate: function(v){
            return safeDivide(v.accountsReceivable * daysInPeriod, v.sales);
        }
    },
    {
        id: "inventory-days",
        label: "Días de existencia",
        description: "Estima para cuántos días de ventas alcanza el inventario al cierre, usando el costo de ventas diario del período.",
        variables: ["endingInventory", "costOfSales"],
        unit: "days",
        formulaLabel: "Días de existencia es igual a existencias al cierre dividido por costo de ventas, multiplicado por 360",
        formula: m("mrow", text("Días de existencia"), op("="), fraction(text("Existencias al cierre"), text("Costo de ventas")), op("×"), text("360")),
        calculate: function(v){
            return safeDivide(v.endingInventory * daysInPeriod, v.costOfSales);
        }
    },
    {
        id: "supplier-days",
        label: "Días de pago a proveedores",
        description: "Estima el plazo promedio de pago a proveedores. Las compras se calculan como existencias finales menos iniciales más costo de ventas.",
        variables: ["suppliers", "endingInventory", "openingInventory", "costOfSales"],
        unit: "days",
        formulaLabel: "Días de pago a proveedores es igual a proveedores dividido por existencias al cierre menos existencias iniciales más costo de ventas, multiplicado por 360",
        formula: m("mrow", text("Días de pago a proveedores"), op("="), fraction(
            text("Proveedores"),
            m("mrow", text("Existencias al cierre"), op("−"), text("Existencias iniciales"), op("+"), text("Costo de ventas"))
        ), op("×"), text("360")),
        calculate: function(v){
            var purchases = v.endingInventory - v.openingInventory + v.costOfSales;
            return safeDivide(v.suppliers * daysInPeriod, purchases);
        }
    }
];

var years = [1, 2];
var valuesByField = {};

fields.forEach(function(field){
    valuesByField[field.key] = [NaN, NaN];
});

function showStorageError(message){
    var status = document.getElementById("storage_status");
    status.textContent = message;
    status.hidden = false;
}

function isValidSavedState(state){
    if (!state || state.version !== 1 || !Array.isArray(state.years) || state.years.length < 2) {
        return false;
    }

    if (!state.years.every(function(year, index){
        return year === index + 1;
    })) {
        return false;
    }

    if (!state.values || typeof state.values !== "object") {
        return false;
    }

    return fields.every(function(field){
        var savedValues = state.values[field.key];
        return Array.isArray(savedValues)
            && savedValues.length === state.years.length
            && savedValues.every(function(value){
                return value === null || (typeof value === "number" && Number.isFinite(value));
            });
    });
}

function restoreSessionState(){
    var saved;
    try {
        saved = sessionStorage.getItem(storageKey);
    } catch (error) {
        showStorageError("El navegador no permitió leer los datos guardados de esta sesión.");
        return;
    }

    if (saved === null) {
        return;
    }

    var state;
    try {
        state = JSON.parse(saved);
    } catch (error) {
        showStorageError("No se pudieron restaurar los datos guardados porque el estado de la sesión no es válido.");
        return;
    }

    if (!isValidSavedState(state)) {
        showStorageError("No se pudieron restaurar los datos guardados porque tienen un formato incompatible.");
        return;
    }

    years = state.years.slice();
    fields.forEach(function(field){
        valuesByField[field.key] = state.values[field.key].map(function(value){
            return value === null ? NaN : value;
        });
    });
}

function saveSessionState(){
    var state = {
        version: 1,
        years: years,
        values: {}
    };

    fields.forEach(function(field){
        state.values[field.key] = valuesByField[field.key].map(function(value){
            return Number.isFinite(value) ? value : null;
        });
    });

    try {
        sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {
        showStorageError("No se pudieron guardar los cambios en esta sesión. Revisa la configuración o el espacio disponible del navegador.");
    }
}

function createMathNode(spec){
    var element = document.createElementNS(mathNamespace, spec[0]);
    spec.slice(1).forEach(function(child){
        if (Array.isArray(child)) {
            element.appendChild(createMathNode(child));
        } else {
            element.appendChild(document.createTextNode(child));
        }
    });
    return element;
}

function createInfoButton(indicator, context){
    var button = document.createElement("button");
    button.className = "indicator-info-button";
    button.type = "button";
    button.textContent = "i";
    button.setAttribute("aria-label", "Información sobre " + indicator.label);
    button.setAttribute("aria-controls", "indicator-info-popup");
    button.setAttribute("aria-expanded", "false");
    button.dataset.indicatorInfo = indicator.id;
    button.dataset.infoContext = context;
    return button;
}

function createIndicatorInfoPopup(){
    var popup = document.createElement("aside");
    popup.id = "indicator-info-popup";
    popup.className = "indicator-info-popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-labelledby", "indicator-info-title");
    popup.hidden = true;

    var title = document.createElement("h3");
    title.id = "indicator-info-title";
    popup.appendChild(title);

    var description = document.createElement("p");
    description.className = "indicator-info-description";
    popup.appendChild(description);

    var formulaSection = document.createElement("section");
    formulaSection.className = "indicator-info-formula";
    var formulaHeading = document.createElement("h4");
    formulaHeading.textContent = "Fórmula";
    formulaSection.appendChild(formulaHeading);
    var formula = document.createElement("div");
    formula.className = "indicator-info-math";
    formulaSection.appendChild(formula);
    popup.appendChild(formulaSection);

    var variableHeading = document.createElement("h4");
    variableHeading.textContent = "Variables relacionadas";
    popup.appendChild(variableHeading);

    var variables = document.createElement("ul");
    variables.className = "indicator-info-variables";
    popup.appendChild(variables);
    document.body.appendChild(popup);
    return popup;
}

function setInfoPopupPosition(button, popup){
    var buttonRect = button.getBoundingClientRect();
    var popupRect = popup.getBoundingClientRect();
    var margin = 12;
    var left = Math.min(
        Math.max(margin, buttonRect.left),
        window.innerWidth - popupRect.width - margin
    );
    var top = buttonRect.bottom + 8;

    if (top + popupRect.height > window.innerHeight - margin) {
        top = buttonRect.top - popupRect.height - 8;
    }

    popup.style.left = left + "px";
    popup.style.top = Math.max(margin, top) + "px";
}

function repositionOpenInfoPopup(popup){
    if (popup.hidden) {
        return;
    }

    var button = document.querySelector(".indicator-info-button[aria-expanded='true']");
    if (button) {
        setInfoPopupPosition(button, popup);
    }
}

function openInfoPopup(button, popup){
    var indicator = indicators.find(function(item){
        return item.id === button.dataset.indicatorInfo;
    });
    if (!indicator) {
        return;
    }

    popup.querySelector("#indicator-info-title").textContent = indicator.label;
    popup.querySelector(".indicator-info-description").textContent = indicator.description;
    var formulaSection = popup.querySelector(".indicator-info-formula");
    var formulaContainer = popup.querySelector(".indicator-info-math");
    formulaContainer.replaceChildren();
    formulaSection.hidden = !indicator.formula;
    if (indicator.formula) {
        var formula = createMathNode(m("math", indicator.formula));
        formula.setAttribute("display", "block");
        formula.setAttribute("aria-label", indicator.formulaLabel || "Fórmula de " + indicator.label);
        formulaContainer.appendChild(formula);
    }

    var variableList = popup.querySelector(".indicator-info-variables");
    variableList.replaceChildren();

    indicator.variables.forEach(function(key){
        var field = fields.find(function(item){
            return item.key === key;
        });
        var variable = document.createElement("li");
        variable.textContent = field.openingInventory
            ? "Existencias iniciales (cierre del año anterior)"
            : field.label;
        variableList.appendChild(variable);
    });

    popup.hidden = false;
    popup.dataset.openFor = indicator.id;
    popup.dataset.context = button.dataset.infoContext;
    document.querySelectorAll(".indicator-info-button[aria-expanded='true']").forEach(function(openButton){
        openButton.setAttribute("aria-expanded", "false");
    });
    button.setAttribute("aria-expanded", "true");
    setInfoPopupPosition(button, popup);
}

function closeInfoPopup(popup){
    if (popup.hidden) {
        return;
    }

    popup.hidden = true;
    document.querySelectorAll(".indicator-info-button[aria-expanded='true']").forEach(function(button){
        button.setAttribute("aria-expanded", "false");
    });
}

function loadInfoPopup(){
    var popup = createIndicatorInfoPopup();

    document.addEventListener("click", function(event){
        var button = event.target.closest(".indicator-info-button");
        if (button) {
            event.preventDefault();
            if (!popup.hidden && popup.dataset.openFor === button.dataset.indicatorInfo
                && popup.dataset.context === button.dataset.infoContext) {
                closeInfoPopup(popup);
            } else {
                openInfoPopup(button, popup);
            }
            return;
        }

        if (!popup.contains(event.target)) {
            closeInfoPopup(popup);
        }
    });

    document.addEventListener("keydown", function(event){
        if (event.key === "Escape") {
            closeInfoPopup(popup);
        }
    });

    window.addEventListener("resize", function(){
        repositionOpenInfoPopup(popup);
    });
    window.addEventListener("scroll", function(){
        repositionOpenInfoPopup(popup);
    }, true);
}

function renderSummaryTable(){
    var table = document.getElementById("indicadores_financieros");
    var header = document.createElement("tr");
    var indicatorHeader = document.createElement("th");
    indicatorHeader.textContent = "Indicador";
    header.appendChild(indicatorHeader);

    years.forEach(function(year){
        var cell = document.createElement("th");
        cell.textContent = "Year " + year;
        header.appendChild(cell);
    });
    table.querySelector("thead").replaceChildren(header);

    var body = document.createElement("tbody");
    indicators.forEach(function(indicator){
        var row = document.createElement("tr");
        var label = document.createElement("th");
        label.scope = "row";
        var title = document.createElement("span");
        title.className = "indicator-title";
        title.textContent = indicator.label;
        label.appendChild(title);
        label.appendChild(createInfoButton(indicator, "summary"));
        row.appendChild(label);

        years.forEach(function(year, index){
            var cell = document.createElement("td");
            var result = document.createElement("span");
            result.className = "year-value";
            result.dataset.indicator = indicator.id;
            result.dataset.yearIndex = index;
            result.textContent = "N/A";
            cell.appendChild(result);

            if (indicator.calculateAmount || indicator.calculatePercentage) {
                var percentage = document.createElement("small");
                percentage.className = "year-percentage";
                percentage.dataset.percentageFor = indicator.id;
                percentage.dataset.yearIndex = index;
                percentage.textContent = "N/A";
                cell.appendChild(percentage);
            }

            if (index > 0) {
                var variation = document.createElement("small");
                variation.className = "year-variation";
                variation.dataset.variationFor = indicator.id;
                variation.dataset.yearIndex = index;
                variation.textContent = "N/A";
                cell.appendChild(variation);
            }

            row.appendChild(cell);
        });
        body.appendChild(row);
    });
    table.querySelector("tbody").replaceWith(body);
}

function renderInputTable(){
    var table = document.getElementById("financial_inputs");
    var header = document.createElement("tr");
    var variableHeader = document.createElement("th");
    variableHeader.textContent = "Variable";
    header.appendChild(variableHeader);

    years.forEach(function(year){
        var cell = document.createElement("th");
        cell.textContent = "Year " + year;
        header.appendChild(cell);
    });

    var addYearHeader = document.createElement("th");
    var addYearButton = document.createElement("button");
    addYearButton.className = "add-year-button";
    addYearButton.type = "button";
    addYearButton.textContent = "Agregar año";
    addYearButton.addEventListener("click", addYear);
    addYearHeader.appendChild(addYearButton);
    header.appendChild(addYearHeader);
    table.querySelector("thead").replaceChildren(header);

    var body = document.createElement("tbody");
    fields.forEach(function(field){
        var row = document.createElement("tr");
        var label = document.createElement("th");
        label.scope = "row";
        label.textContent = field.label;
        row.appendChild(label);

        years.forEach(function(year, index){
            var cell = document.createElement("td");
            if (field.openingInventory && index > 0) {
                var derivedValue = document.createElement("output");
                derivedValue.className = "derived-value";
                derivedValue.dataset.derivedField = field.key;
                derivedValue.dataset.yearIndex = index;
                cell.appendChild(derivedValue);
            } else {
                var input = document.createElement("input");
                input.className = "financial-input";
                input.type = "text";
                input.inputMode = "decimal";
                input.dataset.fieldKey = field.key;
                input.dataset.yearIndex = index;
                input.setAttribute("aria-label", field.label + ", Year " + year);

                if (Number.isFinite(valuesByField[field.key][index])) {
                    input.value = formatNumber(valuesByField[field.key][index]);
                } else if (field.openingInventory && index === 0) {
                    input.placeholder = "Dato requerido";
                }

                cell.appendChild(input);
            }
            row.appendChild(cell);
        });

        row.appendChild(document.createElement("td"));
        body.appendChild(row);
    });
    table.querySelector("tbody").replaceWith(body);
}

function renderFormulaCards(){
    var container = document.getElementById("indicator_formulas");
    var fragment = document.createDocumentFragment();

    indicators.forEach(function(indicator){
        var details = document.createElement("details");
        details.className = "card formula-card";

        var summary = document.createElement("summary");
        summary.className = "card-heading";
        var title = document.createElement("div");
        title.className = "indicator-heading";
        var heading = document.createElement("h3");
        heading.textContent = indicator.label;
        title.appendChild(heading);
        title.appendChild(createInfoButton(indicator, "formulas"));
        summary.appendChild(title);

        var icon = document.createElement("span");
        icon.className = "disclosure-icon";
        icon.setAttribute("aria-hidden", "true");
        summary.appendChild(icon);
        details.appendChild(summary);

        var formulaDisplay = document.createElement("div");
        formulaDisplay.className = "formula-display";
        var formulaLabel = document.createElement("span");
        formulaLabel.textContent = "Fórmula";
        formulaDisplay.appendChild(formulaLabel);

        var math = createMathNode(m("math", indicator.formula));
        math.setAttribute("display", "block");
        math.setAttribute("aria-label", indicator.formulaLabel);
        formulaDisplay.appendChild(math);
        details.appendChild(formulaDisplay);

        var description = document.createElement("p");
        description.className = "formula-description";
        description.textContent = indicator.description;
        details.appendChild(description);
        fragment.appendChild(details);
    });

    container.replaceChildren(fragment);
}

function getYearValues(yearIndex){
    var result = {};
    fields.forEach(function(field){
        if (field.openingInventory && yearIndex > 0) {
            result[field.key] = valuesByField.endingInventory[yearIndex - 1];
        } else {
            result[field.key] = valuesByField[field.key][yearIndex];
        }
    });
    return result;
}

function formatValue(value, unit){
    if (!Number.isFinite(value)) {
        return "N/A";
    }

    var formatted = formatNumber(value);
    if (unit === "percent") {
        return formatted + "%";
    }
    if (unit === "days") {
        return formatted + " días";
    }
    if (unit === "multiple") {
        return formatted + "x";
    }
    return formatted;
}

function updateVariation(element, previousValue, currentValue){
    if (!Number.isFinite(previousValue) || !Number.isFinite(currentValue) || previousValue === 0) {
        element.textContent = "N/A";
        element.classList.remove("positive", "negative");
        return;
    }

    var percentage = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
    element.textContent = (percentage > 0 ? "+" : "") + formatNumber(percentage) + "%";
    element.classList.toggle("positive", percentage > 0);
    element.classList.toggle("negative", percentage < 0);
}

function updateIndicators(){
    indicators.forEach(function(indicator){
        var previousValue;

        years.forEach(function(year, index){
            var values = getYearValues(index);
            var result = indicator.calculate(values);
            var valueElement = document.querySelector(
                '.year-value[data-indicator="' + indicator.id + '"][data-year-index="' + index + '"]'
            );
            if (indicator.calculateAmount) {
                var amount = indicator.calculateAmount(values);
                valueElement.textContent = formatValue(amount, "amount");
            } else {
                valueElement.textContent = formatValue(result, indicator.unit);
            }

            if (indicator.calculateAmount || indicator.calculatePercentage) {
                var percentage = indicator.calculatePercentage
                    ? indicator.calculatePercentage(values, result)
                    : result;
                document.querySelector(
                    '.year-percentage[data-percentage-for="' + indicator.id + '"][data-year-index="' + index + '"]'
                ).textContent = formatValue(percentage, "percent");
            }

            if (index > 0) {
                var variation = document.querySelector(
                    '.year-variation[data-variation-for="' + indicator.id + '"][data-year-index="' + index + '"]'
                );
                updateVariation(variation, previousValue, result);
            }

            previousValue = result;
        });
    });
}

function updateDerivedValues(){
    document.querySelectorAll("[data-derived-field='openingInventory']").forEach(function(element){
        var yearIndex = Number(element.dataset.yearIndex);
        var value = valuesByField.endingInventory[yearIndex - 1];
        element.textContent = formatNumber(value);
    });
}

function addYear(){
    var yearIndex = years.length;
    years.push(yearIndex + 1);
    fields.forEach(function(field){
        valuesByField[field.key].push(NaN);
    });
    renderSummaryTable();
    renderInputTable();
    updateDerivedValues();
    updateIndicators();
    saveSessionState();
}

function handleInput(event){
    var input = event.target.closest("input[data-field-key]");
    if (!input) {
        return;
    }

    var normalizedValue = input.value.replace(/,/g, "").trim();
    var value = normalizedValue === "" ? NaN : Number(normalizedValue);
    valuesByField[input.dataset.fieldKey][Number(input.dataset.yearIndex)] = value;
    input.setCustomValidity(Number.isFinite(value) || normalizedValue === "" ? "" : "Ingresa un número válido.");
    updateDerivedValues();
    updateIndicators();
    saveSessionState();
}

document.addEventListener("DOMContentLoaded", function(){
    restoreSessionState();
    renderSummaryTable();
    renderInputTable();
    renderFormulaCards();
    loadInfoPopup();
    var inputTable = document.getElementById("financial_inputs");
    inputTable.addEventListener("focusin", function(event){
        var input = event.target.closest("input[data-field-key]");
        if (input) {
            input.select();
        }
    });
    inputTable.addEventListener("focusout", function(event){
        var input = event.target.closest("input[data-field-key]");
        if (!input || input.value.trim() === "") {
            return;
        }

        var value = Number(input.value.replace(/,/g, "").trim());
        if (Number.isFinite(value)) {
            input.value = formatNumber(value);
        }
    });
    inputTable.addEventListener("input", handleInput);
    updateDerivedValues();
    updateIndicators();
});

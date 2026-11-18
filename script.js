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
        high_value_description: "Un margen alto deja una mayor proporción de las ventas para cubrir otros gastos y generar utilidad.",
        low_value_description: "Un margen bajo deja menos recursos para cubrir los demás gastos y puede reflejar costos de venta elevados o precios reducidos.",
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
        high_value_description: "Un margen alto indica que la operación conserva una mayor proporción de las ventas antes de intereses e impuestos.",
        low_value_description: "Un margen bajo indica que los costos y gastos operativos absorben gran parte de las ventas; si es negativo, hay pérdida operativa.",
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
        high_value_description: "Un EBITDA alto refleja un mayor resultado antes de intereses, impuestos, depreciación y amortización; considera también el margen para comparar empresas de distinto tamaño.",
        low_value_description: "Un EBITDA bajo indica menor capacidad de generar resultado antes de esas partidas; si es negativo, los ingresos no cubren los costos y gastos considerados.",
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
        high_value_description: "Un margen alto indica que una mayor proporción de las ventas se convierte en resultado neto.",
        low_value_description: "Un margen bajo deja poca utilidad por unidad vendida; si es negativo, la empresa registra pérdidas.",
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
        high_value_description: "Un ROA alto indica mayor resultado operativo por unidad de activo invertido.",
        low_value_description: "Un ROA bajo indica menor resultado operativo respecto de los activos; si es negativo, la operación genera pérdidas.",
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
        high_value_description: "Un ROE alto indica mayor resultado neto respecto del patrimonio; puede estar influido por un endeudamiento elevado.",
        low_value_description: "Un ROE bajo indica menor resultado neto respecto del patrimonio. Con patrimonio negativo, el ratio puede ser engañoso y requiere análisis adicional.",
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
        description: "Compara los activos corrientes con las obligaciones de corto plazo para mostrar cuántas veces podrían cubrirlas. Un valor muy alto puede significar una ineficiencia dado un exceso de caja o recursos ocioso en la empresa.",
        high_value_description: "Un valor muy alto puede indicar exceso de caja o recursos ociosos en la empresa.",
        low_value_description: "Un valor muy bajo puede indicar problemas de liquidez.",
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
        high_value_description: "Un valor alto indica mayor cobertura del pasivo corriente sin depender de vender existencias; un exceso puede reflejar recursos poco aprovechados.",
        low_value_description: "Un valor bajo indica menor cobertura con activos corrientes distintos de las existencias y mayor dependencia de su venta o de financiación.",
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
        high_value_description: "Más días indican mayor cobertura de los gastos históricos con la caja al cierre, aunque un exceso podría reflejar recursos ociosos.",
        low_value_description: "Menos días indican menor reserva de caja frente a los gastos históricos y mayor exposición a tensiones de liquidez.",
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
        high_value_description: "Un valor alto indica mayor financiación de terceros respecto del patrimonio y puede aumentar el riesgo financiero.",
        low_value_description: "Un valor bajo indica menor dependencia relativa del pasivo. Si el patrimonio es negativo, el ratio requiere una interpretación especial.",
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
        high_value_description: "Más días indican que las cuentas por cobrar representan un mayor plazo de ventas; puede reflejar condiciones de crédito más largas o demoras en el cobro.",
        low_value_description: "Menos días indican una recuperación más rápida respecto de las ventas, aunque también pueden reflejar condiciones comerciales más restrictivas.",
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
        high_value_description: "Más días indican mayor cobertura de existencias, pero también pueden señalar exceso de inventario o recursos inmovilizados.",
        low_value_description: "Menos días indican menor inventario relativo al costo de ventas, aunque pueden aumentar el riesgo de faltantes.",
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
        high_value_description: "Más días pueden proporcionar financiación de proveedores, pero también reflejar pagos atrasados o tensiones de liquidez.",
        low_value_description: "Menos días indican pagos más rápidos y menor financiación de proveedores; podrían responder a las condiciones pactadas o a descuentos por pronto pago.",
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
var accountsByYear = [{ assets: [], liabilities: [] }, { assets: [], liabilities: [] }];
var selectedBalanceYear = 0;
var accountSections = { assets: ["current", "other"], liabilities: ["current", "noncurrent", "equity"] };
var accountCategories = {
    assets: { current: ["cash", "accountsReceivable", "endingInventory"], other: [] },
    liabilities: { current: ["suppliers"], noncurrent: [], equity: [] }
};
var balanceFields = ["totalAssets", "currentAssets", "currentLiabilities", "endingInventory", "cash", "totalLiabilities", "equity", "accountsReceivable", "suppliers"];

function assetAccountCategory(account){
    if (account.section !== "current") {
        return "";
    }
    var name = account.name.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
    if (name === "caja") return "cash";
    if (name === "cuentas por cobrar") return "accountsReceivable";
    if (name === "existencias") return "endingInventory";
    return "";
}

fields.forEach(function(field){
    valuesByField[field.key] = [NaN, NaN];
});

function showStorageError(message){
    var status = document.getElementById("storage_status");
    status.textContent = message;
    status.hidden = false;
}

function isValidSavedState(state){
    if (!state || ![1, 2].includes(state.version) || !Array.isArray(state.years) || state.years.length < 2) {
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

    function validGroups(accounts, legacy){
        return accounts && typeof accounts === "object" && ["assets", "liabilities"].every(function(group){
            return Array.isArray(accounts[group]) && accounts[group].every(function(account){
                return account && typeof account.name === "string" && account.name.trim() !== ""
                    && typeof account.amount === "string"
                    && (legacy
                        ? (account.section === undefined || (group === "assets" ? ["current", "other"] : ["liabilities", "equity"]).includes(account.section))
                        : accountSections[group].includes(account.section) && typeof account.category === "string"
                            && (account.category === "" || accountCategories[group][account.section].includes(account.category)));
            });
        });
    }

    var validAccounts = state.version === 1
        ? state.accounts === undefined || validGroups(state.accounts, true)
        : Array.isArray(state.accountsByYear) && state.accountsByYear.length === state.years.length
            && state.accountsByYear.every(function(accounts){ return validGroups(accounts, false); });

    return validAccounts && fields.every(function(field){
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
    accountsByYear = state.version === 2 ? state.accountsByYear : years.map(function(){
        return { assets: [], liabilities: [] };
    });
    if (state.version === 1 && state.accounts !== undefined) {
        ["assets", "liabilities"].forEach(function(group){
            accountsByYear[0][group] = state.accounts[group].map(function(account){
                return {
                    name: account.name,
                    amount: account.amount,
                    section: account.section === undefined || account.section === "liabilities" ? "current" : account.section,
                    category: ""
                };
            });
        });
    }
    fields.forEach(function(field){
        valuesByField[field.key] = state.values[field.key].map(function(value){
            return value === null ? NaN : value;
        });
    });
}

function saveSessionState(){
    var state = {
        version: 2,
        years: years,
        values: {},
        accountsByYear: accountsByYear
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

function createIndicatorInterpretation(indicator){
    var section = document.createElement("section");
    section.className = "indicator-interpretation";
    var heading = document.createElement("h4");
    heading.textContent = "Interpretación";
    section.appendChild(heading);
    [
        ["Valor alto", indicator.high_value_description],
        ["Valor bajo", indicator.low_value_description]
    ].forEach(function(item){
        var paragraph = document.createElement("p");
        var label = document.createElement("strong");
        label.textContent = item[0] + ": ";
        paragraph.appendChild(label);
        paragraph.appendChild(document.createTextNode(item[1]));
        section.appendChild(paragraph);
    });
    var context = document.createElement("p");
    context.className = "interpretation-context";
    context.textContent = "Compara con el sector y la evolución histórica; no existe un umbral universal.";
    section.appendChild(context);
    return section;
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

    var interpretation = document.createElement("div");
    interpretation.className = "indicator-info-interpretation";
    popup.appendChild(interpretation);

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
    popup.querySelector(".indicator-info-interpretation").replaceChildren(createIndicatorInterpretation(indicator));
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
    fields.filter(function(field){
        return !["cash", "accountsReceivable", "endingInventory"].includes(field.key);
    }).forEach(function(field){
        var row = document.createElement("tr");
        var label = document.createElement("th");
        label.scope = "row";
        label.textContent = field.label;
        row.appendChild(label);

        years.forEach(function(year, index){
            var cell = document.createElement("td");
            if (balanceFields.includes(field.key) || (field.openingInventory && index > 0)) {
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

function appendAccountRow(group, account){
    var body = document.querySelector("#" + group + "-table tbody");
    var row = document.createElement("tr");
    row.className = "account-row";
    var name = document.createElement("th");
    name.scope = "row";
    name.textContent = account.name;
    var categories = accountCategories[group][account.section];
    if (group === "liabilities" && categories.length > 0) {
        var classification = document.createElement("select");
        classification.className = "account-classification";
        classification.setAttribute("aria-label", "Clasificación de " + account.name);
        var options = [{ value: "", label: "Sin clasificar" }].concat(categories.map(function(key){
            return { value: key, label: fields.find(function(field){ return field.key === key; }).label };
        }));
        options.forEach(function(option){
            var element = document.createElement("option");
            element.value = option.value;
            element.textContent = option.label;
            classification.appendChild(element);
        });
        classification.value = account.category;
        classification.addEventListener("change", function(){
            account.category = classification.value;
            updateDerivedValues();
            updateIndicators();
            saveSessionState();
        });
        name.appendChild(classification);
    }
    var deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-account-button";
    deleteButton.textContent = "Eliminar";
    deleteButton.setAttribute("aria-label", "Eliminar cuenta " + account.name);
    deleteButton.addEventListener("click", function(){
        if (!window.confirm("¿Eliminar la cuenta \"" + account.name + "\" y su importe de Year " + years[selectedBalanceYear] + "?")) {
            return;
        }
        var accounts = accountsByYear[selectedBalanceYear][group];
        accounts.splice(accounts.indexOf(account), 1);
        row.remove();
        updateAccountTotals();
        updateDerivedValues();
        updateIndicators();
        saveSessionState();
        body.querySelector('[data-section="' + account.section + '"] .add-account-button').focus();
    });
    name.appendChild(deleteButton);
    var amountCell = document.createElement("td");
    var amount = document.createElement("input");
    amount.className = "financial-input";
    amount.type = "text";
    amount.inputMode = "decimal";
    amount.value = account.amount;
    amount.setAttribute("aria-label", "Importe de " + account.name);

    function validateAmount(){
        var value = amount.value.replace(/,/g, "").trim();
        amount.setCustomValidity(value === "" || Number.isFinite(Number(value)) ? "" : "Ingresa un número válido.");
    }
    validateAmount();
    amount.addEventListener("input", function(){
        account.amount = amount.value;
        validateAmount();
        updateAccountTotals();
        updateDerivedValues();
        updateIndicators();
        saveSessionState();
    });

    amountCell.appendChild(amount);
    row.appendChild(name);
    row.appendChild(amountCell);
    var sectionRow = body.querySelector('[data-section="' + account.section + '"]');
    var nextRow = sectionRow.nextElementSibling;
    while (nextRow && !nextRow.classList.contains("account-section") && !nextRow.classList.contains("account-total")) {
        nextRow = nextRow.nextElementSibling;
    }
    body.insertBefore(row, nextRow);
    return row;
}

function sumAccounts(accounts){
    var amounts = accounts.map(function(account){
        var value = account.amount.replace(/,/g, "").trim();
        return value === "" ? null : Number(value);
    }).filter(function(value){ return value !== null; });
    if (amounts.length === 0 || amounts.some(function(value){ return !Number.isFinite(value); })) {
        return NaN;
    }
    return amounts.reduce(function(sum, value){ return sum + value; }, 0);
}

function updateAccountTotals(){
    var accountsByGroup = accountsByYear[selectedBalanceYear];
    Object.keys(accountSections).forEach(function(group){
        document.querySelector('[data-account-error="' + group + '"]').hidden = !accountsByGroup[group].some(function(account){
            var value = account.amount.replace(/,/g, "").trim();
            return value !== "" && !Number.isFinite(Number(value));
        });
    });

    function total(accounts){
        var value = sumAccounts(accounts);
        return Number.isFinite(value) ? formatNumber(value) : "—";
    }

    accountSections.assets.forEach(function(section){
        document.querySelector('#assets-table [data-section="' + section + '"] output').textContent = total(accountsByGroup.assets.filter(function(account){
            return account.section === section;
        }));
    });
    document.querySelector('[data-total="assets"] output').textContent = total(accountsByGroup.assets);
    ["current", "noncurrent"].forEach(function(section){
        document.querySelector('#liabilities-table [data-section="' + section + '"] output').textContent = total(accountsByGroup.liabilities.filter(function(account){
            return account.section === section;
        }));
    });
    document.querySelector('[data-total="liabilities"] output').textContent = total(accountsByGroup.liabilities.filter(function(account){
        return account.section !== "equity";
    }));
    document.querySelector('[data-total="liabilitiesAndEquity"] output').textContent = total(accountsByGroup.liabilities);
}

function renderBalanceYearOptions(){
    var select = document.getElementById("balance-year");
    select.replaceChildren();
    years.forEach(function(year, index){
        var option = document.createElement("option");
        option.value = index;
        option.textContent = "Year " + year;
        select.appendChild(option);
    });
    select.value = String(selectedBalanceYear);
}

function renderAccountTables(){
    document.querySelectorAll(".balance-card .account-row").forEach(function(row){ row.remove(); });
    ["assets", "liabilities"].forEach(function(group){
        accountsByYear[selectedBalanceYear][group].forEach(function(account){
            appendAccountRow(group, account);
        });
    });
    updateAccountTotals();
}

function setupAccountTables(){
    renderBalanceYearOptions();
    renderAccountTables();
    document.getElementById("balance-year").addEventListener("change", function(event){
        selectedBalanceYear = Number(event.target.value);
        renderAccountTables();
    });
    var dialog = document.getElementById("account-dialog");
    var form = document.getElementById("account-form");
    var input = form.elements.accountName;
    var targetGroup;
    var targetSection;
    document.querySelectorAll(".balance-card .add-account-button").forEach(function(button){
        button.addEventListener("click", function(){
            var table = button.closest("table");
            var section = button.closest("[data-section]");
            targetGroup = table.id === "assets-table" ? "assets" : "liabilities";
            targetSection = section.dataset.section;
            document.getElementById("account-dialog-context").textContent =
                section.querySelector("th span").textContent + " · Year " + years[selectedBalanceYear];
            dialog.showModal();
        });
    });
    input.addEventListener("input", function(){
        input.setCustomValidity("");
    });
    document.getElementById("cancel-account").addEventListener("click", function(){
        dialog.close();
    });
    dialog.addEventListener("keydown", function(event){
        if (event.key === "Escape") {
            event.preventDefault();
            dialog.close();
        }
    });
    dialog.addEventListener("click", function(event){
        if (event.target === dialog) {
            var bounds = dialog.getBoundingClientRect();
            if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
                dialog.close();
            }
        }
    });
    dialog.addEventListener("close", function(){
        form.reset();
        input.setCustomValidity("");
    });
    form.addEventListener("submit", function(event){
        event.preventDefault();
        var name = input.value.trim();
        if (!name) {
            input.setCustomValidity("Ingresa el nombre de la cuenta.");
            input.reportValidity();
            return;
        }
        var account = { name: name, amount: "", section: targetSection, category: "" };
        accountsByYear[selectedBalanceYear][targetGroup].push(account);
        appendAccountRow(targetGroup, account);
        updateAccountTotals();
        updateDerivedValues();
        updateIndicators();
        saveSessionState();
        dialog.close();
    });
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
        var interpretation = createIndicatorInterpretation(indicator);
        interpretation.classList.add("formula-interpretation");
        details.appendChild(interpretation);
        fragment.appendChild(details);
    });

    container.replaceChildren(fragment);
}

function getYearValues(yearIndex){
    var result = {};
    var accounts = accountsByYear[yearIndex];
    fields.forEach(function(field){
        if (field.openingInventory && yearIndex > 0) {
            result[field.key] = sumAccounts(accountsByYear[yearIndex - 1].assets.filter(function(account){
                return assetAccountCategory(account) === "endingInventory";
            }));
        } else if (balanceFields.includes(field.key)) {
            var group = ["currentLiabilities", "totalLiabilities", "equity", "suppliers"].includes(field.key) ? "liabilities" : "assets";
            result[field.key] = sumAccounts(accounts[group].filter(function(account){
                if (field.key === "totalAssets") return true;
                if (field.key === "currentAssets") return account.section === "current";
                if (field.key === "currentLiabilities") return account.section === "current";
                if (field.key === "totalLiabilities") return account.section !== "equity";
                if (field.key === "equity") return account.section === "equity";
                return (group === "assets" ? assetAccountCategory(account) : account.category) === field.key;
            }));
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
    document.querySelectorAll("[data-derived-field]").forEach(function(element){
        var yearIndex = Number(element.dataset.yearIndex);
        var value = getYearValues(yearIndex)[element.dataset.derivedField];
        element.textContent = formatNumber(value);
    });
}

function addYear(){
    var yearIndex = years.length;
    years.push(yearIndex + 1);
    accountsByYear.push({ assets: [], liabilities: [] });
    fields.forEach(function(field){
        valuesByField[field.key].push(NaN);
    });
    renderSummaryTable();
    renderInputTable();
    renderBalanceYearOptions();
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
    setupAccountTables();
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

const API_VERSION        = "0.0";
const WORKBOOK_URL       = "Data/21-22-SEM2.xlsx";
const SHEETNAME_THEORY   = "TKB LT";
const SHEETNAME_PRACTICE = "TKB TH";

const BAIT_VARIABLES = new Array(
  "g_Classes",
  "g_Subjects",
  "g_ClassNames",
);

var g_bareClasses = new Array();
for (const var_ of BAIT_VARIABLES)
  eval(`var ${var_} = new Object();`);

class ParseEngine {
  static parseSheet(sheet) {
    let classes = new Object();
    for (let u = 9; sheet["A" + u.toString()]; ++u) {
      let row = u.toString();
      let code = sheet["C" + row].v;
      let name = sheet["D" + row].v;
      let time = new PeriodTime(
        sheet["K" + row].v,
        sheet["L" + row].v
      ).toBitset();
      let credit = parseInt(sheet["H" + row].v);
      let system = sheet["R" + row].v;
      classes[code] = new Class(code, name, time, credit, system);

      // Global values
    }

    return classes;
  }

  static parseBook(book) {
    let theoryClasses = ParseEngine.parseSheet(book.Sheets[SHEETNAME_THEORY]);
    let practicalClasses = ParseEngine.parseSheet(book.Sheets[SHEETNAME_PRACTICE]);
    g_bareClasses = Object({...theoryClasses, ...practicalClasses});

    let uselessCodes = new Set();
    practicalClasses = Object.values(practicalClasses).map(class_ => {
      let classCode = class_.m_code.split(".").slice(0, -1).join(".");
      if (theoryClasses[classCode] !== undefined) {
        class_.m_time = Bitset.or(class_.m_time, theoryClasses[classCode].m_time);
        class_.m_credit = `${theoryClasses[classCode].m_credit} + ${class_.m_credit}`;
        uselessCodes.add(classCode);
      }

      return class_;
    });

    uselessCodes.forEach(code => delete theoryClasses[code]);
    return Object.values(theoryClasses).concat(practicalClasses);
  }
};

function isStoraged() {
  let api = JSON.parse(localStorage.getItem("API"));
  if (!api || api.version != API_VERSION)
    return false;

  if (Bait.Storage.exist('DEBUG')) {
    Bait.Log.write("DEBUG MODE is on");
    return false;
  }

  let numberOfStores = BAIT_VARIABLES
    .map(var_ => Bait.Storage.exist(`Bait::${var_}`))
    .reduce((shl, shr) => shl + shr);
  return (numberOfStores === BAIT_VARIABLES.length);
}

if (isStoraged()) {
  Bait.Log.write("Load data from local storage");
  BAIT_VARIABLES.forEach(var_ => eval(`${var_}=JSON.parse(Bait.Storage.get("Bait::${var_}"))`));
} else {
  // Take workbook through XML request
  var request = new XMLHttpRequest();
  request.open("GET", WORKBOOK_URL, true);
  request.responseType = "arraybuffer";
  request.onload = (ev) => {
    // Load workbook
    g_Classes = ParseEngine.parseBook(
      XLSX.read(
        new Uint8Array(ev.target.response),
        { type:"array" }
      )
    );

    // Get all class names of CLC system
    g_ClassNames = new Set(g_Classes.map(class_ => (class_.m_code + ".0").split(".")[2]));
    g_ClassNames.delete("CLC");
    for (const i of Array(5).keys())
      g_ClassNames.delete(i.toString());

    g_ClassNames = new Array(...g_ClassNames.values()).sort((shl, shr) => {
      if (shl.slice(2) != shr.slice(2))
        return (shl.slice(2) < shr.slice(2)) ? -1 : 1;
      return shl < shr ? -1 : 1;
    });

    // Load subect detail
    for (const class_ of g_Classes) {
      let subjectCode = class_.m_code.split(".")[0];
      if (!(subjectCode in g_Subjects)) {
        g_Subjects[subjectCode] = Object({
          m_code: subjectCode,
          m_name: class_.m_name,
          m_credit: class_.m_credit,
        });
      }
    }

    // Storing components into local storage
    Bait.Log.write("Write data to local storage");
    localStorage.setItem("API", JSON.stringify({"version": API_VERSION}));
    BAIT_VARIABLES.map(entity => Bait.Storage.set("Bait::"+entity, JSON.stringify(eval(entity))));
  }

  request.send();
}

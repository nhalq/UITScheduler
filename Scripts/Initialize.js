const WORKBOOK_URL       = "Data/20-21-SEM2.xlsx";
const SHEETNAME_THEORY   = "TKB LT";
const SHEETNAME_PRACTICE = "TKB TH";

var g_classes = new Array();
var g_bareClasses = new Array();

var g_subjects = new Object();
var g_CLCClassNames = new Set();

class ParseEngine {
  static parseSheet(sheet) {
    let subjects = new Object();
    for (let u = 9; sheet["A" + u.toString()]; ++u) {
      let row = u.toString();
      let code = sheet["C" + row].v;
      let name = sheet["D" + row].v;
      let time = new PeriodTime(
        sheet["K" + row].v,
        sheet["L" + row].v
      ).toBitset();
      let credit = parseInt(sheet["H" + row].v)
      let system = sheet["R" + row].v
      subjects[code] = new Class(code, name, time, credit, system);
    }

    return subjects;
  }

  static parseBook(book) {
    let theory = ParseEngine.parseSheet(book.Sheets[SHEETNAME_THEORY]);
    let practice = ParseEngine.parseSheet(book.Sheets[SHEETNAME_PRACTICE]);
    g_bareClasses = Object({
      ... theory,
      ... practice,
    });

    let unusedCodes = new Set();
    practice = Object.values(practice).map(subject => {
      let parts = subject.m_code.split(".");
      let code = parts.slice(0, -1).join(".");
      if (theory[code] !== undefined) {
        subject.m_time = Bitset.or(subject.m_time, theory[code].m_time);
        subject.m_credit += theory[code].m_credit;
        unusedCodes.add(code);
      }
      return subject;
    });

    unusedCodes.forEach(code => delete theory[code]);
    return Object.values(theory).concat(practice);
  }
};

if (Bait.Storage.exist("BAIT_CLASSES")
    && Bait.Storage.exist("BAIT_SUBJECTS")
    && Bait.Storage.exist("BAIT_BARECLASSES")) {
  g_classes = JSON.parse(Bait.Storage.get("BAIT_CLASSES"));
  g_subjects = JSON.parse(Bait.Storage.get("BAIT_SUBJECTS"));
  g_bareClasses = JSON.parse(Bait.Storage.get("BAIT_BARECLASSES"));
  g_CLCClassNames = JSON.parse(Bait.Storage.get("BAIT_CLC_CLASSNAMES"));
} else {
  // Take workbook through XML request
  var request = new XMLHttpRequest();
  request.open("GET", WORKBOOK_URL, true);
  request.responseType = "arraybuffer";
  request.onload = (ev) => {
    // Load workbook
    g_classes = ParseEngine.parseBook(
      XLSX.read(
        new Uint8Array(ev.target.response),
        { type:"array" }
      )
    );

    // Get all class names of CLC system
    g_CLCClassNames = new Set(g_classes.map(class_ =>
      (class_.m_code + ".0").split(".")[2]
    ));
    g_CLCClassNames.delete("CLC");
    for (const i of Array(5).keys())
      g_CLCClassNames.delete(i.toString());
    g_CLCClassNames = new Array(...g_CLCClassNames.values()).sort((shl, shr) => {
      if (shl.slice(2) != shr.slice(2))
        return (shl.slice(2) < shr.slice(2)) ? -1 : 1;
      return shl < shr ? -1 : 1;
    });


    // Load subect detail
    for (const class_ of g_classes) {
      let code = class_.m_code.split(".")[0];
      g_subjects[code] = Object({
        m_code: code,
        m_name: class_.m_name,
        m_credit: class_.m_credit,
      })
    }

    // Write components into storage
    Bait.Storage.set("BAIT_CLASSES", JSON.stringify(g_classes));
    Bait.Storage.set("BAIT_SUBJECTS", JSON.stringify(g_subjects));
    Bait.Storage.set("BAIT_BARECLASSES", JSON.stringify(g_bareClasses));
    Bait.Storage.set("BAIT_CLC_CLASSNAMES", JSON.stringify(g_CLCClassNames));
  }

  request.send();
}

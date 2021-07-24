let DEBUG = Object();

if (!Bait.Storage.exist("_0x000")) {
  Bait.Storage.set("_0x000", JSON.stringify(Object({
    typing: new String(),
    subjects: new Array(),
  })))
}

if (!Bait.Storage.exist("_0x001")) {
  Bait.Storage.set("_0x001", JSON.stringify(Object({
    limit: 32,
    option: -1,
    system: "CQUI",
    schedules: new Array(),
  })))
}

$(document).ready(() => {
  var _0x000 = new Vue({
    el: "#filter",
    data: JSON.parse(Bait.Storage.get("_0x000")),

    methods: {
      insert: function(code) {
        code = code.trim().toUpperCase();
        if (!(code in g_subjects))
          return false;

        this.subjects.push(g_subjects[code]);
        return true;
      },

      remove: function(index) {
        return this.subjects.splice(index, 1);
      },

      getClassGroup: function(system) {
        return this.subjects.map(sub =>
          g_classes.filter(cls =>
            cls.m_system == system && cls.m_code.startsWith(sub.code)
          )
        );
      },
    },

    computed: {
      totalCredit: function() {
        if (!this.subjects.length)
          return 0;

        return this.subjects
          .filter(subject => subject.m_credit)
          .map(subject => subject.m_credit)
          .reduce((shl, shr) => shl + shr);
      }
    },

    watch: {
      typing: function(typed) {
        let classCodes = typed.split("\n");
        if (classCodes.length <= 1)
          return false;

        this.typing = classCodes.slice(-1).pop();
        classCodes = classCodes.slice(0, -1);
        for (const code of classCodes)
          this.insert(code);
        return true;
      }
    },
  })

  var _0x001 = new Vue({
    el: "#schedule",
    data: JSON.parse(Bait.Storage.get("_0x001")),

    methods: {
      getClassCodes: function(schedule) {
        return schedule.m_classes.map(class_ => {
          let classCodes = Array(class_.m_code);
          let classCodeParts = class_.m_code.split(".")
          if (classCodeParts.slice(-1).pop().length === 1)
            classCodes.unshift(classCodeParts.slice(0, -1).join("."));
          return classCodes;
        }).sort().flat();
      },

      getSchedule: function(i = 0, available = new Bitset(60), current = new Array()) {
        if (i >= this.classGroups.length)
          return this.schedules.push(Object({
            "m_time": available.copy(),
            "m_classes": [...current],
          }));

        for (const subject of this.classGroups[i]) {
          if (Bitset.and(available, subject.m_time).count())
            continue;

          current.push(subject);
          this.getSchedule(i + 1, Bitset.or(available, subject.m_time), current)
          current.pop();
        }
      },

      search: function() {
        this.classGroups = _0x000.getClassGroup(this.system);
        this.schedules.splice(0);
        if (this.classGroups.length)
          this.getSchedule();

        Bait.Storage.set("_0x001", JSON.stringify(Object({
          limit: this.limit,
          option: this.option,
          system: this.system,
          schedules: new Array(),
        })));

        return this.schedules.length;
      },
    },

    computed: {
      getResult: function() {
        return this.schedules
          .sort((shl, shr) => this.option * (shl.m_time.distance() - shr.m_time.distance()))
          .slice(0, this.limit);
      }
    },
  });

  // $("#filter-area").keyup((e) => {
  //   details = $(e.target).val().split("\n");
  //   if (details.length > 1) {
  //     $(e.target).val(details.slice(-1));
  //     _0x000.subjects.push(... details.slice(0, -1).map(code => {
  //       code = code.trim().toUpperCase();
  //       if (g_subjects[code] !== undefined)
  //         return g_subjects[code];
  //       return Object({ code: code });
  //     }).filter(subject => {
  //       for (const registered of _0x000.subjects)
  //         if (registered.code == subject.code)
  //           return false;
  //       return true;
  //     }));

  //     Bait.Storage.set("_0x000", JSON.stringify(Object({
  //       subjects: _0x000.subjects,
  //     })));
  //   }
  // });

  DEBUG._0x000 = _0x000;
  DEBUG._0x001 = _0x001;
})

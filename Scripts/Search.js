let DEBUG = Object();


$(document).ready(() => {
  var _0x000 = new Vue({
    el: "#filter",
    data: {
      subjects: new Array(),
    },

    methods: {
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
          .filter(subject => subject.credit)
          .map(subject => subject.credit)
          .reduce((shl,shr)=> shl + shr);
      }
    }
  })

  var _0x001 = new Vue({
    el: "#schedule",
    data: {
      limit: 32,
      option: -1,
      system: "CQUI",
      schedules: new Array(),
    },

    methods: {
      getSchedule: function(i = 0, available = new Bitset(60), current = new Array()) {
        if (i >= this.classGroups.length)
          return this.schedules.push(Object({
            'm_time': available.copy(),
            'm_classes': [...current],
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
          return this.getSchedule();
        return false;
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

  $("#filter-area").keyup((e) => {
    details = $(e.target).val().split("\n");
    if (details.length > 1) {
      $(e.target).val(details.slice(-1));
      _0x000.subjects.push(... details.slice(0, -1).map(code => {
        code = code.trim().toUpperCase();
        if (g_subjects[code] !== undefined)
          return g_subjects[code];
        return Object({ code: code });
      }).filter(subject => {
        for (const registered of _0x000.subjects)
          if (registered.code == subject.code)
            return false;
        return true;
      }));

      Bait.Storage.set("_", JSON.stringify(_0x000.subjects))
    }
  });

  DEBUG._0x000 = _0x000;
  DEBUG._0x001 = _0x001;


  // Load storage
  if ('_' in localStorage) {
    _0x000.subjects.push(... JSON.parse(Bait.Storage.get("_")));
  }
})

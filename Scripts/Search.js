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
  var alert = new Vue({
    el: "#alert",
    data: {
      messages: new Array(),
    },

    methods: {
      insertInfo: function(message) {
        this.messages.push({
          type: "info",
          message: message,
        });
      },

      insertError: function(message) {
        this.messages.push({
          type: "danger",
          message: message,
        });
      },

      insertWarning: function(message) {
        this.messages.push({
          type: "warning",
          message: message,
        });
      },
    },
  });

  var _0x000 = new Vue({
    el: "#filter",
    data: JSON.parse(Bait.Storage.get("_0x000")),

    methods: {
      insert: function(code) {
        // Format code
        code = code.trim().toUpperCase();

        // Empty code
        if (!code.length)
          return alert.insertWarning(`Chưa nhập code kìa người anh em`);

        // Invalid code
        if (!(code in g_subjects))
          return alert.insertError(`Không tìm thấy <strong>${code}</strong> trong xlsx`);

        // Duplicate code
        if (this.subjects.find(subject => subject.m_code == code))
          return alert.insertWarning(`<strong>${code}</strong> đã có trong danh sách của người anh em`);

        // Insert code to subjects list
        this.subjects.push(g_subjects[code]);
        return true;
      },

      remove: function(index) {
        return this.subjects.splice(index, 1);
      },

      getClassGroup: function(system) {
        return this.subjects.map(sub =>
          g_classes.filter(cls =>
            cls.m_system == system && cls.m_code.startsWith(sub.m_code)
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
      subjects: function() {
        Bait.Storage.set("_0x000", JSON.stringify(Object({
          "typing": new String(),
          "subjects": this.subjects,
        })))
      },

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
  });

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

      copyClassCodes: function(schedule) {
        Bait.Clipboard.write(this.getClassCodes(schedule).join('\n'));
        alert.insertInfo('Đã sao chép vào Clipboard');
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

  DEBUG._0x000 = _0x000;
  DEBUG._0x001 = _0x001;
  DEBUG.alert = alert;
})

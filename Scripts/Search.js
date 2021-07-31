let DEBUG = Object();

if (!Bait.Storage.exist("_0x000")) {
  Bait.Storage.set("_0x000", JSON.stringify({
    typing: "",
    subjects: Array(),
  }));
}

if (!Bait.Storage.exist("_0x001")) {
  Bait.Storage.set("_0x001", JSON.stringify({
    limit: 32,
    option: -1,
    system: "CQUI",
    schedules: Array(),
    m_mask: Array(10).fill().map(() => Array(6).fill().map(() => Object({value: 1}))),
  }));
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
      getData() {
        let _data = JSON.parse(JSON.stringify(this._data));
        _data.typing = "";
        return _data;
      },

      insert: function(code) {
        // Format code
        code = code.trim().toUpperCase();

        // Empty code
        if (!code.length)
          return alert.insertWarning(`Chưa nhập code kìa người anh em`);

        // Invalid code
        if (!g_Classes.find(class_ => class_.m_code.startsWith(code)))
          return alert.insertError(`Không tìm thấy <strong>${code}</strong> trong xlsx`);

        // Duplicate code
        if (this.subjects.find(subject => subject.m_code == code))
          return alert.insertWarning(`<strong>${code}</strong> đã có trong danh sách của người anh em`);

        // Insert code to subjects list
        let pattern = this.subjects.find(subject => subject.m_code.startsWith(code) || code.startsWith(subject.m_code));
        if (pattern) {
          // Push notofication
          alert.insertWarning(`<strong>${pattern.m_code}</strong> sẽ được đổi thành <strong>${code}</strong>`);

          // Change pattern code
          pattern.m_code = code;
          this.subjects.splice(this.subjects.indexOf(pattern), 1, pattern);
        } else {
          pattern = g_Classes.find(class_ => class_.m_code.startsWith(code));
          pattern = JSON.parse(JSON.stringify(pattern));
          pattern.m_code = code;
          this.subjects.push(pattern);
        }
      },

      remove: function(index) {
        return this.subjects.splice(index, 1);
      },

      getClassGroup: function(system) {
        return this.subjects.map(sub =>
          g_Classes.filter(cls =>
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
          .map(subject => eval(subject.m_credit))
          .reduce((shl, shr) => shl + shr);
      }
    },

    watch: {
      subjects: function() {
        Bait.Storage.set("_0x000", JSON.stringify(this.getData()));
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
    data: JSON.parse(Bait.Storage.get("_0x001"), (k, v) => {
      if (k === "m_time") {
        let clusters = Array(...v.m_clusters);
        v = new Bitset(v.m_size);
        v.m_clusters = Array(...clusters);
      }

      return v;
    }),

    methods: {
      getData() {
        let _data = JSON.parse(JSON.stringify(this._data));
        _data.schedules = new Array();
        return _data;
      },

      getClassCodes: function(schedule) {
        return schedule.m_classes.map(class_ => {
          let classCodes = Array(class_.m_code);
          let classCodeParts = class_.m_code.split(".")
          if (classCodeParts.slice(-1).pop().length === 1)
            classCodes.unshift(classCodeParts.slice(0, -1).join("."));
          return classCodes;
        }).sort().flat();
      },

      getBitMask() {
        let mask = new Bitset(60);
        for (let r of Array(10).keys())
          for (let c of Array(6).keys())
            if (!(this.m_mask[r][c].value))
              mask.set(c * 10 + r);
        return mask;
      },

      getSchedule: function(i = 0, available = this.getBitMask(), current = new Array()) {
        if (i >= this.classGroups.length) {
          return this.schedules.push(Object({
            "m_time": Bitset.xor(available.copy(), this.getBitMask()),
            "m_classes": [...current],
          }));
        }

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
          console.log();

        Bait.Storage.set("_0x001", JSON.stringify(this.getData()));
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

    watch: {
      m_mask: function() {
        Bait.Storage.set("_0x001", JSON.stringify(this.getData()));
      },
    }
  });

  DEBUG._0x000 = _0x000;
  DEBUG._0x001 = _0x001;
  DEBUG.alert = alert;
})

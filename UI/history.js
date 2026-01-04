const HistoryCmp = {
  props: ["show", "notifications"],
  methods: {
    formatTime(time) {
      return parseGameTime(time);
    },
    secondsToStr(s) {
      if (!s) return '00:00';
      if (s >= 3600) {
        let h = Math.floor(s / 3600);
        let m = Math.floor((s % 3600) / 60);
        return `${h}h ${m}m`;
      }
      let mm = Math.floor(s / 60);
      let ss = s % 60;
      return (mm < 10 ? '0' + mm : mm) + ':' + (ss < 10 ? '0' + ss : ss);
    },
    getNotifs() {
      return this.notifications.map((n) => {
        let label = NOTIF_EVENTS[n.event].getLabel(n);
        if ((n.event === 'ped_left' || n.event === 'car_left') && n.table) {
          try {
            let root = window.__vue_app__;
            if (root && root.orders) {
              let found = (root.orders || []).find((o) => o.table === n.table);
              if (!found) {
                found = (root.orders || []).find((o) => (o.table - 99) === (n.table - 99));
              }
              if (found && found._createdAt) {
                let elapsed = Math.floor((root.nowTS - found._createdAt) / 1000);
                label = `${label} (waited ${this.secondsToStr(elapsed)})`;
              }
            }
          } catch (e) {}
        }
        return {
          type: n.type,
          time: this.formatTime(n.time),
          label: label,
        };
      });
    },
  },
  template: `
        <div class="history-bg cursor-pointer" v-if="show" @click.self="$emit('close')">
            <div class="popup">
                <div class="header flex-center">
                    <h1>History</h1>
                    <spawn class="close cursor-pointer" @click="$emit('close')">X</span>
                </div>
                <div class="notifs-wrapper scrollbar">
                    <div v-for="notif in getNotifs()" :key="notif.id" class="line">
                        <div class="notif">
                            <span class="time outlined">{{notif.time}}</span>
                            <span class="label outlined"> : {{notif.label}}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
};

const CheckCmp = {
  props: ["state"],
  template: `
        <div class="cursor-pointer checkbox" @click="$emit('toggle')">
            <svg v-if="state === true" class="checked" width="200" height="200" viewBox="0 0 200 200">
                <path d="M 195 7 L 77 144 L 38 84 L 4 89 L 66 199 L 90 200 L 197 6 Z" />
            </svg>
        </div>
    `,
};

const HeaderCmp = {
  props: ["driveThruState", "otherState", "itemFilters", "zoomLevel", "avgLeaveSeconds"],
  setup() {
    return {
      showFilterMenu: ref(false),
    };
  },
  computed: {
    avgLeaveStr() {
      let s = this.avgLeaveSeconds || 0;
      if (!s) return '00:00';
      if (s >= 3600) {
        let h = Math.floor(s / 3600);
        let m = Math.floor((s % 3600) / 60);
        return `${h}h ${m}m`;
      }
      let mm = Math.floor(s / 60);
      let ss = s % 60;
      return (mm < 10 ? '0' + mm : mm) + ':' + (ss < 10 ? '0' + ss : ss);
    }
  },
  template: `
          <header class="flex-center">
            <div class="header-btns">
              <img src="UI/assets/history.svg" alt="History" title="History" @click="$emit('open-history')"/>
              <div class="avg-leave">Avg leave: <span class="avg-time">{{avgLeaveStr}}</span></div>
            </div>
            <h1>Customer Orders</h1>
            <div class="checks flex-center">
              <span class="cursor-pointer" @click="$emit('toggle', true)">Drive Thru</span>
              <CheckCmp :state="driveThruState" @toggle="$emit('toggle', true)" />
              <span class="cursor-pointer" @click="$emit('toggle', false)">Other</span>
              <CheckCmp :state="otherState" @toggle="$emit('toggle', false)" />
              
              <div class="filter-menu-wrapper">
                <div class="filter-icon cursor-pointer" @click="showFilterMenu = !showFilterMenu" title="Filter items">
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
                  </svg>
                </div>
                <div v-if="showFilterMenu" class="filter-dropdown">
                  <div class="filter-item" @click.stop="$emit('toggle-filter', 'burger')">
                    <CheckCmp :state="itemFilters.burger" @toggle="$emit('toggle-filter', 'burger')" />
                    <span>Hamburger</span>
                  </div>
                  <div class="filter-item" @click.stop="$emit('toggle-filter', 'nugget')">
                    <CheckCmp :state="itemFilters.nugget" @toggle="$emit('toggle-filter', 'nugget')" />
                    <span>Chicken Nugget</span>
                  </div>
                  <div class="filter-item" @click.stop="$emit('toggle-filter', 'soda')">
                    <CheckCmp :state="itemFilters.soda" @toggle="$emit('toggle-filter', 'soda')" />
                    <span>Soda</span>
                  </div>
                  <div class="filter-item" @click.stop="$emit('toggle-filter', 'icecream')">
                    <CheckCmp :state="itemFilters.icecream" @toggle="$emit('toggle-filter', 'icecream')" />
                    <span>Ice Cream</span>
                  </div>
                  <div class="filter-item" @click.stop="$emit('toggle-filter', 'potatoes')">
                    <CheckCmp :state="itemFilters.potatoes" @toggle="$emit('toggle-filter', 'potatoes')" />
                    <span>French Fries</span>
                  </div>
                  <div class="filter-item" @click.stop="$emit('toggle-filter', 'coffee')">
                    <CheckCmp :state="itemFilters.coffee" @toggle="$emit('toggle-filter', 'coffee')" />
                    <span>Coffee</span>
                  </div>
                  <div class="filter-item" @click.stop="$emit('toggle-filter', 'showFilteredHeader')">
                    <CheckCmp :state="itemFilters.showFilteredHeader" @toggle="$emit('toggle-filter', 'showFilteredHeader')" />
                    <span>Force headers</span>
                  </div>
                  <div class="filter-actions">
                    <button @click.stop="$emit('reset-filters')" class="btn-reset">Reset All</button>
                  </div>
                </div>
              </div>
              
              <div class="zoom-controls">
                <button @click="$emit('zoom-out')" class="zoom-btn" title="Zoom out">−</button>
                <span class="zoom-level">{{Math.round(zoomLevel * 100)}}%</span>
                <button @click="$emit('zoom-in')" class="zoom-btn" title="Zoom in">+</button>
              </div>

            </div>
          </header>
      `,
};
